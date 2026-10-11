"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "@/lib/i18n";

// Muharrir ranglari CSS o'zgaruvchilari orqali — tungi rejimda o'zi o'zgaradi
// (qiymatlar: src/lib/uiTokens.ts, EDITOR_LIGHT / EDITOR_DARK).
export const C = Object.fromEntries(
  ["ink", "ink2", "muted", "faint", "line", "bg", "stage", "card", "gold", "goldSoft", "teal", "danger", "select"].map((k) => [k, `var(--he-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)})`]),
);

export const EDITOR_CSS = `
.he-root { position: fixed; inset: 0; z-index: 90; display: flex; flex-direction: column; background: ${C.bg}; color: ${C.ink}; font-family: Inter, system-ui, sans-serif; font-size: 13px; -webkit-font-smoothing: antialiased; }
.he-root *, .he-root *::before, .he-root *::after { box-sizing: border-box; }
.he-root button { font-family: inherit; }
.he-topbar { height: 56px; flex-shrink: 0; display: flex; align-items: center; gap: 6px; padding: 0 12px; background: ${C.card}; border-bottom: 1px solid ${C.line}; position: relative; z-index: 30; }
.he-main { flex: 1; min-height: 0; display: flex; position: relative; }
.he-rail { width: 72px; flex-shrink: 0; background: ${C.card}; border-right: 1px solid ${C.line}; display: flex; flex-direction: column; align-items: stretch; padding: 8px 6px; gap: 2px; overflow-y: auto; z-index: 25; scrollbar-width: none; }
.he-rail::-webkit-scrollbar { display: none; }
.he-rail-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 9px 2px; border-radius: 10px; border: none; background: transparent; color: ${C.muted}; cursor: pointer; font-size: 10.5px; font-weight: 600; transition: background .12s, color .12s; }
.he-rail-btn:hover { background: color-mix(in srgb, var(--he-ink) 6%, transparent); color: ${C.ink}; }
.he-rail-btn.active { background: rgba(184,134,59,0.14); color: ${C.gold}; }
.he-drawer { position: relative; flex-shrink: 0; width: 320px; background: ${C.card}; border-right: 1px solid ${C.line}; box-shadow: 6px 0 20px rgba(30,26,15,0.06); z-index: 24; display: flex; flex-direction: column; animation: he-drawer-in .16s ease; }
@keyframes he-drawer-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
.he-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; }
.he-drawer-title { font-family: Fraunces, serif; font-size: 18px; font-weight: 500; }
.he-drawer-body { flex: 1; overflow-y: auto; padding: 4px 16px 24px; scrollbar-width: thin; }
.he-section-label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: ${C.faint}; margin: 16px 0 8px; }
.he-stage { flex: 1; min-width: 0; position: relative; overflow: hidden; background: ${C.stage}; touch-action: none; outline: none; }
.he-stage.panning, .he-stage.panning * { cursor: grabbing !important; }
.he-stage.space { cursor: grab; }
.he-page-shadow { position: absolute; box-shadow: 0 1px 2px rgba(30,26,15,0.12), 0 12px 40px rgba(30,26,15,0.16); background: #fff; }
.he-bottombar { height: 92px; flex-shrink: 0; display: flex; align-items: center; gap: 12px; padding: 0 14px; background: ${C.card}; border-top: 1px solid ${C.line}; z-index: 20; }
.he-pages { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; overflow-x: auto; padding: 8px 2px; scrollbar-width: thin; }
.he-thumb { position: relative; flex-shrink: 0; border-radius: 6px; cursor: pointer; outline: 2px solid transparent; outline-offset: 2px; transition: outline-color .12s, transform .12s; box-shadow: 0 1px 4px rgba(30,26,15,0.16); }
.he-thumb:hover { transform: translateY(-1px); }
.he-thumb.active { outline-color: ${C.gold}; }
.he-thumb.drop-before::before { content: ""; position: absolute; left: -7px; top: 0; bottom: 0; width: 3px; border-radius: 2px; background: ${C.gold}; }
.he-thumb-num { position: absolute; left: 5px; bottom: 4px; font-size: 10px; font-weight: 700; color: #fff; background: color-mix(in srgb, var(--he-ink) 60%, transparent); border-radius: 4px; padding: 1px 5px; pointer-events: none; }
.he-thumb-actions { position: absolute; right: 4px; top: 4px; display: none; gap: 3px; }
.he-thumb:hover .he-thumb-actions, .he-thumb.active .he-thumb-actions { display: flex; }
.he-thumb-act { width: 22px; height: 22px; border-radius: 6px; border: none; background: color-mix(in srgb, var(--he-ink) 72%, transparent); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.he-thumb-act:hover { background: ${C.ink}; }
.he-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 9px; border: none; background: transparent; color: ${C.ink}; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .12s, color .12s, opacity .12s; }
.he-btn:hover { background: color-mix(in srgb, var(--he-ink) 7%, transparent); }
.he-btn:disabled { opacity: .38; cursor: default; background: transparent; }
.he-btn.icon { width: 34px; padding: 0; }
.he-btn.primary { background: ${C.ink}; color: #F2EDE2; }
.he-btn.primary:hover { background: #2C3630; }
.he-btn.soft { background: color-mix(in srgb, var(--he-ink) 6%, transparent); }
.he-btn.soft:hover { background: color-mix(in srgb, var(--he-ink) 10%, transparent); }
.he-btn.gold { background: ${C.gold}; color: #fff; }
.he-btn.gold:hover { background: #A47530; }
.he-btn.active { background: rgba(184,134,59,0.16); color: ${C.gold}; }
.he-btn.danger { color: ${C.danger}; }
.he-btn.danger:hover { background: rgba(168,69,58,0.1); }
.he-title-input { font-family: Fraunces, serif; font-size: 17px; font-weight: 500; border: 1px solid transparent; background: transparent; border-radius: 8px; padding: 5px 8px; color: ${C.ink}; width: 260px; max-width: 34vw; outline: none; text-overflow: ellipsis; }
.he-title-input:hover { border-color: ${C.line}; }
.he-title-input:focus { border-color: ${C.gold}; background: #fff; }
.he-save { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: ${C.muted}; padding: 0 8px; white-space: nowrap; }
.he-save.error { color: ${C.danger}; font-weight: 600; }
.he-divider { width: 1px; height: 22px; background: ${C.line}; margin: 0 4px; flex-shrink: 0; }
.he-toolbar { position: absolute; z-index: 40; display: flex; align-items: center; gap: 2px; padding: 4px; background: ${C.card}; border: 1px solid ${C.line}; border-radius: 12px; box-shadow: 0 8px 24px rgba(30,26,15,0.16), 0 1px 3px rgba(30,26,15,0.08); white-space: nowrap; animation: he-pop .12s ease; max-width: calc(100% - 16px); overflow-x: auto; scrollbar-width: none; }
.he-toolbar::-webkit-scrollbar { display: none; }
@keyframes he-pop { from { opacity: 0; transform: translateY(4px) scale(.98); } to { opacity: 1; transform: none; } }
.he-tb { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 32px; min-width: 32px; padding: 0 8px; border-radius: 8px; border: none; background: transparent; color: ${C.ink}; font-size: 12.5px; font-weight: 600; cursor: pointer; flex-shrink: 0; }
.he-tb:hover { background: color-mix(in srgb, var(--he-ink) 7%, transparent); }
.he-tb.active { background: rgba(184,134,59,0.16); color: ${C.gold}; }
.he-tb.danger:hover { background: rgba(168,69,58,0.12); color: ${C.danger}; }
.he-tb:disabled { opacity: .35; cursor: default; background: transparent; }
.he-tb-sep { width: 1px; height: 20px; background: ${C.line}; margin: 0 3px; flex-shrink: 0; }
.he-pop { position: fixed; z-index: 120; background: ${C.card}; border: 1px solid ${C.line}; border-radius: 12px; box-shadow: 0 12px 32px rgba(30,26,15,0.2); padding: 10px; animation: he-pop .12s ease; max-height: min(520px, 80vh); overflow-y: auto; }
.he-menu-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: 8px; border: none; background: transparent; color: ${C.ink}; font-size: 13px; text-align: left; cursor: pointer; }
.he-menu-item:hover { background: color-mix(in srgb, var(--he-ink) 6%, transparent); }
.he-menu-item.danger { color: ${C.danger}; }
.he-menu-item .kbd { margin-left: auto; color: ${C.faint}; font-size: 11.5px; }
.he-menu-item:disabled { opacity: .4; cursor: default; background: transparent; }
.he-swatch { width: 26px; height: 26px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--he-ink) 15%, transparent); cursor: pointer; padding: 0; flex-shrink: 0; }
.he-swatch.active { box-shadow: 0 0 0 2px ${C.card}, 0 0 0 4px ${C.gold}; }
.he-grid { display: grid; gap: 8px; }
.he-tile { position: relative; border-radius: 10px; border: 1px solid ${C.line}; background: #fff; cursor: pointer; overflow: hidden; transition: transform .12s, box-shadow .12s, border-color .12s; padding: 0; }
.he-tile:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(30,26,15,0.12); border-color: ${C.goldSoft}; }
.he-tile-label { position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 8px 6px; font-size: 11px; font-weight: 600; color: #fff; background: linear-gradient(transparent, rgba(0,0,0,0.55)); text-align: left; opacity: 0; transition: opacity .12s; pointer-events: none; }
.he-tile:hover .he-tile-label { opacity: 1; }
.he-chip { height: 30px; padding: 0 12px; border-radius: 15px; border: 1px solid ${C.line}; background: #fff; font-size: 12px; font-weight: 600; color: ${C.muted}; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.he-chip.active { background: ${C.ink}; border-color: ${C.ink}; color: #F2EDE2; }
.he-range { width: 100%; accent-color: ${C.gold}; }
.he-input { width: 100%; height: 34px; border-radius: 8px; border: 1px solid ${C.line}; background: #fff; padding: 0 10px; font-size: 13px; color: ${C.ink}; outline: none; font-family: inherit; }
.he-input:focus { border-color: ${C.gold}; }
.he-drop { border: 1.5px dashed color-mix(in srgb, var(--he-ink) 25%, transparent); border-radius: 12px; padding: 22px 14px; text-align: center; color: ${C.muted}; cursor: pointer; transition: background .12s, border-color .12s; background: rgba(255,255,255,0.6); }
.he-drop:hover, .he-drop.over { border-color: ${C.gold}; background: rgba(184,134,59,0.08); color: ${C.ink}; }
.he-toast { position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%); z-index: 60; background: ${C.ink}; color: #F2EDE2; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; box-shadow: 0 10px 30px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 12px; animation: he-pop .16s ease; max-width: calc(100% - 32px); }
.he-toast button { background: none; border: none; color: ${C.goldSoft}; font-weight: 700; cursor: pointer; font-size: 13px; padding: 0; }
.he-banner { position: absolute; left: 50%; top: 12px; transform: translateX(-50%); z-index: 50; background: ${C.card}; border: 1px solid ${C.goldSoft}; border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 8px 24px rgba(30,26,15,0.16); font-size: 13px; max-width: calc(100% - 32px); }
.he-zoom { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.he-zoom-val { min-width: 54px; height: 30px; border: none; background: transparent; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; color: ${C.ink}; }
.he-zoom-val:hover { background: color-mix(in srgb, var(--he-ink) 7%, transparent); }
.he-handle { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; background: #fff; border: 1.5px solid ${C.select}; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.25); pointer-events: auto; touch-action: none; transition: transform .1s; }
.he-handle:hover { transform: scale(1.25); }
.he-handle.bar-h { width: 22px; height: 8px; margin: -4px 0 0 -11px; border-radius: 4px; }
.he-handle.bar-v { width: 8px; height: 22px; margin: -11px 0 0 -4px; border-radius: 4px; }
.he-rot { position: absolute; width: 28px; height: 28px; margin: -14px 0 0 -14px; border-radius: 50%; background: #fff; border: 1px solid ${C.line}; box-shadow: 0 2px 6px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: ${C.ink}; cursor: grab; pointer-events: auto; touch-action: none; }
.he-rot:active { cursor: grabbing; }
.he-badge { position: absolute; z-index: 45; background: ${C.ink}; color: #fff; font-size: 11px; font-weight: 600; padding: 3px 7px; border-radius: 6px; pointer-events: none; white-space: nowrap; }
.he-preview { position: fixed; inset: 0; z-index: 130; background: #15191A; display: flex; flex-direction: column; color: #F2EDE2; animation: he-fade .2s ease; }
@keyframes he-fade { from { opacity: 0; } to { opacity: 1; } }
.he-preview-nav { width: 52px; height: 52px; border-radius: 50%; border: none; background: rgba(255,255,255,0.1); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.he-preview-nav:hover { background: rgba(255,255,255,0.2); }
.he-preview-nav:disabled { opacity: .25; cursor: default; }
.he-spin { animation: he-spin .9s linear infinite; }
@keyframes he-spin { to { transform: rotate(360deg); } }
.he-layer-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; cursor: pointer; font-size: 12.5px; border: 1px solid transparent; }
.he-layer-row:hover { background: color-mix(in srgb, var(--he-ink) 5%, transparent); }
.he-layer-row.sel { background: rgba(184,134,59,0.12); border-color: rgba(184,134,59,0.3); }
.he-layer-row.over { border-top: 2px solid ${C.gold}; }
.he-kbd { display: inline-block; min-width: 22px; padding: 2px 6px; border-radius: 5px; background: color-mix(in srgb, var(--he-ink) 7%, transparent); border: 1px solid ${C.line}; font-size: 11.5px; font-weight: 600; text-align: center; }
@media (max-width: 768px) {
  .he-topbar { height: 52px; padding: 0 6px; gap: 2px; }
  .he-title-input { width: 130px; font-size: 15px; }
  .he-hide-sm { display: none !important; }
  .he-main { flex-direction: column-reverse; }
  .he-rail { width: 100%; height: 62px; flex-direction: row; border-right: none; border-top: 1px solid ${C.line}; padding: 4px; overflow-x: auto; overflow-y: hidden; }
  .he-rail-btn { min-width: 62px; padding: 6px 2px; }
  .he-drawer { position: absolute; left: 0; right: 0; top: auto; bottom: 62px; width: auto; height: 52vh; border-right: none; border-top: 1px solid ${C.line}; border-radius: 16px 16px 0 0; box-shadow: 0 -10px 30px rgba(30,26,15,0.16); animation: he-sheet-in .18s ease; }
  @keyframes he-sheet-in { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }
  .he-bottombar { height: 78px; padding: 0 8px; }
  .he-toast { bottom: 150px; }
}
/* Telefon yotqizilgan (gorizontal) holat: balandlik kam — hamma panel ixcham, canvas imkon qadar katta. */
@media (max-height: 520px) and (orientation: landscape) {
  .he-topbar { height: 44px; padding: 0 6px; gap: 2px; }
  .he-topbar .he-btn { height: 30px; }
  .he-title-input { font-size: 14px; width: 150px; }
  .he-hide-sm { display: none !important; }
  .he-main { flex-direction: row; }
  .he-rail { width: 54px; height: auto; flex-direction: column; border-top: none; border-right: 1px solid ${C.line}; padding: 4px; overflow-y: auto; }
  .he-rail-btn { min-width: 0; padding: 6px 0; }
  .he-rail-btn span { display: none; }
  .he-drawer { position: absolute; left: 54px; top: 0; bottom: 0; right: auto; width: min(300px, 60vw); height: auto; border-radius: 0; border-top: none; animation: he-drawer-in .16s ease; }
  .he-bottombar { height: 56px; padding: 0 8px; }
  .he-thumb .he-thumb-actions { display: none !important; }
  .he-toast { bottom: 70px; }
}
@media (prefers-reduced-motion: reduce) { .he-root *, .he-preview * { animation: none !important; transition: none !important; } }
`;

/** Tugma yoki boshqa element atrofida chiqadigan kichik oyna. */
export function Popover({ anchor, open, onClose, children, width = 240, placement = "bottom", align = "center" }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const h = ref.current?.offsetHeight || 200;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = align === "start" ? r.left : align === "end" ? r.right - width : r.left + r.width / 2 - width / 2;
    left = Math.max(8, Math.min(vw - width - 8, left));
    let top = placement === "top" ? r.top - h - 8 : r.bottom + 8;
    if (placement !== "top" && top + h > vh - 8) top = Math.max(8, r.top - h - 8);
    if (placement === "top" && top < 8) top = r.bottom + 8;
    setPos({ left, top });
  }, [open, anchor, width, placement, align, children]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current?.contains(e.target) || anchor?.contains(e.target)) return;
      onClose?.();
    };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose?.(); } };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose, anchor]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      className="he-pop"
      style={{ width, left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

/** Popover ochadigan tugma. */
export function PopButton({ icon, label, title, children, width, className = "he-tb", active, disabled, placement, align, keepOpen }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <button
        ref={setAnchor}
        type="button"
        className={`${className}${active || open ? " active" : ""}`}
        title={title}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}{label}
      </button>
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} width={width} placement={placement} align={align}>
        {typeof children === "function" ? children(() => setOpen(false)) : children}
        {keepOpen ? null : null}
      </Popover>
    </>
  );
}

export function Swatches({ colors, value, onChange, allowCustom = true }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className={`he-swatch${value?.toLowerCase() === c.toLowerCase() ? " active" : ""}`}
          style={{ background: c }}
          title={c}
          onClick={() => onChange(c)}
        />
      ))}
      {allowCustom && (
        <label className="he-swatch" title={t("Boshqa rang")} style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)", position: "relative", overflow: "hidden" }}>
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#b8863b"}
            onChange={(e) => onChange(e.target.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
          />
        </label>
      )}
    </div>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, onCommit, suffix = "", format }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: C.ink }}>{format ? format(value) : `${Math.round(value * 100) / 100}${suffix}`}</span>
      </div>
      <input
        type="range"
        className="he-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={() => onCommit?.()}
        onKeyUp={() => onCommit?.()}
      />
    </div>
  );
}
