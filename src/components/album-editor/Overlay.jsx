"use client";

import React from "react";
import { RotateCw, Lock } from "lucide-react";
import { aabb, unionBounds } from "./model";
import { cursorForHandle } from "./geometry";
import { photoInnerBox, imageBox, clampCrop } from "./ElementView";
import { filterCss } from "./constants";
import { C } from "./ui";
import { t } from "@/lib/i18n";

const GUIDE = "#D6336C";

function boxStyle(el, v) {
  return {
    position: "absolute",
    left: v.ox + el.x * v.s,
    top: v.oy + el.y * v.s,
    width: el.w * v.s,
    height: el.h * v.s,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    pointerEvents: "none",
  };
}

function Handles({ w, h, rotation, handles, showRotate }) {
  const pos = { nw: [0, 0], n: [0.5, 0], ne: [1, 0], e: [1, 0.5], se: [1, 1], s: [0.5, 1], sw: [0, 1], w: [0, 0.5] };
  return (
    <>
      {handles.map((hd) => {
        const [fx, fy] = pos[hd];
        const bar = hd === "n" || hd === "s" ? " bar-h" : hd === "e" || hd === "w" ? " bar-v" : "";
        return (
          <div
            key={hd}
            data-handle={hd}
            className={`he-handle${bar}`}
            style={{ left: fx * w, top: fy * h, cursor: cursorForHandle(hd, rotation) }}
          />
        );
      })}
      {showRotate && (
        <div data-handle="rot" className="he-rot" style={{ left: w / 2, top: h + 30 }} title={t("Aylantirish (Shift — 15°)")}>
          <RotateCw size={14} />
        </div>
      )}
    </>
  );
}

export function SelectionOverlay({ els, view, hoverEl, hideHandles, groupMode }) {
  const nodes = [];
  if (hoverEl && !els.some((e) => e.id === hoverEl.id)) {
    nodes.push(<div key="hover" style={{ ...boxStyle(hoverEl, view), outline: `1.5px solid ${C.select}`, opacity: 0.6 }} />);
  }
  if (els.length === 1 && !groupMode) {
    const el = els[0];
    const w = el.w * view.s, h = el.h * view.s;
    let handles = [];
    if (!el.locked && !hideHandles) {
      handles = ["nw", "ne", "se", "sw"];
      if (el.type === "text") { if (h > 18) handles.push("e", "w"); }
      else {
        if (w > 44) handles.push("n", "s");
        if (h > 44) handles.push("e", "w");
      }
    }
    nodes.push(
      <div key="sel" style={{ ...boxStyle(el, view), outline: `${el.locked ? "1.5px dashed" : "2px solid"} ${C.select}` }}>
        {!hideHandles && <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><Handles w={w} h={h} rotation={el.rotation} handles={handles} showRotate={!el.locked && !hideHandles} /></div>}
        {el.locked && (
          <div style={{ position: "absolute", right: -10, top: -10, width: 22, height: 22, borderRadius: "50%", background: C.select, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <Lock size={12} />
          </div>
        )}
      </div>
    );
  } else if (els.length > 0) {
    for (const el of els) nodes.push(<div key={`o-${el.id}`} style={{ ...boxStyle(el, view), outline: `1px solid ${C.select}`, opacity: 0.85 }} />);
    const b = unionBounds(els);
    const anyLocked = els.some((e) => e.locked);
    const w = b.w * view.s, h = b.h * view.s;
    nodes.push(
      <div key="group" style={{ position: "absolute", left: view.ox + b.x * view.s, top: view.oy + b.y * view.s, width: w, height: h, outline: `${groupMode ? "2px solid" : "1.5px dashed"} ${C.select}`, pointerEvents: "none" }}>
        {!anyLocked && !hideHandles && <Handles w={w} h={h} rotation={0} handles={["nw", "ne", "se", "sw"]} showRotate />}
      </div>
    );
  }
  return <>{nodes}</>;
}

export function GuidesOverlay({ guides, spacing, view }) {
  if (!guides?.length && !spacing?.length) return null;
  return (
    <>
      {guides?.map((g, i) => g.axis === "x" ? (
        <div key={`g${i}`} style={{ position: "absolute", left: view.ox + g.v * view.s - 0.5, top: view.oy + g.from * view.s, width: 1, height: Math.max(1, (g.to - g.from) * view.s), background: GUIDE, pointerEvents: "none", boxShadow: g.center ? `0 0 0 0.5px ${GUIDE}` : undefined }} />
      ) : (
        <div key={`g${i}`} style={{ position: "absolute", top: view.oy + g.v * view.s - 0.5, left: view.ox + g.from * view.s, height: 1, width: Math.max(1, (g.to - g.from) * view.s), background: GUIDE, pointerEvents: "none" }} />
      ))}
      {spacing?.map((m, i) => {
        const len = (m.to - m.from) * view.s;
        const label = Math.round(m.to - m.from);
        if (m.axis === "x") {
          const left = view.ox + m.from * view.s, top = view.oy + m.at * view.s;
          return (
            <div key={`s${i}`} style={{ position: "absolute", left, top: top - 0.5, width: len, height: 1, background: GUIDE, pointerEvents: "none" }}>
              <span style={{ position: "absolute", left: "50%", top: -18, transform: "translateX(-50%)", fontSize: 10, fontWeight: 700, color: "#fff", background: GUIDE, borderRadius: 4, padding: "1px 4px" }}>{label}</span>
            </div>
          );
        }
        const top = view.oy + m.from * view.s, left = view.ox + m.at * view.s;
        return (
          <div key={`s${i}`} style={{ position: "absolute", top, left: left - 0.5, height: len, width: 1, background: GUIDE, pointerEvents: "none" }}>
            <span style={{ position: "absolute", top: "50%", left: 6, transform: "translateY(-50%)", fontSize: 10, fontWeight: 700, color: "#fff", background: GUIDE, borderRadius: 4, padding: "1px 4px" }}>{label}</span>
          </div>
        );
      })}
    </>
  );
}

export function MarqueeOverlay({ rect, view }) {
  if (!rect) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: view.ox + rect.x * view.s, top: view.oy + rect.y * view.s,
        width: rect.w * view.s, height: rect.h * view.s,
        background: "rgba(184,134,59,0.10)", border: `1px solid ${C.select}`, pointerEvents: "none",
      }}
    />
  );
}

/**
 * Crop rejimi: rasmning ramkadan tashqaridagi qismi xira ko'rinadi,
 * foydalanuvchi uni sudrab joylashtiradi, burchaklardan kattalashtiradi.
 */
export function CropOverlay({ el, view }) {
  if (!el || !el.src) return null;
  const { ix, iy, iw, ih } = photoInnerBox(el);
  const crop = clampCrop(el.crop || { s: 1, cx: 0.5, cy: 0.5 }, iw, ih, el.aspect, el.imgRot);
  const box = imageBox(crop, iw, ih, el.aspect, el.imgRot);
  const s = view.s;
  const rotated = el.imgRot % 180 !== 0;
  const innerW = (rotated ? box.H : box.W) * s;
  const innerH = (rotated ? box.W : box.H) * s;
  const W = box.W * s, H = box.H * s;
  const tf = [`rotate(${el.imgRot || 0}deg)`, el.flipH ? "scaleX(-1)" : "", el.flipV ? "scaleY(-1)" : ""].join(" ");
  const gx = (ix + box.left) * s, gy = (iy + box.top) * s;
  return (
    <div style={{ ...boxStyle(el, view), pointerEvents: "none" }}>
      <div data-crop="1" style={{ position: "absolute", left: gx, top: gy, width: W, height: H, pointerEvents: "auto", cursor: "move", touchAction: "none" }}>
        {el.type === "video" ? (
          <div style={{ position: "absolute", inset: 0, background: "rgba(30,38,33,0.25)" }} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={el.src}
            alt=""
            draggable={false}
            crossOrigin="anonymous"
            style={{ position: "absolute", left: (W - innerW) / 2, top: (H - innerH) / 2, width: innerW, height: innerH, transform: tf, filter: filterCss(el.filter), opacity: 0.38, pointerEvents: "none", maxWidth: "none" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, outline: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 0 0 1px rgba(0,0,0,0.25)", pointerEvents: "none" }} />
        {["nw", "ne", "se", "sw"].map((hd) => (
          <div
            key={hd}
            data-handle={`crop-${hd}`}
            className="he-handle"
            style={{ left: hd.includes("w") ? 0 : W, top: hd.includes("n") ? 0 : H, cursor: cursorForHandle(hd, el.rotation) }}
          />
        ))}
      </div>
      <div style={{ position: "absolute", left: ix * s, top: iy * s, width: iw * s, height: ih * s, outline: `2px solid ${C.select}`, pointerEvents: "none" }}>
        {[1, 2].map((i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: `${(i * 100) / 3}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.55)" }} />
            <div style={{ position: "absolute", top: `${(i * 100) / 3}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.55)" }} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/** Tanlangan elementlarning ekrandagi to'rtburchagi (toolbar joylashuvi uchun). */
export function screenBounds(els, view) {
  if (!els.length) return null;
  const b = els.length === 1 ? aabb(els[0]) : unionBounds(els);
  return {
    left: view.ox + b.minX * view.s,
    top: view.oy + b.minY * view.s,
    right: view.ox + b.maxX * view.s,
    bottom: view.oy + b.maxY * view.s,
  };
}
