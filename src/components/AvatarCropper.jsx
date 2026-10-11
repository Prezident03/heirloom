"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, RotateCcw, RotateCw, FlipHorizontal2, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";

// ============================================================
// Profil rasmi uchun kesish oynasi (Telegram uslubida):
// rasm doira ostida suriladi, kattalashtiriladi, buriladi —
// natijada faqat doira ichidagi qism kvadrat JPEG sifatida chiqadi.
// ============================================================

const OUTPUT_SIZE = 800;
const MAX_ZOOM = 6;
export const MAX_SOURCE_BYTES = 60 * 1024 * 1024;

function isHeic(file) {
  const name = (file.name || "").toLowerCase();
  return /image\/hei[cf]/.test(file.type) || name.endsWith(".heic") || name.endsWith(".heif");
}

/** Faylni brauzer chiza oladigan rasmga aylantiradi (HEIC/HEIF ham). */
export async function loadImageFile(file) {
  let blob = file;
  if (isHeic(file)) {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    blob = Array.isArray(out) ? out[0] : out;
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    if (!img.naturalWidth) throw new Error("empty");
    return { img, url };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Bu rasm formatini ochib bo'lmadi. JPG, PNG, WEBP, HEIC, GIF yoki AVIF tanlang.");
  }
}

export function AvatarCropper({ file, onCancel, onConfirm, saving }) {
  const [src, setSrc] = useState(null); // { img, url }
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rot, setRot] = useState(0);
  const [flip, setFlip] = useState(false);
  const [stage, setStage] = useState(340);
  const pointers = useRef(new Map());
  const gesture = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let url = null;
    loadImageFile(file)
      .then((res) => { url = res.url; if (!cancelled) setSrc(res); else URL.revokeObjectURL(res.url); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [file]);

  useEffect(() => {
    const measure = () => setStage(Math.max(220, Math.min(380, window.innerWidth - 48, window.innerHeight - 290)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const D = stage * 0.86; // doira diametri
  const nw = src?.img.naturalWidth || 1, nh = src?.img.naturalHeight || 1;
  const rotated = rot % 180 !== 0;
  const rw = rotated ? nh : nw, rh = rotated ? nw : nh;
  const base = D / Math.min(rw, rh); // doirani to'liq qoplash uchun minimal masshtab
  const total = base * zoom;

  const clamp = (o, z = zoom) => {
    const t = base * z;
    const mx = Math.max(0, (rw * t - D) / 2), my = Math.max(0, (rh * t - D) / 2);
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };

  const setZoomAround = (z, anchor) => {
    const nz = Math.max(1, Math.min(MAX_ZOOM, z));
    // Kursor ostidagi nuqta joyida qolishi uchun offsetni ham o'zgartiramiz.
    const a = anchor || { x: 0, y: 0 };
    const k = nz / zoom;
    setOffset((o) => clamp({ x: a.x - (a.x - o.x) * k, y: a.y - (a.y - o.y) * k }, nz));
    setZoom(nz);
  };

  const localPoint = (e, el) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { type: "pinch", d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: zoom };
    } else {
      gesture.current = { type: "pan", sx: e.clientX, sy: e.clientY, o0: offset };
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      setZoomAround(g.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / g.d0));
    } else if (g.type === "pan") {
      setOffset(clamp({ x: g.o0.x + e.clientX - g.sx, y: g.o0.y + e.clientY - g.sy }));
    }
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      const [p] = [...pointers.current.values()];
      gesture.current = { type: "pan", sx: p.x, sy: p.y, o0: offset };
    } else if (pointers.current.size === 0) gesture.current = null;
  };

  // G'ildirak bilan kattalashtirish (passive emas — sahifa aylanmasligi uchun).
  const stageRef = useRef(null);
  const wheelRef = useRef(null);
  useEffect(() => {
    wheelRef.current = (e) => {
      e.preventDefault();
      setZoomAround(zoom * Math.exp(-e.deltaY * 0.0018), localPoint(e, stageRef.current));
    };
  });
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const h = (e) => wheelRef.current?.(e);
    node.addEventListener("wheel", h, { passive: false });
    return () => node.removeEventListener("wheel", h);
  }, [src]);

  const rotateBy = (d) => {
    setRot((r) => (r + d + 360) % 360);
    setOffset({ x: 0, y: 0 });
  };

  const reset = () => { setZoom(1); setOffset({ x: 0, y: 0 }); setRot(0); setFlip(false); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !saving) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, saving]);

  const confirm = async () => {
    if (!src) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.imageSmoothingQuality = "high";
    const k = OUTPUT_SIZE / D;
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.scale(k, k);
    ctx.translate(offset.x, offset.y);
    ctx.rotate((rot * Math.PI) / 180);
    if (flip) ctx.scale(-1, 1);
    ctx.scale(total, total);
    ctx.drawImage(src.img, -nw / 2, -nh / 2);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) { setError("Rasmni tayyorlab bo'lmadi."); return; }
    onConfirm(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
  };

  const imgStyle = {
    position: "absolute", left: "50%", top: "50%", width: nw, height: nh, maxWidth: "none",
    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rot}deg) scale(${flip ? -total : total}, ${total})`,
    transformOrigin: "center", userSelect: "none", pointerEvents: "none",
  };

  const iconBtn = { width: 40, height: 40, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

  return createPortal(
    <div
      role="dialog"
      aria-label="Profil rasmini kesish"
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(12,15,13,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Inter, sans-serif" }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onCancel(); }}
    >
      <div style={{ background: "#1C211E", borderRadius: 18, padding: 18, width: stage + 36, maxWidth: "100%", color: "#F2EDE2", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 18 }}>Rasmni joylashtiring</div>
          <button type="button" onClick={onCancel} disabled={saving} style={{ ...iconBtn, width: 32, height: 32, background: "transparent" }} title="Yopish"><X size={18} /></button>
        </div>

        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => setZoomAround(zoom < 2 ? 2 : 1, localPoint(e, e.currentTarget))}
          style={{ position: "relative", width: stage, height: stage, margin: "0 auto", overflow: "hidden", borderRadius: 12, background: "#0E1110", touchAction: "none", cursor: src ? "grab" : "default" }}
        >
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src.url} alt="" draggable={false} style={imgStyle} />
          )}
          {/* Doiradan tashqarini qoraytiruvchi niqob */}
          <div style={{ position: "absolute", left: "50%", top: "50%", width: D, height: D, marginLeft: -D / 2, marginTop: -D / 2, borderRadius: "50%", boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)", border: "2px solid rgba(255,255,255,0.85)", pointerEvents: "none" }} />
          {!src && !error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              <Loader2 size={18} style={{ animation: "fm-spin 0.9s linear infinite" }} /> Rasm ochilmoqda…
            </div>
          )}
          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", color: "#F2B8AE", fontSize: 13, lineHeight: 1.5 }}>{error}</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 4px 12px" }}>
          <ZoomOut size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!src}
            onChange={(e) => setZoomAround(Number(e.target.value))}
            aria-label="Kattalashtirish"
            style={{ flex: 1, accentColor: TOKENS.gold }}
          />
          <ZoomIn size={16} style={{ opacity: 0.7, flexShrink: 0 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" style={iconBtn} onClick={() => rotateBy(-90)} disabled={!src} title="Chapga burish"><RotateCcw size={17} /></button>
          <button type="button" style={iconBtn} onClick={() => rotateBy(90)} disabled={!src} title="O'ngga burish"><RotateCw size={17} /></button>
          <button type="button" style={{ ...iconBtn, background: flip ? "rgba(184,134,59,0.35)" : iconBtn.background }} onClick={() => setFlip((f) => !f)} disabled={!src} title="Ko'zgu aks"><FlipHorizontal2 size={17} /></button>
          <button type="button" style={{ ...iconBtn, width: "auto", padding: "0 12px", fontSize: 12.5, fontWeight: 600 }} onClick={reset} disabled={!src}>Qayta</button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={confirm}
            disabled={!src || saving}
            style={{ height: 40, padding: "0 18px", borderRadius: 10, border: "none", background: TOKENS.gold, color: "#fff", fontSize: 14, fontWeight: 600, cursor: !src || saving ? "default" : "pointer", opacity: !src || saving ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}
          >
            {saving && <Loader2 size={15} style={{ animation: "fm-spin 0.9s linear infinite" }} />}
            {saving ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </div>
        <div style={{ fontSize: 11.5, opacity: 0.55, marginTop: 12, textAlign: "center" }}>
          Surib joylashtiring · g&apos;ildirak yoki ikki barmoq bilan kattalashtiring
        </div>
      </div>
    </div>,
    document.body
  );
}
