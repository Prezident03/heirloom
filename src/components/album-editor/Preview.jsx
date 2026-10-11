"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { PAGE_W, PAGE_H } from "./constants";
import { PageView } from "./ElementView";

/**
 * Ko'rish rejimi: albom haqiqiy ko'rinishda, hech qanday tahrir UI'siz.
 * Sahifa ekranga sig'adigan eng katta o'lchamda chiziladi; past ekranlarda
 * (masalan, telefon yotqizilganda) sarlavha va boshqaruvlar sahifa ustida
 * suzib turadi va bir necha soniyadan keyin yashirinadi.
 */
export function Preview({ pages, startIndex = 0, title, subtitle, onClose, footer, actions }) {
  const rootRef = useRef(null);
  const [index, setIndex] = useState(startIndex);
  const [size, setSize] = useState({ w: 1200, h: 800 });
  const [chromeVisible, setChromeVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimer = useRef(null);
  // Yaqinlashtirish: zoom (1 = sahifa ekranga sig'adi) va surish (px, sahifa markaziga nisbatan).
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const areaRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.removeEventListener("resize", measure); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const go = (d) => {
    setIndex((i) => Math.max(0, Math.min(pages.length - 1, i + d)));
    setView({ z: 1, x: 0, y: 0 });
  };
  const goTo = (i) => { setIndex(i); setView({ z: 1, x: 0, y: 0 }); };


  const small = size.w < 700;
  // Past ekran (telefon gorizontal holatda yoki kichik oyna): boshqaruvlar sahifa ustida.
  const overlay = size.h < 560 || (small && size.w > size.h);

  const poke = () => {
    if (!overlay) return;
    setChromeVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2800);
  };
  useEffect(() => {
    if (!overlay) return undefined;
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2800);
    return () => clearTimeout(hideTimer.current);
  }, [overlay]);

  const headerH = overlay ? 0 : 58;
  const dotsH = overlay ? 0 : 48;
  const footH = overlay || !footer ? 0 : 32;
  const availW = size.w - (overlay ? 8 : small ? 16 : 40);
  const availH = size.h - headerH - dotsH - footH - (overlay ? 8 : 12);
  const s = Math.max(0.1, Math.min(availW / PAGE_W, availH / PAGE_H));
  const page = pages[Math.min(index, pages.length - 1)];
  const show = !overlay || chromeVisible;
  const pw = PAGE_W * s, ph = PAGE_H * s;
  const MAX_Z = 5;

  // Sahifa chetlari ekran chetidan ichkariga kirib ketmasligi uchun surishni cheklaymiz.
  const clampView = (v) => {
    const r = areaRef.current?.getBoundingClientRect();
    const aw = r?.width || size.w, ah = r?.height || size.h;
    const mx = Math.max(0, (pw * v.z - aw) / 2 + 24), my = Math.max(0, (ph * v.z - ah) / 2 + 24);
    return v.z <= 1.001 ? { z: 1, x: 0, y: 0 } : { z: v.z, x: Math.max(-mx, Math.min(mx, v.x)), y: Math.max(-my, Math.min(my, v.y)) };
  };
  // anchor — maydon markaziga nisbatan nuqta (px); shu nuqta joyida qolib kattalashadi.
  const zoomAt = (nz, anchor, base = view) => {
    const z = Math.max(1, Math.min(MAX_Z, nz));
    const a = anchor || { x: 0, y: 0 };
    const k = z / base.z;
    return clampView({ z, x: a.x - (a.x - base.x) * k, y: a.y - (a.y - base.y) * k });
  };
  const zoomBy = (f) => setView((v) => zoomAt(v.z * f, null, v));
  const localPt = (cx, cy) => {
    const r = areaRef.current.getBoundingClientRect();
    return { x: cx - r.left - r.width / 2, y: cy - r.top - r.height / 2 };
  };

  // G'ildirak bilan yaqinlashtirish (sahifa aylanib ketmasligi uchun passive emas).
  const wheelRef = useRef(null);
  useEffect(() => {
    wheelRef.current = (e) => {
      e.preventDefault();
      const f = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025));
      setView((v) => zoomAt(v.z * f, localPt(e.clientX, e.clientY), v));
    };
  });
  useEffect(() => {
    const node = areaRef.current;
    if (!node) return undefined;
    const h = (e) => wheelRef.current?.(e);
    node.addEventListener("wheel", h, { passive: false });
    return () => node.removeEventListener("wheel", h);
  }, []);

  const onDown = (e) => {
    if (e.target.closest("button")) return;
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const m = localPt((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
      gesture.current = { type: "pinch", d0: d, m0: m, v0: view };
    } else if (pts.length === 1) {
      gesture.current = { type: "drag", sx: e.clientX, sy: e.clientY, v0: view, moved: false, t: Date.now() };
    }
  };
  const onMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === "pinch") {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const m = localPt((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
      const zoomed = zoomAt(g.v0.z * (d / g.d0), g.m0, g.v0);
      setView(clampView({ ...zoomed, x: zoomed.x + (m.x - g.m0.x), y: zoomed.y + (m.y - g.m0.y) }));
      return;
    }
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (Math.hypot(dx, dy) > 6) g.moved = true;
    if (g.v0.z > 1) setView(clampView({ ...g.v0, x: g.v0.x + dx, y: g.v0.y + dy }));
  };
  const onUp = (e) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (pointers.current.size === 1 && g?.type === "pinch") {
      const [p] = [...pointers.current.values()];
      gesture.current = { type: "drag", sx: p.x, sy: p.y, v0: view, moved: true, t: Date.now() };
      return;
    }
    if (pointers.current.size > 0) return;
    gesture.current = null;
    setDragging(false);
    if (!g || g.type !== "drag") return;
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    // Kattalashtirilmagan holatda — chapga/o'ngga surish sahifani almashtiradi.
    if (g.v0.z <= 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) { go(dx < 0 ? 1 : -1); return; }
    if (g.moved) return;
    // Ikki marta tegish/bosish — yaqinlashtirish yoki asl holatga qaytarish.
    const now = Date.now();
    const pt = localPt(e.clientX, e.clientY);
    if (now - lastTap.current < 300) {
      clearTimeout(tapTimer.current);
      lastTap.current = 0;
      setView((v) => (v.z > 1.05 ? { z: 1, x: 0, y: 0 } : zoomAt(2.5, pt, v)));
      return;
    }
    lastTap.current = now;
    // Bitta tegish (telefonda): sahifa chetiga tegilsa — keyingi/oldingi sahifa.
    if ((small || overlay) && view.z <= 1) {
      const rel = (pt.x + pw / 2) / pw;
      clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => { if (rel > 0.75) go(1); else if (rel < 0.25) go(-1); }, 300);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.closest?.("input, textarea, [contenteditable='true']")) return;
      if (e.key === "Escape" && onClose && !document.fullscreenElement) { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); e.stopPropagation(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); e.stopPropagation(); go(-1); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(1.5); }
      else if (e.key === "-") { e.preventDefault(); zoomBy(1 / 1.5); }
      else if (e.key === "0") { e.preventDefault(); setView({ z: 1, x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else rootRef.current?.requestFullscreen?.().catch(() => {});
    } catch { /* ignore */ }
  };

  const header = (
    <div
      style={{
        height: overlay ? 52 : headerH, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 14px",
        ...(overlay ? { position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, background: "linear-gradient(rgba(0,0,0,0.65), transparent)", opacity: show ? 1 : 0, transition: "opacity .25s", pointerEvents: show ? "auto" : "none" } : null),
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, opacity: 0.92, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {actions}
        <button type="button" className="he-preview-nav" style={{ width: 40, height: 40 }} onClick={toggleFullscreen} title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}>
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        {onClose && <button type="button" className="he-preview-nav" style={{ width: 40, height: 40 }} onClick={onClose} title="Yopish (Esc)"><X size={20} /></button>}
      </div>
    </div>
  );

  const arrowStyle = (side) => ({
    position: "absolute", top: "50%", [side]: overlay ? 6 : small ? 4 : 16, transform: "translateY(-50%)", zIndex: 2,
    opacity: show ? 1 : 0, transition: "opacity .25s", pointerEvents: show ? "auto" : "none",
    background: "rgba(20,25,26,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
    ...(small ? { width: 40, height: 40 } : null),
  });

  return (
    <div ref={rootRef} className="he-preview" role="dialog" aria-label="Albomni ko'rish" onPointerMove={poke} onPointerDown={poke}>
      {header}
      <div
        ref={areaRef}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", touchAction: "none", minHeight: 0, overflow: "hidden", cursor: view.z > 1 ? "grab" : "default" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {pages.length > 1 && (
          <button type="button" className="he-preview-nav" style={arrowStyle("left")} onClick={() => go(-1)} disabled={index === 0} title="Oldingi">
            <ChevronLeft size={small ? 22 : 26} />
          </button>
        )}
        <div
          key={page.id}
          style={{
            width: pw, height: ph, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", borderRadius: 3, overflow: "hidden", flexShrink: 0,
            animation: view.z === 1 ? "he-fade .25s ease" : undefined,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
            transformOrigin: "center",
            transition: dragging ? "none" : "transform .18s ease-out",
          }}
        >
          <div style={{ transform: `scale(${s})`, transformOrigin: "0 0", width: PAGE_W, height: PAGE_H }}>
            <PageView page={page} mode="preview" />
          </div>
        </div>
        <div
          style={{ position: "absolute", right: overlay ? 8 : 16, bottom: overlay ? 46 : 12, zIndex: 2, display: "flex", alignItems: "center", gap: 4, background: "rgba(20,25,26,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", borderRadius: 22, padding: 4, opacity: show ? 1 : 0, transition: "opacity .25s", pointerEvents: show ? "auto" : "none" }}
        >
          <button type="button" className="he-preview-nav" style={{ width: 34, height: 34, background: "transparent" }} onClick={() => zoomBy(1 / 1.5)} disabled={view.z <= 1} title="Kichraytirish (−)"><ZoomOut size={17} /></button>
          <button type="button" onClick={() => setView({ z: 1, x: 0, y: 0 })} title="Asl o'lcham (0)" style={{ minWidth: 48, height: 34, border: "none", background: "transparent", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>{Math.round(view.z * 100)}%</button>
          <button type="button" className="he-preview-nav" style={{ width: 34, height: 34, background: "transparent" }} onClick={() => zoomBy(1.5)} disabled={view.z >= MAX_Z} title="Kattalashtirish (+)"><ZoomIn size={17} /></button>
        </div>
        {pages.length > 1 && (
          <button type="button" className="he-preview-nav" style={arrowStyle("right")} onClick={() => go(1)} disabled={index >= pages.length - 1} title="Keyingi">
            <ChevronRight size={small ? 22 : 26} />
          </button>
        )}
      </div>
      <div
        style={{
          height: overlay ? 40 : dotsH, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          ...(overlay ? { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, background: "linear-gradient(transparent, rgba(0,0,0,0.55))", opacity: show ? 1 : 0, transition: "opacity .25s", pointerEvents: show ? "auto" : "none" } : null),
        }}
      >
        {pages.length <= 24 && pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Sahifa ${i + 1}`}
            style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, border: "none", background: i === index ? "#D9BC85" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "width .2s", padding: 0 }}
          />
        ))}
        <span style={{ marginLeft: 12, fontSize: 13, opacity: 0.75 }}>{index + 1} / {pages.length}</span>
      </div>
      {!overlay && footer}
    </div>
  );
}
