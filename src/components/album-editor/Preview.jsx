"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PAGE_W, PAGE_H } from "./constants";
import { PageView } from "./ElementView";

/** Ko'rish rejimi: albom haqiqiy ko'rinishda, hech qanday tahrir UI'siz. */
export function Preview({ pages, startIndex = 0, title, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [size, setSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setIndex((i) => Math.min(pages.length - 1, i + 1)); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); e.stopPropagation(); setIndex((i) => Math.max(0, i - 1)); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [pages.length, onClose]);

  const small = size.w < 700;
  const availW = size.w - (small ? 24 : 180);
  const availH = size.h - (small ? 130 : 150);
  const s = Math.max(0.1, Math.min(availW / PAGE_W, availH / PAGE_H));
  const page = pages[Math.min(index, pages.length - 1)];

  return (
    <div className="he-preview" role="dialog" aria-label="Albomni ko'rish">
      <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, opacity: 0.9 }}>{title}</div>
        <button type="button" className="he-preview-nav" style={{ width: 40, height: 40 }} onClick={onClose} title="Yopish (Esc)"><X size={20} /></button>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: small ? 0 : 24, position: "relative" }}>
        {!small && <button type="button" className="he-preview-nav" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} title="Oldingi"><ChevronLeft size={26} /></button>}
        <div
          key={page.id}
          style={{ width: PAGE_W * s, height: PAGE_H * s, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", borderRadius: 3, overflow: "hidden", animation: "he-fade .25s ease" }}
          onClick={(e) => {
            if (!small) return;
            const r = e.currentTarget.getBoundingClientRect();
            if (e.clientX - r.left > r.width / 2) setIndex((i) => Math.min(pages.length - 1, i + 1));
            else setIndex((i) => Math.max(0, i - 1));
          }}
        >
          <div style={{ transform: `scale(${s})`, transformOrigin: "0 0", width: PAGE_W, height: PAGE_H }}>
            <PageView page={page} mode="preview" />
          </div>
        </div>
        {!small && <button type="button" className="he-preview-nav" onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))} disabled={index >= pages.length - 1} title="Keyingi"><ChevronRight size={26} /></button>}
      </div>
      <div style={{ height: 70, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Sahifa ${i + 1}`}
            style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, border: "none", background: i === index ? "#D9BC85" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "width .2s", padding: 0 }}
          />
        ))}
        <span style={{ marginLeft: 12, fontSize: 13, opacity: 0.7 }}>{index + 1} / {pages.length}</span>
      </div>
    </div>
  );
}
