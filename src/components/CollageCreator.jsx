"use client";

import { useState, useRef } from "react";
import { X, ImagePlus } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { TOKENS } from "@/lib/uiTokens";

// ============================================================
// KOLLEJ SHABLONLARI
// Har bir slot: [x, y, w, h] — foizlarda (0-100)
// ============================================================
export const COLLAGE_TEMPLATES = [
  { id: "2-horizontal", name: "2 — yonma-yon", cols: 2, rows: 1, slots: [[0, 0, 50, 100], [50, 0, 50, 100]] },
  { id: "2-vertical", name: "2 — past/ust", cols: 1, rows: 2, slots: [[0, 0, 100, 50], [0, 50, 100, 50]] },
  { id: "3-horizontal", name: "3 — yonma-yon", cols: 3, rows: 1, slots: [[0, 0, 33.3, 100], [33.3, 0, 33.3, 100], [66.6, 0, 33.4, 100]] },
  { id: "3-mixed", name: "3 — katta+2", cols: 2, rows: 2, slots: [[0, 0, 60, 100], [60, 0, 40, 50], [60, 50, 40, 50]] },
  { id: "4-grid", name: "4 — 2x2", cols: 2, rows: 2, slots: [[0, 0, 50, 50], [50, 0, 50, 50], [0, 50, 50, 50], [50, 50, 50, 50]] },
  { id: "4-mixed", name: "4 — aralash", cols: 2, rows: 2, slots: [[0, 0, 50, 100], [50, 0, 50, 50], [50, 50, 26, 50], [76, 50, 24, 50]] },
  { id: "5-mixed", name: "5 — panorama", cols: 3, rows: 2, slots: [[0, 0, 50, 50], [50, 0, 50, 50], [0, 50, 33.3, 50], [33.3, 50, 33.3, 50], [66.6, 50, 33.4, 50]] },
  { id: "6-grid", name: "6 — 3x2", cols: 3, rows: 2, slots: [[0, 0, 33.3, 50], [33.3, 0, 33.3, 50], [66.6, 0, 33.4, 50], [0, 50, 33.3, 50], [33.3, 50, 33.3, 50], [66.6, 50, 33.4, 50]] },
];

export function CollageCreator({
  photos = [],
  familySlug,
  initialTemplate,
  onSave,
  onClose,
}) {
  const [template, setTemplate] = useState(initialTemplate || COLLAGE_TEMPLATES[3]);
  const [assigned, setAssigned] = useState({}); // { slotIndex: {url} }
  const [dragSrc, setDragSrc] = useState(null);
  const [hoverSlot, setHoverSlot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [library, setLibrary] = useState(
    (photos || []).filter((p) => p && (p.url || p.photo_url)).map((p, i) => ({
      id: p.id || p.url || p.photo_url || String(i),
      url: p.url || p.photo_url,
      name: p.name || `Rasm ${i + 1}`,
    }))
  );

  const fileInputRef = useRef(null); // "Yangi rasm" ko'p fayl
  const slotInputRef = useRef(null); // slotga to'g'ridan-to'g'ri yuklash
  const slotInputIndexRef = useRef(null);

  const filledCount = Object.keys(assigned).length;

  const assignToSlot = (idx, url) => setAssigned((prev) => ({ ...prev, [idx]: url }));
  const removeFromSlot = (idx) => setAssigned((prev) => {
    const n = { ...prev };
    delete n[idx];
    return n;
  });

  const handleTemplateChange = (tpl) => {
    setTemplate(tpl);
    setAssigned({});
  };

  const uploadFiles = async (files, targetSlot = null) => {
    const imageFiles = Array.from(files || []).filter((f) => f && f.type.startsWith("image/"));
    if (!imageFiles.length) return;
    setUploading(true);
    try {
      const added = [];
      for (const file of imageFiles) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
          clientPayload: JSON.stringify({ familySlug }),
        });
        const item = { id: blob.url, url: blob.url };
        added.push(item);
        if (targetSlot != null) assignToSlot(targetSlot, blob.url);
      }
      setLibrary((l) => [...l, ...added]);
    } catch (err) {
      console.error("Rasm yuklashda xato:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleLibraryUpload = (e) => {
    uploadFiles(e.target.files);
    e.target.value = "";
  };

  const handleSlotUpload = (e) => {
    uploadFiles(e.target.files, slotInputIndexRef.current);
    e.target.value = "";
  };

  const buildItems = () => {
    const items = [];
    for (let i = 0; i < template.slots.length; i += 1) {
      const url = assigned[i];
      if (!url) continue;
      const s = template.slots[i];
      items.push({ url, x: Math.round(s[0] * 10) / 10, y: Math.round(s[1] * 10) / 10, w: Math.round(s[2] * 10) / 10, h: Math.round(s[3] * 10) / 10 });
    }
    return items;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, maxWidth: 920, width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${TOKENS.parchmentDeep}` }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 500, margin: 0 }}>Kollaj yaratish</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", gap: 20, padding: 20 }}>
          {/* Chap: shablon + rasmlar kutubxonasi */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink60, display: "block", marginBottom: 6 }}>Shablon</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {COLLAGE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tpl)}
                    style={{
                      textAlign: "left", padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11.5,
                      border: template.id === tpl.id ? `1.5px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`,
                      background: template.id === tpl.id ? TOKENS.parchmentDeep : "transparent", color: TOKENS.ink,
                    }}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink60, display: "block", marginBottom: 6 }}>Rasmlar</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
                {library.map((photo) => (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", JSON.stringify({ url: photo.url })); setDragSrc(photo); }}
                    onDragEnd={() => setDragSrc(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 4, cursor: "grab",
                      background: Object.values(assigned).includes(photo.url) ? TOKENS.parchmentDeep : "transparent",
                    }}
                  >
                    <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 4, background: `url("${photo.url}") center/cover` }} />
                    <span style={{ fontSize: 11, color: TOKENS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{photo.name}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ marginTop: 8, width: "100%", padding: "8px", borderRadius: 6, border: `1px dashed ${TOKENS.parchmentDeep}`, background: "transparent", cursor: uploading ? "default" : "pointer", fontSize: 11.5, color: TOKENS.ink60, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
              >
                <ImagePlus size={14} /> {uploading ? "Yuklanmoqda..." : "Yangi rasm"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleLibraryUpload} style={{ display: "none" }} />
            </div>
          </div>

          {/* O'ng: Preview */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ position: "relative", width: "100%", aspectRatio: `${template.cols}/${template.rows}`, background: TOKENS.parchment, borderRadius: 10, overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(30,38,33,0.1)" }}>
              {template.slots.map((s, i) => {
                const photo = assigned[i];
                const isOver = hoverSlot === i && dragSrc != null;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!photo) { slotInputIndexRef.current = i; slotInputRef.current?.click(); }
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setHoverSlot(i); }}
                    onDrop={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      const raw = e.dataTransfer.getData("text/plain");
                      if (raw) {
                        try { const d = JSON.parse(raw); if (d && d.url) assignToSlot(i, d.url); } catch {}
                      }
                      setHoverSlot(null);
                    }}
                    onDragLeave={() => setHoverSlot((h) => (h === i ? null : h))}
                    style={{
                      position: "absolute", left: `${s[0]}%`, top: `${s[1]}%`, width: `${s[2]}%`, height: `${s[3]}%`,
                      background: photo ? `url("${photo}") center/cover no-repeat` : TOKENS.parchmentDeep,
                      borderRadius: 6, overflow: "hidden", cursor: photo ? "default" : "pointer",
                      boxShadow: photo ? "inset 0 0 0 2px rgba(255,255,255,0.4)" : "inset 0 0 0 1px rgba(30,38,33,0.12)",
                      outline: isOver ? `2px dashed ${TOKENS.gold}` : "none", outlineOffset: -2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {!photo && (
                      <span style={{ fontSize: 12, color: TOKENS.ink40, fontWeight: 500, pointerEvents: "none" }}>
                        {uploading && slotInputIndexRef.current === i ? "Yuklanmoqda..." : `+ ${i + 1}`}
                      </span>
                    )}
                    {photo && (
                      <button
                        type="button"
                        title="O'chirish"
                        onClick={(e) => { e.stopPropagation(); removeFromSlot(i); }}
                        style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.65)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <X size={11} />
                      </button>
                    )}
                    {isOver && <div style={{ position: "absolute", inset: 0, background: "rgba(184,134,59,0.18)", pointerEvents: "none" }} />}
                  </div>
                );
              })}
              <input ref={slotInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleSlotUpload} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => onSave?.(buildItems(), template)}
                disabled={filledCount === 0}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, fontWeight: 600,
                  background: filledCount > 0 ? TOKENS.gold : TOKENS.ink40, color: "#fff", border: "none",
                  cursor: filledCount > 0 ? "pointer" : "default",
                }}
              >
                Sahifaga qo'shish ({filledCount})
              </button>
              <button
                type="button"
                onClick={() => setAssigned({})}
                style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${TOKENS.parchmentDeep}`, background: "transparent", cursor: "pointer", fontSize: 13, color: TOKENS.ink60 }}
              >
                Tozalash
              </button>
            </div>

            <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginTop: 10, lineHeight: 1.4 }}>
              Rasmlarni chap ro'yxatdan slotlarga sudrab tashlang yoki bo'sh slotga bosing. Ular joriy sahifaga qo'shiladi.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}