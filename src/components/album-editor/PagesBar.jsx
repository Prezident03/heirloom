"use client";

import React, { useState } from "react";
import { Plus, Copy, Trash2, Minus, FilePlus2, LayoutTemplate, Maximize, RectangleHorizontal } from "lucide-react";
import { ScaledPage } from "./ElementView";
import { PopButton, C } from "./ui";
import { ZOOM_LEVELS, PAGE_FORMATS } from "./constants";

const PAGE_MIME = "application/x-heirloom-page";

export function PagesBar({ pages, pageId, setPageId, api, canEdit, zoomPct, onZoom, compact, format }) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const thumbW = compact ? 58 : 88;

  return (
    <div className="he-bottombar" onPointerDown={(e) => e.stopPropagation()}>
      <div className="he-pages" role="list" aria-label="Sahifalar">
        {pages.map((p, i) => (
          <div
            key={p.id}
            role="listitem"
            className={`he-thumb${p.id === pageId ? " active" : ""}${overId === p.id && dragId && dragId !== p.id ? " drop-before" : ""}`}
            draggable={canEdit}
            onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData(PAGE_MIME, p.id); }}
            onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(p.id); } }}
            onDragLeave={() => setOverId((v) => (v === p.id ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId && dragId !== p.id) api.movePage(dragId, i);
              setDragId(null); setOverId(null);
            }}
            onDragEnd={() => { setDragId(null); setOverId(null); }}
            onClick={() => setPageId(p.id)}
            title={`Sahifa ${i + 1}`}
          >
            <ScaledPage page={p} width={thumbW} style={{ borderRadius: 6 }} />
            <span className="he-thumb-num">{i + 1}</span>
            {canEdit && (
              <div className="he-thumb-actions">
                <button type="button" className="he-thumb-act" title="Sahifani nusxalash" onClick={(e) => { e.stopPropagation(); api.duplicatePage(p.id); }}><Copy size={12} /></button>
                <button type="button" className="he-thumb-act" title="Sahifani o'chirish" disabled={pages.length < 2} onClick={(e) => { e.stopPropagation(); api.deletePage(p.id); }} style={{ opacity: pages.length < 2 ? 0.4 : 1 }}><Trash2 size={12} /></button>
              </div>
            )}
          </div>
        ))}
        {canEdit && (
          <PopButton
            className="he-btn soft"
            icon={<Plus size={18} />}
            title="Sahifa qo'shish"
            width={230}
            placement="top"
          >
            {(close) => (
              <>
                <button type="button" className="he-menu-item" onClick={() => { api.addPage({}); close(); }}><FilePlus2 size={15} /> Bo&apos;sh sahifa</button>
                <button type="button" className="he-menu-item" onClick={() => { api.addPage({ openTemplates: true }); close(); }}><LayoutTemplate size={15} /> Shablondan tanlash</button>
                <button type="button" className="he-menu-item" onClick={() => { api.duplicatePage(pageId); close(); }}><Copy size={15} /> Joriy sahifa nusxasi</button>
              </>
            )}
          </PopButton>
        )}
      </div>
      {canEdit && (
        <PopButton className="he-btn soft" icon={<RectangleHorizontal size={15} />} label={<span>{format}</span>} title="Sahifa formati" width={230} placement="top" align="end">
          {(close) => (
            <>
              <div style={{ fontSize: 11.5, color: C.muted, margin: "2px 6px 6px" }}>Butun albom uchun sahifa formati</div>
              {PAGE_FORMATS.map((f) => (
                <button key={f.id} type="button" className="he-menu-item" style={{ background: f.id === format ? "rgba(184,134,59,0.12)" : undefined }} onClick={() => { api.setFormat(f.id); close(); }}>
                  <span style={{ width: 26, display: "inline-flex", justifyContent: "center" }}>
                    <span style={{ display: "inline-block", width: f.ratio >= 1 ? 22 : 22 * f.ratio, height: f.ratio >= 1 ? 22 / f.ratio : 22, border: `1.5px solid ${f.id === format ? C.gold : C.ink}`, borderRadius: 2 }} />
                  </span>
                  {f.name} <span className="kbd">{f.id}</span>
                </button>
              ))}
            </>
          )}
        </PopButton>
      )}
      <div className="he-zoom">
        <button type="button" className="he-btn icon" title="Kichraytirish (Ctrl −)" onClick={() => onZoom("out")}><Minus size={16} /></button>
        <PopButton className="he-zoom-val" label={`${zoomPct}%`} title="Masshtab" width={170} placement="top" align="end">
          {(close) => (
            <>
              <button type="button" className="he-menu-item" onClick={() => { onZoom("fit"); close(); }}><Maximize size={14} /> Ekranga moslash <span className="kbd">Ctrl+0</span></button>
              <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
              {[...ZOOM_LEVELS].filter((z) => z >= 0.25).reverse().map((z) => (
                <button key={z} type="button" className="he-menu-item" onClick={() => { onZoom(z); close(); }}>{Math.round(z * 100)}%</button>
              ))}
            </>
          )}
        </PopButton>
        <button type="button" className="he-btn icon" title="Kattalashtirish (Ctrl +)" onClick={() => onZoom("in")}><Plus size={16} /></button>
        <button type="button" className="he-btn icon he-hide-sm" title="Ekranga moslash" onClick={() => onZoom("fit")}><Maximize size={15} /></button>
      </div>
    </div>
  );
}
