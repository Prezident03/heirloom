"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  LayoutTemplate, Images, Video, Type, Shapes, Sticker, Frame, PaintBucket, Upload, X, Loader2, Plus, ImageOff, CopyPlus, Trash2, AlertTriangle,
} from "lucide-react";
import { FONT_BY_ID, TEXT_PRESETS, FRAMES, BACKGROUND_GROUPS, SOLID_COLORS, backgroundCss } from "./constants";
import { TEMPLATES, TEMPLATE_CATEGORIES, buildTemplateElements } from "./templates";
import { STICKER_GROUPS, StickerArt } from "./stickers";
import { ScaledPage, PhotoFramePreview } from "./ElementView";
import { Swatches, C } from "./ui";
import { SAMPLE_IMG } from "./Toolbar";

export const RAIL = [
  { id: "templates", icon: LayoutTemplate, label: "Shablonlar" },
  { id: "photos", icon: Images, label: "Rasmlar" },
  { id: "videos", icon: Video, label: "Videolar" },
  { id: "text", icon: Type, label: "Matn" },
  { id: "elements", icon: Shapes, label: "Elementlar" },
  { id: "stickers", icon: Sticker, label: "Stikerlar" },
  { id: "frames", icon: Frame, label: "Ramkalar" },
  { id: "background", icon: PaintBucket, label: "Fon" },
  { id: "upload", icon: Upload, label: "Yuklash" },
];

const DND_MIME = "application/x-heirloom";

/** dragover paytida payload'ni o'qib bo'lmaydi — shuning uchun turini shu yerda eslab qolamiz. */
export const currentDrag = { kind: null };

function setDrag(e, payload) {
  currentDrag.kind = payload.kind;
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
  e.dataTransfer.setData("text/plain", payload.kind);
}

export function readDrag(e) {
  try {
    const raw = e.dataTransfer.getData(DND_MIME);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isEditorDrag(e) {
  const types = Array.from(e.dataTransfer?.types || []);
  return types.includes(DND_MIME) || types.includes("Files");
}

export function Rail({ panel, setPanel }) {
  return (
    <nav className="he-rail" aria-label="Asboblar">
      {RAIL.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`he-rail-btn${panel === item.id ? " active" : ""}`}
          onClick={() => setPanel(panel === item.id ? null : item.id)}
          title={item.label}
        >
          <item.icon size={20} strokeWidth={1.8} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Drawer({ panel, setPanel, api, library, uploads, page, replaceTarget }) {
  if (!panel) return null;
  const item = RAIL.find((r) => r.id === panel);
  return (
    <aside className="he-drawer" onPointerDown={(e) => e.stopPropagation()}>
      <div className="he-drawer-head">
        <div className="he-drawer-title">{item?.label}</div>
        <button type="button" className="he-btn icon" onClick={() => setPanel(null)} title="Yopish"><X size={18} /></button>
      </div>
      {replaceTarget && (panel === "photos" || panel === "videos" || panel === "upload") && (
        <div style={{ margin: "0 16px 8px", padding: "8px 10px", borderRadius: 10, background: "rgba(184,134,59,0.12)", color: C.ink, fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ flex: 1 }}>Almashtirish uchun rasmni tanlang</span>
          <button type="button" className="he-btn icon" style={{ width: 24, height: 24 }} onClick={() => api.clearReplace()}><X size={14} /></button>
        </div>
      )}
      <div className="he-drawer-body">
        {panel === "templates" && <TemplatesPanel api={api} />}
        {panel === "photos" && <MediaPanel api={api} library={library} uploads={uploads} kind="photo" />}
        {panel === "videos" && <MediaPanel api={api} library={library} uploads={uploads} kind="video" />}
        {panel === "text" && <TextPanel api={api} />}
        {panel === "elements" && <StickerPanel api={api} groups={["tape", "paper", "shapes", "clips"]} />}
        {panel === "stickers" && <StickerPanel api={api} groups={["nature", "icons", "words"]} />}
        {panel === "frames" && <FramesPanel api={api} />}
        {panel === "background" && <BackgroundPanel api={api} page={page} />}
        {panel === "upload" && <UploadPanel api={api} library={library} uploads={uploads} />}
      </div>
    </aside>
  );
}

// ------------------------------------------------------------
// Shablonlar
// ------------------------------------------------------------
const templatePreviewCache = new Map();
function templatePreview(tpl) {
  if (!templatePreviewCache.has(tpl.id)) {
    templatePreviewCache.set(tpl.id, { id: `tpl-${tpl.id}`, background: tpl.background, bgImage: null, elements: buildTemplateElements(tpl) });
  }
  return templatePreviewCache.get(tpl.id);
}

function TemplatesPanel({ api }) {
  const [cat, setCat] = useState("Barchasi");
  const list = cat === "Barchasi" ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);
  return (
    <>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, margin: "0 -16px", padding: "0 16px 10px", scrollbarWidth: "none" }}>
        {["Barchasi", ...TEMPLATE_CATEGORIES].map((c) => (
          <button key={c} type="button" className={`he-chip${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.45 }}>
        Shablon joriy sahifaga qo&apos;llanadi. Sahifadagi rasmlaringiz yangi joylarga o&apos;tkaziladi — keyin hammasini erkin o&apos;zgartirishingiz mumkin.
      </div>
      <div className="he-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {list.map((tpl) => (
          <TemplateTile key={tpl.id} tpl={tpl} api={api} />
        ))}
      </div>
    </>
  );
}

function TemplateTile({ tpl, api }) {
  const preview = useMemo(() => templatePreview(tpl), [tpl]);
  return (
    <div style={{ position: "relative" }} className="he-tpl">
      <button
        type="button"
        className="he-tile"
        style={{ width: "100%", display: "block" }}
        draggable
        onDragStart={(e) => setDrag(e, { kind: "template", id: tpl.id })}
        onClick={() => api.applyTemplate(tpl.id)}
        title={`${tpl.name} — qo'llash`}
      >
        <ScaledPage page={preview} width={140} style={{ margin: "0 auto" }} />
        <span className="he-tile-label">{tpl.name}</span>
      </button>
      <button
        type="button"
        className="he-thumb-act"
        title="Yangi sahifa sifatida qo'shish"
        style={{ position: "absolute", right: 6, top: 6 }}
        onClick={() => api.addPage({ templateId: tpl.id })}
      >
        <CopyPlus size={13} />
      </button>
    </div>
  );
}

// ------------------------------------------------------------
// Rasmlar / Videolar / Yuklash
// ------------------------------------------------------------
function UploadButton({ api, accept, label = "Kompyuterdan yuklash" }) {
  const ref = useRef(null);
  return (
    <>
      <button type="button" className="he-btn primary" style={{ width: "100%", height: 40 }} onClick={() => ref.current?.click()}>
        <Upload size={16} /> {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple
        style={{ display: "none" }}
        onChange={(e) => { const files = [...(e.target.files || [])]; e.target.value = ""; if (files.length) api.uploadFiles(files); }}
      />
    </>
  );
}

function UploadList({ uploads }) {
  if (!uploads.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
      {uploads.map((u) => (
        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: u.error ? C.danger : C.muted }}>
          {u.error ? <AlertTriangle size={14} /> : <Loader2 size={14} className="he-spin" />}
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.error || u.name}</span>
          {!u.error && <span style={{ fontWeight: 600 }}>{Math.round(u.progress || 0)}%</span>}
        </div>
      ))}
    </div>
  );
}

function MediaGrid({ items, api, kind }) {
  if (!items.length) {
    return (
      <div style={{ textAlign: "center", padding: "30px 10px", color: C.muted, fontSize: 12.5 }}>
        <ImageOff size={26} style={{ opacity: 0.4, marginBottom: 8 }} />
        <div>{kind === "video" ? "Hali video yuklanmagan" : "Hali rasm yo'q"}</div>
      </div>
    );
  }
  return (
    <div className="he-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
      {items.map((m) => (
        <button
          key={m.url}
          type="button"
          className="he-tile"
          draggable
          onDragStart={(e) => setDrag(e, { kind: m.kind, url: m.url, aspect: m.width && m.height ? m.width / m.height : null })}
          onClick={() => api.insertMedia(m)}
          title={kind === "video" ? "Video qo'shish" : "Qo'shish yoki ramkaga sudrab tashlang"}
          style={{ aspectRatio: "1", background: "#EEE8DC" }}
        >
          {m.kind === "video" ? (
            <video src={`${m.url}#t=0.1`} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt="" loading="lazy" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
          {m.kind === "video" && <span style={{ position: "absolute", right: 4, bottom: 4, background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 4, fontSize: 9.5, fontWeight: 700, padding: "1px 4px" }}>VIDEO</span>}
        </button>
      ))}
    </div>
  );
}

function MediaPanel({ api, library, uploads, kind }) {
  const items = library.filter((m) => m.kind === kind);
  return (
    <>
      <UploadButton api={api} accept={kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*"} label={kind === "video" ? "Video yuklash" : "Rasm yuklash"} />
      <UploadList uploads={uploads} />
      <div className="he-section-label">{kind === "video" ? "Videolar" : "Oila rasmlari"}</div>
      <MediaGrid items={items} api={api} kind={kind} />
    </>
  );
}

function UploadPanel({ api, library, uploads }) {
  const [over, setOver] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <div
        className={`he-drop${over ? " over" : ""}`}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { if (Array.from(e.dataTransfer.types).includes("Files")) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const files = [...e.dataTransfer.files]; if (files.length) api.uploadFiles(files); }}
      >
        <Upload size={26} style={{ marginBottom: 8 }} />
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Fayllarni shu yerga tashlang</div>
        <div style={{ fontSize: 12 }}>yoki bosib tanlang · rasm (25MB gacha), video (200MB gacha)</div>
        <input
          ref={ref}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { const files = [...(e.target.files || [])]; e.target.value = ""; if (files.length) api.uploadFiles(files); }}
        />
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
        Maslahat: fayllarni to&apos;g&apos;ridan-to&apos;g&apos;ri sahifaga ham sudrab tashlashingiz yoki <span className="he-kbd">Ctrl</span>+<span className="he-kbd">V</span> bilan joylashtirishingiz mumkin.
      </div>
      <UploadList uploads={uploads} />
      <div className="he-section-label">So&apos;nggi yuklanganlar</div>
      <MediaGrid items={library.slice(0, 30)} api={api} kind="photo" />
    </>
  );
}

// ------------------------------------------------------------
// Matn
// ------------------------------------------------------------
function TextPanel({ api }) {
  return (
    <>
      <button type="button" className="he-btn primary" style={{ width: "100%", height: 42, marginBottom: 14 }} onClick={() => api.addText("body")}>
        <Plus size={16} /> Matn qo&apos;shish
      </button>
      <div className="he-section-label">Tayyor uslublar</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TEXT_PRESETS.map((p) => {
          const f = FONT_BY_ID[p.font];
          return (
            <button
              key={p.id}
              type="button"
              className="he-tile"
              draggable
              onDragStart={(e) => setDrag(e, { kind: "text", preset: p.id })}
              onClick={() => api.addText(p.id)}
              style={{ padding: "14px 14px", textAlign: "left", fontFamily: f.css, fontSize: Math.min(30, p.fontSize * 0.42), fontWeight: p.bold ? 700 : f.weight, fontStyle: p.italic ? "italic" : "normal", color: C.ink }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ------------------------------------------------------------
// Elementlar / Stikerlar
// ------------------------------------------------------------
function StickerPanel({ api, groups }) {
  return (
    <>
      {STICKER_GROUPS.filter((g) => groups.includes(g.id)).map((g) => (
        <div key={g.id}>
          <div className="he-section-label">{g.label}</div>
          <div className="he-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {g.items.map((s) => (
              <button
                key={s.id}
                type="button"
                className="he-tile"
                draggable
                onDragStart={(e) => setDrag(e, { kind: "sticker", id: s.id })}
                onClick={() => api.addSticker(s.id)}
                title={s.name}
                style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", padding: 8, background: "#FBF8F0" }}
              >
                <div style={{ width: s.aspect >= 1 ? "100%" : `${s.aspect * 100}%`, aspectRatio: String(s.aspect), maxHeight: "100%", pointerEvents: "none" }}>
                  <StickerArt stickerId={s.id} uid={`pal-${s.id}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ------------------------------------------------------------
// Ramkalar
// ------------------------------------------------------------
function FramesPanel({ api }) {
  return (
    <>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.45 }}>
        Ramkani sahifaga qo&apos;shing, so&apos;ng unga rasmni sudrab tashlang. Mavjud rasm ustiga tashlasangiz — ramkasi almashadi.
      </div>
      <div className="he-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {FRAMES.filter((f) => f.id !== "none").map((f) => (
          <button
            key={f.id}
            type="button"
            className="he-tile"
            draggable
            onDragStart={(e) => setDrag(e, { kind: "frame", id: f.id })}
            onClick={() => api.addFrame(f.id)}
            style={{ padding: 8, background: "#FBF8F0" }}
          >
            <PhotoFramePreview frame={f.id} size={72} src={SAMPLE_IMG} />
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: C.ink }}>{f.name}</div>
          </button>
        ))}
      </div>
    </>
  );
}

// ------------------------------------------------------------
// Fon
// ------------------------------------------------------------
function BackgroundPanel({ api, page }) {
  const ref = useRef(null);
  const current = page.background;
  const solid = current?.startsWith("solid:") ? current.slice(6) : null;
  return (
    <>
      {BACKGROUND_GROUPS.map((g) => (
        <div key={g.label}>
          <div className="he-section-label">{g.label}</div>
          <div className="he-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {g.items.map((b) => (
              <button
                key={b.id}
                type="button"
                className="he-tile"
                title={b.name}
                onClick={() => api.setBackground({ background: b.id, bgImage: null })}
                style={{ aspectRatio: "4 / 3", ...backgroundCss(b.id), outline: current === b.id && !page.bgImage ? `2px solid ${C.gold}` : undefined, outlineOffset: 1 }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="he-section-label">Rang</div>
      <Swatches colors={SOLID_COLORS} value={solid} onChange={(c) => api.setBackground({ background: `solid:${c}`, bgImage: null }, { coalesce: "bgcolor" })} />
      <div className="he-section-label">Rasm fon sifatida</div>
      <button type="button" className="he-btn soft" style={{ width: "100%" }} onClick={() => ref.current?.click()}>
        <Upload size={15} /> Fon rasmini yuklash
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) api.uploadBackground(f); }}
      />
      {page.bgImage && (
        <button type="button" className="he-btn danger" style={{ width: "100%", marginTop: 6 }} onClick={() => api.setBackground({ bgImage: null })}>
          <Trash2 size={15} /> Fon rasmini olib tashlash
        </button>
      )}
      <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 16, paddingTop: 12 }}>
        <button type="button" className="he-btn soft" style={{ width: "100%" }} onClick={() => api.applyBackgroundToAll()}>
          Barcha sahifalarga qo&apos;llash
        </button>
      </div>
    </>
  );
}
