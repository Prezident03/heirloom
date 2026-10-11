"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from "lucide-react";
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
  const swipe = useRef(null);
  const swiped = useRef(false);

  useEffect(() => {
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => { window.removeEventListener("resize", measure); document.removeEventListener("fullscreenchange", onFs); };
  }, []);

  const go = (d) => setIndex((i) => Math.max(0, Math.min(pages.length - 1, i + d)));

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.closest?.("input, textarea, [contenteditable='true']")) return;
      if (e.key === "Escape" && onClose && !document.fullscreenElement) { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); e.stopPropagation(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); e.stopPropagation(); go(-1); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

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
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", touchAction: "pan-y", minHeight: 0 }}
        onTouchStart={(e) => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          const st = swipe.current;
          swipe.current = null;
          if (!st) return;
          const dx = e.changedTouches[0].clientX - st.x, dy = e.changedTouches[0].clientY - st.y;
          if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
          swiped.current = true;
          go(dx < 0 ? 1 : -1);
        }}
      >
        {pages.length > 1 && (
          <button type="button" className="he-preview-nav" style={arrowStyle("left")} onClick={() => go(-1)} disabled={index === 0} title="Oldingi">
            <ChevronLeft size={small ? 22 : 26} />
          </button>
        )}
        <div
          key={page.id}
          style={{ width: PAGE_W * s, height: PAGE_H * s, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", borderRadius: 3, overflow: "hidden", animation: "he-fade .25s ease", flexShrink: 0 }}
          onClick={(e) => {
            if (swiped.current) { swiped.current = false; return; }
            if (!small && !overlay) return;
            const r = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - r.left;
            if (x > r.width * 0.7) go(1);
            else if (x < r.width * 0.3) go(-1);
          }}
        >
          <div style={{ transform: `scale(${s})`, transformOrigin: "0 0", width: PAGE_W, height: PAGE_H }}>
            <PageView page={page} mode="preview" />
          </div>
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
            onClick={() => setIndex(i)}
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
