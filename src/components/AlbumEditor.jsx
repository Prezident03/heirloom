"use client";

import React, { useState, useRef, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  BookImage, Plus, X, ImagePlus, LayoutGrid,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Copy, Trash2, Calendar, MapPinned,
  Leaf, Flower2, Heart, Star, Sun, Palette, Sticker as StickerIcon, Frame,
} from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { AlbumCard } from "./shared";

/* ---------------- Albums view ---------------- */

const LAYOUTS = [
  { id: "l1", name: "Bitta katta", slots: [{ type: "photo", x: 8, y: 8, w: 84, h: 60 }, { type: "text", x: 8, y: 72, w: 84, h: 20 }] },
  { id: "l2", name: "Ikkita yonma-yon", slots: [{ type: "photo", x: 6, y: 8, w: 41, h: 70 }, { type: "photo", x: 53, y: 8, w: 41, h: 70 }, { type: "text", x: 6, y: 82, w: 88, h: 12 }] },
  { id: "l3", name: "Katta + ikkita kichik", slots: [{ type: "photo", x: 6, y: 6, w: 60, h: 50 }, { type: "photo", x: 68, y: 6, w: 26, h: 24 }, { type: "photo", x: 68, y: 32, w: 26, h: 24 }, { type: "text", x: 6, y: 60, w: 88, h: 32 }] },
  { id: "l4", name: "Uchtasi qatorda", slots: [{ type: "photo", x: 5, y: 10, w: 28, h: 55 }, { type: "photo", x: 36, y: 10, w: 28, h: 55 }, { type: "photo", x: 67, y: 10, w: 28, h: 55 }, { type: "text", x: 5, y: 70, w: 90, h: 22 }] },
];

// Fon (background) tanlovlari — src/lib/albums.ts dagi BACKGROUNDS bilan mos id'lar.
const BACKGROUNDS = {
  paper: { name: "Qog'oz", from: "#F4EDDD", to: "#ECE2C8" },
  sage: { name: "Sage", from: "#E7EDE3", to: "#D3DECB" },
  slate: { name: "Slate", from: "#E4E7E6", to: "#CBD2D0" },
  blush: { name: "Blush", from: "#F3E4DD", to: "#E6C9BC" },
  midnight: { name: "Midnight", from: "#2A3630", to: "#1B231F" },
};
const BACKGROUND_LIST = Object.entries(BACKGROUNDS).map(([id, v]) => ({ id, ...v }));

// Stikerlar — src/lib/albums.ts dagi STICKERS bilan mos id'lar.
const STICKER_ICONS = { leaf: Leaf, flower: Flower2, heart: Heart, star: Star, sun: Sun };
const STICKER_LIST = [
  { id: "leaf", name: "Barg" },
  { id: "flower", name: "Gul" },
  { id: "heart", name: "Yurak" },
  { id: "star", name: "Yulduz" },
  { id: "sun", name: "Quyosh" },
];

const FRAME_LIST = [
  { id: "polaroid", name: "Polaroid" },
  { id: "soft", name: "Yumshoq soya" },
  { id: "none", name: "Ramkasiz" },
];

/* ---------------- Scrapbook decoration helpers ---------------- */

// Small deterministic "randomness" from an element id, so the same photo
// always gets the same paper-doll tilt/tape angle instead of jittering
// between renders.
function seeded(id, salt = 0) {
  const str = String(id || "x") + "-" + salt;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000; // 0..1
}

function LeafDoodle({ style, flip }) {
  return (
    <svg viewBox="0 0 60 60" width={54} height={54} style={{ position: "absolute", opacity: 0.5, pointerEvents: "none", transform: flip ? "scaleX(-1)" : undefined, ...style }}>
      <path d="M6 54C6 30 20 8 46 6c2 20-8 38-28 46-6 2-10 2-12 2Z" fill={TOKENS.tealSoft} opacity="0.55" />
      <path d="M10 50C14 32 24 16 44 10" stroke={TOKENS.teal} strokeWidth="1.4" fill="none" opacity="0.6" />
    </svg>
  );
}

function ChipButton({ children, active, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 20, border: active ? "none" : `1px solid ${TOKENS.parchmentDeep}`, background: active ? TOKENS.ink : "transparent", color: active ? TOKENS.parchment : TOKENS.ink60, cursor: "pointer", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

/* ---------------- Empty state ---------------- */

function EmptyAlbums({ onCreate }) {
  return (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BookImage size={24} color="#fff" />
      </div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, margin: "0 0 8px" }}>Hali albom yo'q</h2>
      <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 22px" }}>
        Birinchi xotirangizni saqlang — sayohat, oilaviy kun, yoki shunchaki oddiy bir lahza.
      </p>
      <button onClick={onCreate} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
        <Plus size={15} /> Birinchi albomni yaratish
      </button>
    </div>
  );
}

/* ---------------- Create Album modal ---------------- */

export function CreateAlbumModal({ familySlug, createAlbumAction, onClose }) {
  const [state, formAction, pending] = useActionState(createAlbumAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi albom</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input name="title" placeholder="Albom nomi (masalan: 2026 — Parij)" required style={inputStyle} autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <input name="dateLabel" placeholder="Sana (masalan: May 2026)" style={inputStyle} />
            <input name="location" placeholder="Joy (ixtiyoriy)" style={inputStyle} />
          </div>
          <textarea name="description" placeholder="Qisqacha tavsif (ixtiyoriy)" rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Yaratilmoqda..." : "Albom yaratish"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Bulk photo upload modal ("+ Yangi" > "Rasmlar yuklash") ---------------- */

export function UploadPhotosModal({ familySlug, albums, bulkUploadPhotosAction, onClose }) {
  const [state, formAction, pending] = useActionState(bulkUploadPhotosAction, undefined);
  const [target, setTarget] = useState(albums.length > 0 ? "existing" : "new");
  const [albumId, setAlbumId] = useState(albums[0]?.id || "");
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [fileCount, setFileCount] = useState(0);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Rasmlar yuklash</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input type="hidden" name="albumId" value={target === "existing" ? albumId : ""} />
          <input type="hidden" name="newAlbumTitle" value={target === "new" ? newAlbumTitle : ""} />

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.ink60, marginBottom: 8 }}>Qaysi albomga?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {albums.length > 0 && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <input type="radio" name="targetChoice" checked={target === "existing"} onChange={() => setTarget("existing")} />
                  <select
                    value={albumId}
                    onChange={(e) => { setAlbumId(e.target.value); setTarget("existing"); }}
                    onFocus={() => setTarget("existing")}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </label>
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <input type="radio" name="targetChoice" checked={target === "new"} onChange={() => setTarget("new")} />
                <input
                  placeholder="Yangi albom nomi"
                  value={newAlbumTitle}
                  onChange={(e) => { setNewAlbumTitle(e.target.value); setTarget("new"); }}
                  onFocus={() => setTarget("new")}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </label>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.ink60, marginBottom: 8 }}>Rasmlar</div>
            <label
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 90, borderRadius: 10,
                border: `1.5px dashed ${TOKENS.parchmentDeep}`, cursor: "pointer", color: TOKENS.ink60, fontSize: 13, fontWeight: 500,
              }}
            >
              <ImagePlus size={18} color={TOKENS.gold} />
              {fileCount > 0 ? `${fileCount} ta rasm tanlandi` : "Bir yoki bir nechta rasm tanlash uchun bosing"}
              <input
                type="file"
                name="photos"
                accept="image/*"
                multiple
                onChange={(e) => setFileCount(e.target.files?.length || 0)}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button
            type="submit"
            disabled={pending || fileCount === 0 || (target === "new" && !newAlbumTitle.trim())}
            style={{ marginTop: 4, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending || fileCount === 0 || (target === "new" && !newAlbumTitle.trim()) ? 0.6 : 1 }}
          >
            {pending ? "Yuklanmoqda..." : "Yuklash"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AlbumGrid({ albums, onOpen, canEdit, createAlbumAction, familySlug }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div style={{ padding: "28px clamp(16px, 5vw, 48px) 60px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Arxiv</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>Mening albomlarim</h1>
        </div>
        {canEdit && albums.length > 0 && (
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Yangi albom
          </button>
        )}
      </div>

      {albums.length === 0 ? (
        <EmptyAlbums onCreate={() => setShowCreate(true)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} onClick={() => onOpen(a)} />
          ))}
        </div>
      )}

      {showCreate && <CreateAlbumModal familySlug={familySlug} createAlbumAction={createAlbumAction} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

/* ---------------- Page canvas (real elementlar bilan) ---------------- */

function PhotoSlot({ element, familySlug, albumId, pageId, saveElementPhotoUrlAction, deleteElementAction, canEdit, style, onDragStart, isDragging }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteElementAction, undefined);
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // xuddi shu faylni qayta tanlash imkoniyati uchun

    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayllari qabul qilinadi.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Rasm hajmi 15MB dan oshmasligi kerak.");
      return;
    }

    setError("");
    setPending(true);
    try {
      // Fayl to'g'ridan-to'g'ri brauzerdan Vercel Blob'ga ketadi — bizning
      // serverimiz (va uning 4.5MB chegarasi) faylning o'zini ko'rmaydi ham.
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
        clientPayload: JSON.stringify({ familySlug }),
      });

      const result = await saveElementPhotoUrlAction(familySlug, albumId, element.id, blob.url, false);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError("Rasm yuklashda xato yuz berdi: " + (err?.message || String(err)));
    } finally {
      setPending(false);
    }
  };

  const frameStyle = element.frame_style || "polaroid";
  const isPolaroid = frameStyle === "polaroid";
  const isSoft = frameStyle === "soft";
  const tilt = element.photo_url && isPolaroid ? (seeded(element.id, 1) * 4 - 2) : 0; // -2..2deg, decorative only
  const tapeRotate = seeded(element.id, 2) * 16 - 8; // -8..8deg

  return (
    <div
      style={{ ...style, position: "absolute", opacity: isDragging ? 0.5 : 1, transition: "opacity 0.2s" }}
      draggable={canEdit}
      onDragStart={onDragStart}
    >
      <div
        style={{
          width: "100%", height: "100%", borderRadius: isPolaroid ? 2 : 8, position: "relative",
          transform: `rotate(${tilt}deg)`,
          background: element.photo_url ? (isPolaroid ? "#fff" : "transparent") : TOKENS.parchment,
          padding: element.photo_url && isPolaroid ? "5% 5% 9%" : 0,
          boxShadow: element.photo_url ? "0 8px 18px rgba(30,26,15,0.22), 0 2px 5px rgba(30,26,15,0.12)" : "none",
          border: element.photo_url ? "none" : `1.5px dashed ${TOKENS.parchmentDeep}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: canEdit ? "grab" : "default",
          boxSizing: "border-box",
        }}
      >
        {element.photo_url && (
          <div
            aria-hidden
            style={{
              position: "absolute", top: -10, left: "50%", width: 46, height: 20,
              transform: `translateX(-50%) rotate(${tapeRotate}deg)`,
              background: TOKENS.tape, boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              opacity: 0.85, pointerEvents: "none",
            }}
          />
        )}
        <div
          style={{
            width: "100%", height: "100%", position: "relative", overflow: "hidden", borderRadius: 1,
            backgroundImage: element.photo_url ? `url(${element.photo_url})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        >
        {!element.photo_url && <BookImage size={20} color={TOKENS.ink40} />}
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%", background: "rgba(30,38,33,0.0)",
                border: "none", cursor: pending ? "default" : "pointer",
              }}
            >
              {pending && <span style={{ fontSize: 10, color: TOKENS.ink }}>Yuklanmoqda...</span>}
            </button>
            {element.photo_url && (
              <form action={deleteFormAction} style={{ position: "absolute", top: 4, right: 4 }}>
                <input type="hidden" name="familySlug" value={familySlug} />
                <input type="hidden" name="albumId" value={albumId} />
                <input type="hidden" name="pageId" value={pageId} />
                <input type="hidden" name="elementId" value={element.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  title="O'chirish"
                  style={{
                    width: 24, height: 24, borderRadius: "50%", background: "rgba(30,38,33,0.8)",
                    border: "none", color: "#fff", cursor: deletePending ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", opacity: deletePending ? 0.6 : 1,
                  }}
                >
                  <X size={14} />
                </button>
              </form>
            )}
          </>
        )}
        </div>
      </div>
      {error && <div style={{ fontSize: 9.5, color: TOKENS.danger, marginTop: 3 }}>{error}</div>}
      {deleteState?.error && <div style={{ fontSize: 9.5, color: TOKENS.danger, marginTop: 3 }}>{deleteState.error}</div>}
    </div>
  );
}

function StickerSlot({ element, canEdit, style, onDragStart, isDragging }) {
  const Icon = STICKER_ICONS[element.sticker_id] || Leaf;
  const rot = seeded(element.id, 3) * 20 - 10; // -10..10deg, decorative
  return (
    <div
      style={{ ...style, position: "absolute", opacity: isDragging ? 0.5 : 1, transition: "opacity 0.2s", cursor: canEdit ? "grab" : "default" }}
      draggable={canEdit}
      onDragStart={onDragStart}
    >
      <div style={{ width: "100%", height: "100%", transform: `rotate(${rot}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size="70%" color={TOKENS.teal} strokeWidth={1.4} fill={TOKENS.tealSoft} fillOpacity={0.35} />
      </div>
    </div>
  );
}

function TextSlot({ element, familySlug, albumId, updateElementTextAction, canEdit, style }) {
  const [state, formAction] = useActionState(updateElementTextAction, undefined);
  const [value, setValue] = useState(element.text_content || "");
  const formRef = useRef(null);

  return (
    <div style={{ ...style, position: "absolute" }}>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="albumId" value={albumId} />
        <input type="hidden" name="elementId" value={element.id} />
        <input type="hidden" name="text" value={value} />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => { if (canEdit && value !== (element.text_content || "")) formRef.current?.requestSubmit(); }}
          readOnly={!canEdit}
          placeholder={canEdit ? "Matn yozing..." : ""}
          style={{
            width: "100%", height: "100%", border: "none", outline: "none", resize: "none", background: "transparent",
            fontFamily: TOKENS.handwriting, fontSize: 22, lineHeight: 1.35, color: TOKENS.ink, fontWeight: 600,
          }}
        />
      </form>
      {state?.error && <div style={{ fontSize: 9.5, color: TOKENS.danger }}>{state.error}</div>}
    </div>
  );
}

function PageCanvas({ page, layout, familySlug, albumId, canEdit, saveElementPhotoUrlAction, updateElementTextAction, reorderElementsAction, deleteElementAction, updateElementPositionAction, updateElementCaptionAction, updateElementPlaceAction, changeZIndexAction, duplicateElementAction, moveElementUpAction, moveElementDownAction, updateElementFrameAction, backgroundId }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [reorderState, reorderFormAction, reorderPending] = useActionState(reorderElementsAction, undefined);
  const [posState, posFormAction, posPending] = useActionState(updateElementPositionAction, undefined);
  const [capState, capFormAction, capPending] = useActionState(updateElementCaptionAction, undefined);
  const [placeState, placeFormAction, placePending] = useActionState(updateElementPlaceAction, undefined);
  const [zState, zFormAction] = useActionState(changeZIndexAction, undefined);
  const [dupState, dupFormAction, dupPending] = useActionState(duplicateElementAction, undefined);
  const [delState, delFormAction, delPending] = useActionState(deleteElementAction, undefined);
  const [mvUpState, mvUpFormAction] = useActionState(moveElementUpAction, undefined);
  const [mvDnState, mvDnFormAction] = useActionState(moveElementDownAction, undefined);
  const [frameState, frameFormAction] = useActionState(updateElementFrameAction, undefined);

  const reorderRef = useRef(null);
  const posRef = useRef(null);
  const capRef = useRef(null);
  const placeRef = useRef(null);
  const zRef = useRef(null);
  const dupRef = useRef(null);
  const delRef = useRef(null);
  const mvUpRef = useRef(null);
  const mvDnRef = useRef(null);
  const frameRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [placeDraft, setPlaceDraft] = useState("");
  const canvasRef = useRef(null);
  const dragState = useRef(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const sel = page.elements?.find(e => e.id === selectedId);
    setCaptionDraft(sel?.caption || "");
    setPlaceDraft(sel?.location || "");
  }, [selectedId, page.elements]);

  const selected = page.elements?.find(e => e.id === selectedId) || null;

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIdx || !canEdit) return;
    if (reorderPending) {
      setDraggedIndex(null);
      setDropIndex(null);
      return;
    }
    const oldElements = page.elements || [];
    const sourceEl = oldElements[draggedIndex];
    const targetEl = oldElements[dropIdx];
    if (!sourceEl || !targetEl) {
      setDraggedIndex(null);
      setDropIndex(null);
      return;
    }
    const nextElements = [...oldElements];
    [nextElements[draggedIndex], nextElements[dropIdx]] = [nextElements[dropIdx], nextElements[draggedIndex]];

    if (reorderRef.current) {
      const f = reorderRef.current;
      f.elements.familySlug.value = familySlug;
      f.elements.albumId.value = albumId;
      f.elements.pageId.value = page.id;
      f.elements.elementIds.value = nextElements.map((el) => el?.id).filter(Boolean).join(",");
      setTimeout(() => f.requestSubmit(), 0);
    }
    setDraggedIndex(null);
    setDropIndex(null);
  };

  const submitPosition = (elId, x, y, w, h, zIndex, rotation) => {
    const f = posRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.elementId.value = elId;
    f.elements.positionX.value = String(x);
    f.elements.positionY.value = String(y);
    f.elements.positionW.value = String(w);
    f.elements.positionH.value = String(h);
    if (zIndex != null) f.elements.zIndex.value = String(zIndex); else f.elements.zIndex.value = "";
    if (rotation != null) f.elements.rotation.value = String(rotation); else f.elements.rotation.value = "";
    setTimeout(() => f.requestSubmit(), 0);
  };

  const onPointerDownElement = (e, el) => {
    if (!canEdit) return;
    // Rasm yuklash/o'chirish tugmasi yoki matn maydoni ustida bosilgan bo'lsa,
    // "tortib joylashtirish" rejimini ishga tushirmaymiz — aks holda canvas
    // pointer'ni o'zlashtirib olib, tugmaning onClick/inputning fokusi ishlamay qoladi.
    const interactive = e.target.closest && e.target.closest("button, input, textarea, select, label, a");
    if (interactive) {
      setSelectedId(el.id);
      return;
    }
    e.stopPropagation();
    setSelectedId(el.id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * 100;
    const py = (e.clientY - rect.top) / rect.height * 100;
    const ex = el.position_x ?? layout.slots[page.elements.indexOf(el)]?.x ?? 0;
    const ey = el.position_y ?? layout.slots[page.elements.indexOf(el)]?.y ?? 0;
    const ew = el.position_w ?? layout.slots[page.elements.indexOf(el)]?.w ?? 40;
    const eh = el.position_h ?? layout.slots[page.elements.indexOf(el)]?.h ?? 40;
    if (px >= ex && px <= ex + ew && py >= ey && py <= ey + eh) {
      dragState.current = { id: el.id, offsetX: px - ex, offsetY: py - ey, startX: ex, startY: ey, lastX: ex, lastY: ey, moved: false };
      canvas.setPointerCapture?.(e.pointerId);
    }
  };

  const onPointerMoveCanvas = (e) => {
    if (!dragState.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * 100;
    const py = (e.clientY - rect.top) / rect.height * 100;
    const newX = Math.max(0, Math.min(100, px - dragState.current.offsetX));
    const newY = Math.max(0, Math.min(100, py - dragState.current.offsetY));
    dragState.current.lastX = newX;
    dragState.current.lastY = newY;
    dragState.current.moved = true;
    forceRender(v => v + 1);
  };

  const onPointerUpCanvas = () => {
    if (!dragState.current) return;
    const { id, startX, startY, lastX, lastY, moved } = dragState.current;
    dragState.current = null;
    if (!moved) return;
    const el = page.elements?.find(e => e.id === id);
    if (!el) return;
    const idx = page.elements.indexOf(el);
    const w = el.position_w ?? layout.slots[idx]?.w ?? 40;
    const h = el.position_h ?? layout.slots[idx]?.h ?? 40;
    const z = el.z_index ?? idx;
    const r = el.rotation ?? 0;
    submitPosition(id, lastX, lastY, w, h, z, r);
  };

  const elements = page.elements || [];

  const getElBox = (el, i) => {
    const slot = layout.slots[i];
    return {
      x: el.position_x != null ? el.position_x : (slot?.x ?? 5),
      y: el.position_y != null ? el.position_y : (slot?.y ?? 5),
      w: el.position_w != null ? el.position_w : (slot?.w ?? 40),
      h: el.position_h != null ? el.position_h : (slot?.h ?? 40),
      r: el.rotation ?? 0,
      z: el.z_index ?? i,
    };
  };

  const saving = posPending || capPending || placePending || dupPending || delPending;

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div
        ref={canvasRef}
        onPointerMove={onPointerMoveCanvas}
        onPointerUp={onPointerUpCanvas}
        onPointerCancel={onPointerUpCanvas}
        onClick={() => setSelectedId(null)}
        style={{
          width: "100%", aspectRatio: "4/3", borderRadius: 3, position: "relative",
          background: `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.5), transparent 60%), linear-gradient(180deg, ${(BACKGROUNDS[backgroundId] || BACKGROUNDS.paper).from}, ${(BACKGROUNDS[backgroundId] || BACKGROUNDS.paper).to})`,
          boxShadow: `inset 0 0 40px ${TOKENS.paperShadow}, 0 2px 6px rgba(30,38,33,0.08)`,
          opacity: saving ? 0.7 : 1, transition: "opacity 0.2s", touchAction: "none", overflow: "hidden",
        }}
        onDragOver={handleDragOver}
      >
        <LeafDoodle style={{ bottom: 6, right: 8 }} flip />
        <LeafDoodle style={{ top: 4, left: 6, opacity: 0.28 }} />
        <form ref={reorderRef} action={reorderFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="albumId" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementIds" />
        </form>
        <form ref={posRef} action={posFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="positionX" />
          <input type="hidden" name="positionY" />
          <input type="hidden" name="positionW" />
          <input type="hidden" name="positionH" />
          <input type="hidden" name="zIndex" />
          <input type="hidden" name="rotation" />
        </form>
        <form ref={capRef} action={capFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="caption" />
        </form>
        <form ref={placeRef} action={placeFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="location" />
        </form>
        <form ref={zRef} action={zFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="direction" />
        </form>
        <form ref={dupRef} action={dupFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="albumId" />
        </form>
        <form ref={delRef} action={delFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="albumId" />
        </form>
        <form ref={mvUpRef} action={mvUpFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
        </form>
        <form ref={mvDnRef} action={mvDnFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
        </form>
        <form ref={frameRef} action={frameFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="albumId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="frameStyle" />
        </form>
        {elements.map((el, i) => {
          const live = dragState.current?.id === el.id;
          const box = getElBox(el, i);
          const x = live ? dragState.current.lastX : box.x;
          const y = live ? dragState.current.lastY : box.y;
          const style = {
            left: `${x}%`,
            top: `${y}%`,
            width: `${box.w}%`,
            height: `${box.h}%`,
            transform: `rotate(${box.r}deg)`,
            zIndex: box.z,
            position: "absolute",
            border: selectedId === el.id ? `2px solid ${TOKENS.gold}` : "1px solid transparent",
            borderRadius: 4,
            boxShadow: selectedId === el.id ? `0 0 0 3px ${TOKENS.gold}33` : "none",
            transition: live ? "none" : "border 0.15s, box-shadow 0.15s",
          };
          const slot = layout.slots[i];
          const isPhoto = el.type === "photo" || (slot?.type === "photo" && el.type !== "sticker" && el.type !== "text");
          const isSticker = el.type === "sticker";
          return (
            <div
              key={el.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, i)}
              onDragLeave={() => setDropIndex(null)}
              onDragEnter={() => setDropIndex(i)}
              onPointerDown={(e) => onPointerDownElement(e, el)}
              onClick={(e) => e.stopPropagation()}
              style={style}
            >
              {isSticker ? (
                <StickerSlot
                  element={el}
                  canEdit={canEdit}
                  style={{ width: "100%", height: "100%", position: "relative" }}
                  onDragStart={() => handleDragStart(i)}
                  isDragging={draggedIndex === i}
                />
              ) : isPhoto ? (
                <PhotoSlot
                  element={el}
                  familySlug={familySlug}
                  albumId={albumId}
                  pageId={page.id}
                  saveElementPhotoUrlAction={saveElementPhotoUrlAction}
                  deleteElementAction={deleteElementAction}
                  canEdit={canEdit}
                  style={{ width: "100%", height: "100%", position: "relative" }}
                  onDragStart={() => handleDragStart(i)}
                  isDragging={draggedIndex === i}
                />
              ) : (
                <TextSlot
                  element={el}
                  familySlug={familySlug}
                  albumId={albumId}
                  updateElementTextAction={updateElementTextAction}
                  canEdit={canEdit}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
              {el.caption && selectedId !== el.id && (
                <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, fontSize: 10, color: "#fff", background: "rgba(0,0,0,0.55)", padding: "2px 6px", borderRadius: 3, pointerEvents: "none" }}>
                  {el.caption}
                </div>
              )}
            </div>
          );
        })}
        {[reorderState?.error, posState?.error, capState?.error, placeState?.error, zState?.error, dupState?.error, delState?.error, mvUpState?.error, mvDnState?.error].filter(Boolean).length > 0 && (
          <div style={{ position: "absolute", top: 8, left: 8, right: 8, background: "#fff1f0", color: TOKENS.danger, border: `1px solid ${TOKENS.danger}`, borderRadius: 6, padding: "6px 10px", fontSize: 11.5, zIndex: 50 }}>
            {[reorderState?.error, posState?.error, capState?.error, placeState?.error, zState?.error, dupState?.error, delState?.error, mvUpState?.error, mvDnState?.error].filter(Boolean)[0]}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, color: TOKENS.ink40, display: "flex", alignItems: "center", gap: 10 }}>
          {page.date_label && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} /> {page.date_label}</span>}
          {page.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPinned size={10} /> {page.location}</span>}
        </div>
      </div>

      {selected && canEdit && (
        <div style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: TOKENS.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Element</div>
            <div style={{ fontSize: 12, color: TOKENS.ink60, marginBottom: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              <div>X: {getElBox(selected, elements.indexOf(selected)).x.toFixed(1)}%</div>
              <div>Y: {getElBox(selected, elements.indexOf(selected)).y.toFixed(1)}%</div>
              <div>W: {getElBox(selected, elements.indexOf(selected)).w.toFixed(1)}%</div>
              <div>H: {getElBox(selected, elements.indexOf(selected)).h.toFixed(1)}%</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button
                onClick={() => {
                  const f = zRef.current; if (!f) return;
                  f.elements.familySlug.value = familySlug;
                  f.elements.pageId.value = page.id;
                  f.elements.elementId.value = selected.id;
                  f.elements.direction.value = "up";
                  setTimeout(() => f.requestSubmit(), 0);
                }}
                title="Z-index oldinga"
                style={{ flex: 1, padding: "7px", border: `1px solid ${TOKENS.parchmentDeep}`, background: "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.ink }}
              ><ChevronUp size={15} /></button>
              <button
                onClick={() => {
                  const f = zRef.current; if (!f) return;
                  f.elements.familySlug.value = familySlug;
                  f.elements.pageId.value = page.id;
                  f.elements.elementId.value = selected.id;
                  f.elements.direction.value = "down";
                  setTimeout(() => f.requestSubmit(), 0);
                }}
                title="Z-index orqaga"
                style={{ flex: 1, padding: "7px", border: `1px solid ${TOKENS.parchmentDeep}`, background: "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.ink }}
              ><ChevronDown size={15} /></button>
              <button
                onClick={() => {
                  const f = mvUpRef.current; if (!f) return;
                  f.elements.familySlug.value = familySlug;
                  f.elements.pageId.value = page.id;
                  f.elements.elementId.value = selected.id;
                  setTimeout(() => f.requestSubmit(), 0);
                }}
                title="Slot oldinga"
                style={{ flex: 1, padding: "7px", border: `1px solid ${TOKENS.parchmentDeep}`, background: "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.ink, fontSize: 11 }}>↑↑</button>
              <button
                onClick={() => {
                  const f = mvDnRef.current; if (!f) return;
                  f.elements.familySlug.value = familySlug;
                  f.elements.pageId.value = page.id;
                  f.elements.elementId.value = selected.id;
                  setTimeout(() => f.requestSubmit(), 0);
                }}
                title="Slot orqaga"
                style={{ flex: 1, padding: "7px", border: `1px solid ${TOKENS.parchmentDeep}`, background: "transparent", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.ink, fontSize: 11 }}>↓↓</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <button
                onClick={() => {
                  const f = dupRef.current; if (!f) return;
                  f.elements.familySlug.value = familySlug;
                  f.elements.pageId.value = page.id;
                  f.elements.albumId.value = albumId;
                  f.elements.elementId.value = selected.id;
                  setTimeout(() => f.requestSubmit(), 0);
                }}
                style={{ flex: 1, padding: "8px", background: TOKENS.gold, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
              ><Copy size={13} /> Nusxa</button>
              <button
                onClick={() => {
                  if (!confirm("Bu elementni o'chirishni xohlaysizmi?")) return;
                  const f = delRef.current; if (!f) return;
                  f.elements.familySlug.value = familySlug;
                  f.elements.pageId.value = page.id;
                  f.elements.albumId.value = albumId;
                  f.elements.elementId.value = selected.id;
                  setTimeout(() => f.requestSubmit(), 0);
                  setSelectedId(null);
                }}
                style={{ flex: 1, padding: "8px", background: TOKENS.danger, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
              ><Trash2 size={13} /> O'chir</button>
            </div>
            {(selected.type === "photo" || (selected.type !== "sticker" && selected.type !== "text")) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: TOKENS.ink40, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Ramka</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {FRAME_LIST.map((f) => (
                    <button
                      key={f.id}
                      title={f.name}
                      onClick={() => {
                        const form = frameRef.current; if (!form) return;
                        form.elements.familySlug.value = familySlug;
                        form.elements.albumId.value = albumId;
                        form.elements.elementId.value = selected.id;
                        form.elements.frameStyle.value = f.id;
                        setTimeout(() => form.requestSubmit(), 0);
                      }}
                      style={{
                        flex: 1, padding: "7px 4px", fontSize: 10, borderRadius: 6, cursor: "pointer",
                        border: (selected.frame_style || "polaroid") === f.id ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`,
                        background: "transparent", color: TOKENS.ink,
                      }}
                    >{f.name}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: TOKENS.ink40, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Caption (tag)</div>
                <input
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  onBlur={() => {
                    const f = capRef.current; if (!f) return;
                    f.elements.familySlug.value = familySlug;
                    f.elements.elementId.value = selected.id;
                    f.elements.caption.value = captionDraft;
                    setTimeout(() => f.requestSubmit(), 0);
                  }}
                  placeholder="Rasm tagi yozuv..."
                  style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, fontFamily: "inherit", color: TOKENS.ink }}
                />
              </div>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: TOKENS.ink40, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Joy (location)</div>
                <input
                  value={placeDraft}
                  onChange={(e) => setPlaceDraft(e.target.value)}
                  onBlur={() => {
                    const f = placeRef.current; if (!f) return;
                    f.elements.familySlug.value = familySlug;
                    f.elements.elementId.value = selected.id;
                    f.elements.location.value = placeDraft;
                    setTimeout(() => f.requestSubmit(), 0);
                  }}
                  placeholder="Qayerda olingan..."
                  style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, fontFamily: "inherit", color: TOKENS.ink }}
                />
              </div>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: TOKENS.ink40, lineHeight: 1.5, textAlign: "center" }}>
            💡 Elementni sichqoncha bilan tortib, erkin joylashtiring. Koordinatalar avtomatik saqlanadi.
          </div>
        </div>
      )}
    </div>
  );
}

function AlbumEditor({
  album,
  onBack,
  familySlug,
  canEdit,
  addAlbumPageAction,
  deleteAlbumPageAction,
  changePageLayoutAction,
  saveElementPhotoUrlAction,
  updateElementTextAction,
  reorderElementsAction,
  deleteElementAction,
  updateElementPositionAction,
  updateElementCaptionAction,
  updateElementPlaceAction,
  changeZIndexAction,
  duplicateElementAction,
  moveElementUpAction,
  moveElementDownAction,
  updateElementFrameAction,
  changePageBackgroundAction,
  addStickerElementAction,
  deleteAlbumAction,
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(false);

  const pages = album.pages;
  const currentPage = pages[Math.min(pageIndex, pages.length - 1)];
  const currentLayout = currentPage ? LAYOUTS.find((l) => l.id === currentPage.layout_id) || LAYOUTS[0] : LAYOUTS[0];

  const [addPageState, addPageFormAction, addPagePending] = useActionState(addAlbumPageAction, undefined);
  const [layoutState, layoutFormAction] = useActionState(changePageLayoutAction, undefined);
  const [deletePageState, deletePageFormAction] = useActionState(deleteAlbumPageAction, undefined);
  const [deleteAlbumState, deleteAlbumFormAction, deleteAlbumPending] = useActionState(deleteAlbumAction, undefined);
  const [bgState, bgFormAction] = useActionState(changePageBackgroundAction, undefined);
  const [stickerState, stickerFormAction, stickerPending] = useActionState(addStickerElementAction, undefined);

  return (
    <div style={{ padding: "22px clamp(16px, 4vw, 40px) 60px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TOKENS.ink60, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <ChevronLeft size={16} /> Albomlarga qaytish
        </button>
        {canEdit && (
          !confirmDeleteAlbum ? (
            <button onClick={() => setConfirmDeleteAlbum(true)} style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.danger, background: "transparent", border: `1px solid ${TOKENS.danger}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
              Albomni o'chirish
            </button>
          ) : (
            <form action={deleteAlbumFormAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="hidden" name="familySlug" value={familySlug} />
              <input type="hidden" name="albumId" value={album.id} />
              <span style={{ fontSize: 11.5, color: TOKENS.danger }}>Rostdan ham?</span>
              <button type="submit" disabled={deleteAlbumPending} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: TOKENS.danger, border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>
                Ha, o'chirish
              </button>
              <button type="button" onClick={() => setConfirmDeleteAlbum(false)} style={{ fontSize: 12, fontWeight: 600, color: TOKENS.ink60, background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>
                Bekor qilish
              </button>
            </form>
          )
        )}
      </div>

      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 27, fontWeight: 500, margin: 0 }}>{album.title}</h1>
        <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 4 }}>{[album.date_label, album.location].filter(Boolean).join(" · ")}</div>
      </div>

      {pages.length === 0 || !currentPage ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: TOKENS.ink60, fontSize: 13.5 }}>Bu albomda hali sahifa yo'q.</div>
      ) : (
        (() => {
          const rightPage = pages[pageIndex + 1] || null;
          const rightLayout = rightPage ? (LAYOUTS.find((l) => l.id === rightPage.layout_id) || LAYOUTS[0]) : null;
          const totalSpreads = Math.ceil(pages.length / 2);
          const spreadNum = Math.floor(pageIndex / 2) + 1;

          return (
            <div style={{ background: `linear-gradient(180deg, ${TOKENS.bookCoverSoft}, ${TOKENS.bookCover})`, borderRadius: 18, padding: "18px 18px 20px" }}>
              {/* Book toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button onClick={() => setPageIndex(Math.max(0, pageIndex - 2))} disabled={pageIndex === 0} style={{ background: "none", border: "none", cursor: pageIndex === 0 ? "default" : "pointer", color: "#F2EDE2", opacity: pageIndex === 0 ? 0.3 : 0.85 }}><ChevronLeft size={20} /></button>
                  <span style={{ fontSize: 12.5, color: "rgba(242,237,226,0.75)", fontWeight: 500 }}>Sahifa {spreadNum} / {totalSpreads}</span>
                  <button onClick={() => setPageIndex(Math.min(pages.length - (pages.length % 2 === 0 ? 2 : 1), pageIndex + 2))} disabled={pageIndex + 2 >= pages.length} style={{ background: "none", border: "none", cursor: pageIndex + 2 >= pages.length ? "default" : "pointer", color: "#F2EDE2", opacity: pageIndex + 2 >= pages.length ? 0.3 : 0.85 }}><ChevronRight size={20} /></button>
                </div>
                {canEdit && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ChipButton active={showLayoutPicker} onClick={() => { setShowLayoutPicker(!showLayoutPicker); setShowBgPicker(false); setShowStickerPicker(false); }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: showLayoutPicker ? undefined : "#F2EDE2" }}><LayoutGrid size={13} /> Layout</span>
                    </ChipButton>
                    <ChipButton active={showStickerPicker} onClick={() => { setShowStickerPicker(!showStickerPicker); setShowBgPicker(false); setShowLayoutPicker(false); }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: showStickerPicker ? undefined : "#F2EDE2" }}><StickerIcon size={13} /> Stiker</span>
                    </ChipButton>
                    <ChipButton active={showBgPicker} onClick={() => { setShowBgPicker(!showBgPicker); setShowLayoutPicker(false); setShowStickerPicker(false); }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: showBgPicker ? undefined : "#F2EDE2" }}><Palette size={13} /> Fon</span>
                    </ChipButton>
                  </div>
                )}
              </div>

              {showStickerPicker && (
                <div style={{ display: "flex", gap: 10, marginBottom: 18, background: TOKENS.card, padding: 14, borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}` }}>
                  {STICKER_LIST.map((s) => {
                    const Icon = STICKER_ICONS[s.id];
                    return (
                      <form key={s.id} action={stickerFormAction} onSubmit={() => setShowStickerPicker(false)}>
                        <input type="hidden" name="familySlug" value={familySlug} />
                        <input type="hidden" name="albumId" value={album.id} />
                        <input type="hidden" name="pageId" value={currentPage.id} />
                        <input type="hidden" name="stickerId" value={s.id} />
                        <button type="submit" disabled={stickerPending} title={s.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px 14px", cursor: stickerPending ? "default" : "pointer" }}>
                          <Icon size={20} color={TOKENS.teal} />
                          <span style={{ fontSize: 9.5, color: TOKENS.ink60 }}>{s.name}</span>
                        </button>
                      </form>
                    );
                  })}
                  <div style={{ fontSize: 10.5, color: TOKENS.ink40, alignSelf: "center", maxWidth: 160 }}>Chap sahifaga qo'shiladi, keyin sudrab joylashtiring.</div>
                </div>
              )}
              {stickerState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{stickerState.error}</div>}

              {showBgPicker && (
                <div style={{ display: "flex", gap: 10, marginBottom: 18, background: TOKENS.card, padding: 14, borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}` }}>
                  {BACKGROUND_LIST.map((b) => (
                    <form key={b.id} action={bgFormAction} onSubmit={() => setShowBgPicker(false)}>
                      <input type="hidden" name="familySlug" value={familySlug} />
                      <input type="hidden" name="albumId" value={album.id} />
                      <input type="hidden" name="pageId" value={currentPage.id} />
                      <input type="hidden" name="backgroundId" value={b.id} />
                      <button type="submit" title={b.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "transparent", border: (currentPage.background_id || "paper") === b.id ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: 6, cursor: "pointer" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 6, background: `linear-gradient(180deg, ${b.from}, ${b.to})` }} />
                        <span style={{ fontSize: 9.5, color: TOKENS.ink60 }}>{b.name}</span>
                      </button>
                    </form>
                  ))}
                  <div style={{ fontSize: 10.5, color: TOKENS.ink40, alignSelf: "center", maxWidth: 150 }}>Chap sahifaning foniga qo'llanadi.</div>
                </div>
              )}
              {bgState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{bgState.error}</div>}

              {showLayoutPicker && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18, background: TOKENS.card, padding: 14, borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}` }}>
                  {LAYOUTS.map((l) => (
                    <form key={l.id} action={layoutFormAction} onSubmit={() => setShowLayoutPicker(false)}>
                      <input type="hidden" name="familySlug" value={familySlug} />
                      <input type="hidden" name="albumId" value={album.id} />
                      <input type="hidden" name="pageId" value={currentPage.id} />
                      <input type="hidden" name="layoutId" value={l.id} />
                      <button
                        type="submit"
                        style={{ width: "100%", cursor: "pointer", border: currentLayout.id === l.id ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: 8, background: "#fff" }}
                      >
                        <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: TOKENS.parchment, borderRadius: 3, marginBottom: 6 }}>
                          {l.slots.map((s, i) => <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`, background: s.type === "photo" ? TOKENS.goldSoft : TOKENS.tealSoft, borderRadius: 2, opacity: 0.7 }} />)}
                        </div>
                        <div style={{ fontSize: 10, color: TOKENS.ink60, textAlign: "center" }}>{l.name}</div>
                      </button>
                    </form>
                  ))}
                </div>
              )}
              {layoutState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{layoutState.error}</div>}

              {/* Two-page spread */}
              <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", position: "relative" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <PageCanvas
                    page={currentPage}
                    layout={currentLayout}
                    familySlug={familySlug}
                    albumId={album.id}
                    canEdit={canEdit}
                    saveElementPhotoUrlAction={saveElementPhotoUrlAction}
                    updateElementTextAction={updateElementTextAction}
                    reorderElementsAction={reorderElementsAction}
                    deleteElementAction={deleteElementAction}
                    updateElementPositionAction={updateElementPositionAction}
                    updateElementCaptionAction={updateElementCaptionAction}
                    updateElementPlaceAction={updateElementPlaceAction}
                    changeZIndexAction={changeZIndexAction}
                    duplicateElementAction={duplicateElementAction}
                    moveElementUpAction={moveElementUpAction}
                    moveElementDownAction={moveElementDownAction}
                    updateElementFrameAction={updateElementFrameAction}
                    backgroundId={currentPage.background_id || "paper"}
                  />
                </div>
                {/* Spine shadow between pages */}
                <div style={{ width: 22, marginLeft: -11, marginRight: -11, zIndex: 5, background: "linear-gradient(90deg, transparent, rgba(30,26,15,0.22) 45%, rgba(30,26,15,0.22) 55%, transparent)", pointerEvents: "none" }} />
                <div style={{ flex: 1, position: "relative" }}>
                  {rightPage ? (
                    <PageCanvas
                      page={rightPage}
                      layout={rightLayout}
                      familySlug={familySlug}
                      albumId={album.id}
                      canEdit={canEdit}
                      saveElementPhotoUrlAction={saveElementPhotoUrlAction}
                      updateElementTextAction={updateElementTextAction}
                      reorderElementsAction={reorderElementsAction}
                      deleteElementAction={deleteElementAction}
                      updateElementPositionAction={updateElementPositionAction}
                      updateElementCaptionAction={updateElementCaptionAction}
                      updateElementPlaceAction={updateElementPlaceAction}
                      changeZIndexAction={changeZIndexAction}
                      duplicateElementAction={duplicateElementAction}
                      moveElementUpAction={moveElementUpAction}
                      moveElementDownAction={moveElementDownAction}
                      updateElementFrameAction={updateElementFrameAction}
                      backgroundId={rightPage.background_id || "paper"}
                    />
                  ) : (
                    <div style={{ width: "100%", aspectRatio: "4/3", background: `linear-gradient(180deg, ${TOKENS.paper}, #ECE2C8)` }}>
                      {canEdit && (
                        <form action={addPageFormAction} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <input type="hidden" name="familySlug" value={familySlug} />
                          <input type="hidden" name="albumId" value={album.id} />
                          <button type="submit" disabled={addPagePending} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "transparent", border: `1.5px dashed ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "16px 22px", color: TOKENS.ink40, cursor: addPagePending ? "default" : "pointer" }}>
                            <Plus size={18} /><span style={{ fontSize: 11.5 }}>Sahifa qo'shish</span>
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {canEdit && (
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <form action={deletePageFormAction} style={{ display: "inline" }}>
                    <input type="hidden" name="familySlug" value={familySlug} />
                    <input type="hidden" name="albumId" value={album.id} />
                    <input type="hidden" name="pageId" value={currentPage.id} />
                    <button type="submit" disabled={pages.length <= 1} style={{ fontSize: 11.5, color: pages.length <= 1 ? "rgba(242,237,226,0.3)" : "#E7A79B", background: "none", border: "none", cursor: pages.length <= 1 ? "default" : "pointer" }}>
                      Sahifani o'chirish
                    </button>
                  </form>
                </div>
              )}
              {deletePageState?.error && <div style={{ fontSize: 11.5, color: "#E7A79B", textAlign: "center", marginTop: 6 }}>{deletePageState.error}</div>}

              {/* Thumbnail filmstrip */}
              <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 22, paddingTop: 4, paddingBottom: 2 }}>
                {pages.map((p, i) => {
                  const firstPhoto = p.elements.find((e) => e.type === "photo" && e.photo_url);
                  const inSpread = i === pageIndex || i === pageIndex + 1;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPageIndex(i % 2 === 0 ? i : i - 1)}
                      title={`Sahifa ${i + 1}`}
                      style={{
                        width: 72, aspectRatio: "4/3", flexShrink: 0, borderRadius: 4, background: "#fff",
                        border: inSpread ? `2px solid ${TOKENS.gold}` : "1px solid rgba(242,237,226,0.18)",
                        cursor: "pointer", position: "relative", overflow: "hidden",
                        boxShadow: inSpread ? `0 0 0 2px rgba(184,134,59,0.25)` : "none",
                      }}
                    >
                      {firstPhoto ? (
                        <div style={{ position: "absolute", inset: 3, backgroundImage: `url(${firstPhoto.photo_url})`, backgroundSize: "cover", borderRadius: 2 }} />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, background: TOKENS.parchment }} />
                      )}
                      <div style={{ position: "absolute", bottom: 2, right: 3, fontSize: 8.5, color: "#fff", background: "rgba(0,0,0,0.5)", borderRadius: 3, padding: "0 3px" }}>{i + 1}</div>
                    </div>
                  );
                })}
                {canEdit && (
                  <form action={addPageFormAction}>
                    <input type="hidden" name="familySlug" value={familySlug} />
                    <input type="hidden" name="albumId" value={album.id} />
                    <button type="submit" disabled={addPagePending} style={{ width: 72, aspectRatio: "4/3", flexShrink: 0, borderRadius: 4, border: "1.5px dashed rgba(242,237,226,0.3)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(242,237,226,0.6)", cursor: addPagePending ? "default" : "pointer" }}>
                      <Plus size={16} />
                    </button>
                  </form>
                )}
              </div>
              {addPageState?.error && <div style={{ fontSize: 11, color: "#E7A79B", marginTop: 8 }}>{addPageState.error}</div>}
            </div>
          );
        })()
      )}
    </div>
  );
}

export function AlbumsView({
  albums,
  activeAlbumId,
  openAlbumId,
  setOpenAlbumId,
  familySlug,
  canEdit,
  createAlbumAction,
  deleteAlbumAction,
  addAlbumPageAction,
  deleteAlbumPageAction,
  changePageLayoutAction,
  saveElementPhotoUrlAction,
  updateElementTextAction,
  reorderElementsAction,
  deleteElementAction,
  updateElementPositionAction,
  updateElementCaptionAction,
  updateElementPlaceAction,
  changeZIndexAction,
  duplicateElementAction,
  moveElementUpAction,
  moveElementDownAction,
  updateElementFrameAction,
  changePageBackgroundAction,
  addStickerElementAction,
}) {
  const effectiveOpenId = openAlbumId ?? activeAlbumId;
  const openAlbum = albums.find((a) => a.id === effectiveOpenId) || null;

  return (
    <div className="fm-fade" style={{ height: "100%", overflow: "auto" }}>
      {openAlbum ? (
        <AlbumEditor
          album={openAlbum}
          onBack={() => setOpenAlbumId(null)}
          familySlug={familySlug}
          canEdit={canEdit}
          addAlbumPageAction={addAlbumPageAction}
          deleteAlbumPageAction={deleteAlbumPageAction}
          changePageLayoutAction={changePageLayoutAction}
          saveElementPhotoUrlAction={saveElementPhotoUrlAction}
          updateElementTextAction={updateElementTextAction}
          reorderElementsAction={reorderElementsAction}
          deleteElementAction={deleteElementAction}
          updateElementPositionAction={updateElementPositionAction}
          updateElementCaptionAction={updateElementCaptionAction}
          updateElementPlaceAction={updateElementPlaceAction}
          changeZIndexAction={changeZIndexAction}
          duplicateElementAction={duplicateElementAction}
          moveElementUpAction={moveElementUpAction}
          moveElementDownAction={moveElementDownAction}
          updateElementFrameAction={updateElementFrameAction}
          changePageBackgroundAction={changePageBackgroundAction}
          addStickerElementAction={addStickerElementAction}
          deleteAlbumAction={deleteAlbumAction}
        />      ) : (
        <AlbumGrid albums={albums} onOpen={(a) => setOpenAlbumId(a.id)} canEdit={canEdit} createAlbumAction={createAlbumAction} familySlug={familySlug} />
      )}
    </div>
  );
}
