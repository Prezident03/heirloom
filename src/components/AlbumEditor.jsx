"use client";

import React, { useState, useRef, useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  BookImage, Plus, X, ImagePlus, LayoutGrid,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Copy, Trash2, Calendar, MapPinned,
  Leaf, Flower2, Heart, Star, Sun, Palette, Sticker as StickerIcon, Frame,
  AlignLeft, AlignCenter, AlignRight,
  Sparkles, Moon, Cloud, Gift, Cake, PartyPopper, Camera, Music, Crown, Umbrella,
  Snowflake, Smile, Feather, Type,
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

// Yengil qog'oz texturasi — SVG fractal-noise, data-URI sifatida (tashqi rasm shart emas).
const PAPER_TEXTURE_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Stikerlar — src/lib/albums.ts dagi STICKERS bilan mos id'lar/kind'lar.
const STICKER_ICONS = {
  leaf: Leaf, flower: Flower2, heart: Heart, star: Star, sun: Sun,
  sparkles: Sparkles, moon: Moon, cloud: Cloud, gift: Gift, cake: Cake,
  party: PartyPopper, camera: Camera, music: Music, crown: Crown,
  umbrella: Umbrella, snowflake: Snowflake, smile: Smile, feather: Feather,
};
const STICKER_GROUPS = [
  {
    label: "Ikonkalar",
    items: [
      { id: "leaf", name: "Barg", kind: "icon", defaultColor: "#2F4C48" },
      { id: "flower", name: "Gul", kind: "icon", defaultColor: "#2F4C48" },
      { id: "heart", name: "Yurak", kind: "icon", defaultColor: "#A8453A" },
      { id: "star", name: "Yulduz", kind: "icon", defaultColor: "#B8863B" },
      { id: "sun", name: "Quyosh", kind: "icon", defaultColor: "#B8863B" },
      { id: "sparkles", name: "Yulduzcha", kind: "icon", defaultColor: "#B8863B" },
      { id: "moon", name: "Oy", kind: "icon", defaultColor: "#2F4C48" },
      { id: "cloud", name: "Bulut", kind: "icon", defaultColor: "#5C7A73" },
      { id: "gift", name: "Sovg'a", kind: "icon", defaultColor: "#A8453A" },
      { id: "cake", name: "Tort", kind: "icon", defaultColor: "#A8453A" },
      { id: "party", name: "Bayram", kind: "icon", defaultColor: "#B8863B" },
      { id: "camera", name: "Kamera", kind: "icon", defaultColor: "#1E2621" },
      { id: "music", name: "Musiqa", kind: "icon", defaultColor: "#2F4C48" },
      { id: "crown", name: "Toj", kind: "icon", defaultColor: "#B8863B" },
      { id: "umbrella", name: "Soyabon", kind: "icon", defaultColor: "#5C7A73" },
      { id: "snowflake", name: "Qor kristali", kind: "icon", defaultColor: "#5C7A73" },
      { id: "smile", name: "Kulgi", kind: "icon", defaultColor: "#B8863B" },
      { id: "feather", name: "Pat", kind: "icon", defaultColor: "#5C7A73" },
    ],
  },
  {
    label: "Shakllar",
    items: [
      { id: "circle-shape", name: "Doira", kind: "shape", defaultColor: "#D9BC85" },
      { id: "square-shape", name: "Kvadrat", kind: "shape", defaultColor: "#5C7A73" },
      { id: "triangle-shape", name: "Uchburchak", kind: "shape", defaultColor: "#A8453A" },
    ],
  },
  {
    label: "Washi-lenta",
    items: [
      { id: "tape-gold", name: "Oltin", kind: "tape", defaultColor: "#D9BC85" },
      { id: "tape-teal", name: "Teal", kind: "tape", defaultColor: "#5C7A73" },
      { id: "tape-blush", name: "Blush", kind: "tape", defaultColor: "#E6C9BC" },
      { id: "tape-stripe", name: "Chiziqli", kind: "tape", defaultColor: "#B8863B" },
    ],
  },
];
const STICKER_LIST = STICKER_GROUPS.flatMap((g) => g.items);
const STICKER_DEFAULT_COLORS = Object.fromEntries(STICKER_LIST.map((s) => [s.id, s.defaultColor]));
const STICKER_COLORS = ["#1E2621", "#B8863B", "#2F4C48", "#A8453A", "#D9BC85", "#5C7A73", "#E6C9BC", "#F2EDE2"];

const FRAME_LIST = [
  { id: "polaroid", name: "Polaroid" },
  { id: "soft", name: "Yumshoq soya" },
  { id: "none", name: "Ramkasiz" },
];

// Tayyor shablonlar — src/lib/albums.ts dagi TEMPLATES bilan qo'lda
// sinxronlangan (bu client komponent, server-only albums.ts'ni import qila
// olmaydi). Har biri: fon + rasm/matn slotlari + dekorativ stikerlar.
const TEMPLATES = {
  "classic-cream": {
    name: "Klassik", category: "Oddiy", backgroundId: "paper",
    slots: [{ type: "photo", x: 8, y: 8, w: 84, h: 58 }, { type: "text", x: 8, y: 70, w: 84, h: 22 }],
    stickers: [{ stickerId: "tape-gold", kind: "tape", x: 38, y: 3, w: 24, h: 7, color: "#D9BC85" }],
  },
  "ikki-esdalik": {
    name: "Ikki xotira", category: "Oddiy", backgroundId: "sage",
    slots: [{ type: "photo", x: 6, y: 8, w: 41, h: 68 }, { type: "photo", x: 53, y: 8, w: 41, h: 68 }, { type: "text", x: 6, y: 80, w: 88, h: 14 }],
    stickers: [{ stickerId: "heart", kind: "icon", x: 46, y: 4, w: 10, h: 10, color: "#A8453A" }, { stickerId: "leaf", kind: "icon", x: 2, y: 2, w: 9, h: 9, color: "#2F4C48" }],
  },
  "uch-lavha": {
    name: "Uch lavha", category: "Oddiy", backgroundId: "slate",
    slots: [{ type: "photo", x: 5, y: 10, w: 28, h: 55 }, { type: "photo", x: 36, y: 10, w: 28, h: 55 }, { type: "photo", x: 67, y: 10, w: 28, h: 55 }, { type: "text", x: 5, y: 70, w: 90, h: 22 }],
    stickers: [{ stickerId: "cloud", kind: "icon", x: 2, y: 2, w: 10, h: 10, color: "#5C7A73" }, { stickerId: "umbrella", kind: "icon", x: 88, y: 2, w: 10, h: 10, color: "#5C7A73" }],
  },
  "minimal-oq": {
    name: "Minimal", category: "Oddiy", backgroundId: "paper",
    slots: [{ type: "photo", x: 12, y: 10, w: 76, h: 62 }, { type: "text", x: 12, y: 76, w: 76, h: 16 }],
    stickers: [{ stickerId: "square-shape", kind: "shape", x: 4, y: 4, w: 7, h: 7, color: "#D9BC85" }],
  },
  sayohat: {
    name: "Sayohat kundaligi", category: "Sayohat", backgroundId: "blush",
    slots: [{ type: "photo", x: 6, y: 6, w: 60, h: 50 }, { type: "photo", x: 68, y: 6, w: 26, h: 24 }, { type: "photo", x: 68, y: 32, w: 26, h: 24 }, { type: "text", x: 6, y: 60, w: 88, h: 32 }],
    stickers: [{ stickerId: "camera", kind: "icon", x: 4, y: 58, w: 10, h: 10, color: "#1E2621" }, { stickerId: "sun", kind: "icon", x: 84, y: 4, w: 10, h: 10, color: "#B8863B" }, { stickerId: "tape-blush", kind: "tape", x: 60, y: 2, w: 22, h: 7, color: "#E6C9BC" }],
  },
  "tabiat-sayri": {
    name: "Tabiat sayri", category: "Sayohat", backgroundId: "sage",
    slots: [{ type: "photo", x: 6, y: 6, w: 60, h: 50 }, { type: "photo", x: 68, y: 6, w: 26, h: 24 }, { type: "photo", x: 68, y: 32, w: 26, h: 24 }, { type: "text", x: 6, y: 60, w: 88, h: 32 }],
    stickers: [{ stickerId: "leaf", kind: "icon", x: 2, y: 2, w: 10, h: 10, color: "#2F4C48" }, { stickerId: "feather", kind: "icon", x: 90, y: 2, w: 8, h: 8, color: "#5C7A73" }, { stickerId: "cloud", kind: "icon", x: 2, y: 90, w: 9, h: 9, color: "#5C7A73" }],
  },
  "tugilgan-kun": {
    name: "Tug'ilgan kun", category: "Bayram", backgroundId: "paper",
    slots: [{ type: "photo", x: 10, y: 10, w: 80, h: 55 }, { type: "text", x: 10, y: 68, w: 80, h: 24 }],
    stickers: [{ stickerId: "cake", kind: "icon", x: 4, y: 4, w: 12, h: 12, color: "#A8453A" }, { stickerId: "party", kind: "icon", x: 84, y: 4, w: 12, h: 12, color: "#B8863B" }, { stickerId: "gift", kind: "icon", x: 4, y: 84, w: 10, h: 10, color: "#2F4C48" }, { stickerId: "sparkles", kind: "icon", x: 86, y: 84, w: 10, h: 10, color: "#B8863B" }],
  },
  yubiley: {
    name: "Yubiley", category: "Bayram", backgroundId: "paper",
    slots: [{ type: "photo", x: 10, y: 8, w: 80, h: 52 }, { type: "text", x: 10, y: 64, w: 80, h: 26 }],
    stickers: [{ stickerId: "crown", kind: "icon", x: 4, y: 4, w: 10, h: 10, color: "#B8863B" }, { stickerId: "star", kind: "icon", x: 88, y: 4, w: 9, h: 9, color: "#B8863B" }, { stickerId: "tape-gold", kind: "tape", x: 38, y: 2, w: 24, h: 6, color: "#D9BC85" }, { stickerId: "tape-gold", kind: "tape", x: 38, y: 60, w: 24, h: 6, color: "#D9BC85" }],
  },
  "bayram-kechasi": {
    name: "Bayram kechasi", category: "Bayram", backgroundId: "midnight",
    slots: [{ type: "photo", x: 5, y: 8, w: 28, h: 50 }, { type: "photo", x: 36, y: 8, w: 28, h: 50 }, { type: "photo", x: 67, y: 8, w: 28, h: 50 }, { type: "text", x: 5, y: 64, w: 90, h: 26 }],
    stickers: [{ stickerId: "party", kind: "icon", x: 2, y: 2, w: 9, h: 9, color: "#D9BC85" }, { stickerId: "music", kind: "icon", x: 90, y: 2, w: 8, h: 8, color: "#D9BC85" }, { stickerId: "sparkles", kind: "icon", x: 2, y: 92, w: 8, h: 8, color: "#D9BC85" }, { stickerId: "sparkles", kind: "icon", x: 90, y: 92, w: 8, h: 8, color: "#D9BC85" }],
  },
  bahor: {
    name: "Bahor kayfiyati", category: "Fasllar", backgroundId: "sage",
    slots: [{ type: "photo", x: 8, y: 10, w: 84, h: 56 }, { type: "text", x: 8, y: 70, w: 84, h: 20 }],
    stickers: [{ stickerId: "flower", kind: "icon", x: 4, y: 4, w: 10, h: 10, color: "#A8453A" }, { stickerId: "leaf", kind: "icon", x: 88, y: 4, w: 9, h: 9, color: "#2F4C48" }, { stickerId: "sun", kind: "icon", x: 4, y: 88, w: 9, h: 9, color: "#B8863B" }],
  },
  "qish-ertagi": {
    name: "Qish ertagi", category: "Fasllar", backgroundId: "midnight",
    slots: [{ type: "photo", x: 8, y: 10, w: 84, h: 54 }, { type: "text", x: 8, y: 68, w: 84, h: 24 }],
    stickers: [{ stickerId: "snowflake", kind: "icon", x: 4, y: 4, w: 9, h: 9, color: "#D9BC85" }, { stickerId: "moon", kind: "icon", x: 86, y: 4, w: 9, h: 9, color: "#D9BC85" }, { stickerId: "star", kind: "icon", x: 4, y: 86, w: 8, h: 8, color: "#D9BC85" }, { stickerId: "sparkles", kind: "icon", x: 88, y: 86, w: 8, h: 8, color: "#D9BC85" }],
  },
  "romantik-kech": {
    name: "Romantik kech", category: "Romantik", backgroundId: "midnight",
    slots: [{ type: "photo", x: 15, y: 8, w: 70, h: 58 }, { type: "text", x: 15, y: 70, w: 70, h: 20 }],
    stickers: [{ stickerId: "heart", kind: "icon", x: 4, y: 4, w: 9, h: 9, color: "#A8453A" }, { stickerId: "moon", kind: "icon", x: 88, y: 4, w: 9, h: 9, color: "#D9BC85" }, { stickerId: "sparkles", kind: "icon", x: 4, y: 88, w: 8, h: 8, color: "#D9BC85" }],
  },
  "bolalik-lahzalari": {
    name: "Bolalik lahzalari", category: "Oila", backgroundId: "blush",
    slots: [{ type: "photo", x: 6, y: 8, w: 41, h: 66 }, { type: "photo", x: 53, y: 8, w: 41, h: 66 }, { type: "text", x: 6, y: 78, w: 88, h: 16 }],
    stickers: [{ stickerId: "smile", kind: "icon", x: 46, y: 3, w: 9, h: 9, color: "#B8863B" }, { stickerId: "crown", kind: "icon", x: 2, y: 2, w: 9, h: 9, color: "#B8863B" }, { stickerId: "star", kind: "icon", x: 90, y: 2, w: 8, h: 8, color: "#B8863B" }],
  },
};
const TEMPLATE_LIST = Object.entries(TEMPLATES).map(([id, t]) => ({ id, ...t }));
const TEMPLATE_CATEGORIES = [...new Set(TEMPLATE_LIST.map((t) => t.category))];

// Matn stillari — shrift oilalari, tayyor ranglar, tekislash tanlovlari.
const FONT_FAMILIES = {
  handwriting: "'Caveat', cursive",
  serif: "'Fraunces', serif",
  sans: "'Inter', sans-serif",
};
const FONT_LIST = [
  { id: "handwriting", name: "Qo'lyozma" },
  { id: "serif", name: "Serif" },
  { id: "sans", name: "Sans" },
];
const TEXT_COLORS = ["#1E2621", "#B8863B", "#2F4C48", "#A8453A", "#F2EDE2", "#5C7A73"];
const ALIGN_LIST = [
  { id: "left", name: "Chap", icon: AlignLeft },
  { id: "center", name: "Markaz", icon: AlignCenter },
  { id: "right", name: "O'ng", icon: AlignRight },
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

function RailButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
        width: "100%", padding: "12px 4px", background: active ? "rgba(184,134,59,0.22)" : "transparent",
        border: "none", borderLeft: active ? `3px solid ${TOKENS.gold}` : "3px solid transparent",
        cursor: "pointer", color: active ? TOKENS.goldSoft : "rgba(242,237,226,0.68)", transition: "background 0.15s ease, color 0.15s ease",
      }}
      className="fm-rail-btn"
    >
      <Icon size={19} />
      <span style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1 }}>{label}</span>
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

// Stiker tanlash panelidagi kichik ko'rinish (namuna) — 20px shakl/lenta yoki ikonka.
function StickerPickerPreview({ stickerId, kind }) {
  const color = STICKER_DEFAULT_COLORS[stickerId] || TOKENS.teal;
  if (kind === "tape") {
    const striped = stickerId === "tape-stripe";
    return (
      <div style={{
        width: 26, height: 10, borderRadius: 1,
        background: striped
          ? `repeating-linear-gradient(45deg, ${color}, ${color} 4px, rgba(255,255,255,0.55) 4px, rgba(255,255,255,0.55) 8px)`
          : color,
        opacity: 0.85,
      }} />
    );
  }
  if (kind === "shape") {
    if (stickerId === "circle-shape") return <div style={{ width: 20, height: 20, borderRadius: "50%", background: color, opacity: 0.85 }} />;
    if (stickerId === "square-shape") return <div style={{ width: 20, height: 20, borderRadius: 4, background: color, opacity: 0.85 }} />;
    return <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: `18px solid ${color}`, opacity: 0.85 }} />;
  }
  const Icon = STICKER_ICONS[stickerId] || Leaf;
  return <Icon size={20} color={color} />;
}

function TemplateThumbnail({ template }) {
  const bg = BACKGROUNDS[template.backgroundId] || BACKGROUNDS.paper;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: `linear-gradient(180deg, ${bg.from}, ${bg.to})`, borderRadius: 4, overflow: "hidden" }}>
      {template.slots.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`,
            background: s.type === "photo" ? "rgba(255,255,255,0.55)" : "rgba(30,38,33,0.18)",
            border: s.type === "photo" ? "1px solid rgba(255,255,255,0.8)" : "none",
            borderRadius: 2,
          }}
        />
      ))}
      {template.stickers.map((st, i) => {
        if (st.kind === "icon") {
          const Icon = STICKER_ICONS[st.stickerId] || Leaf;
          return (
            <div key={i} style={{ position: "absolute", left: `${st.x}%`, top: `${st.y}%`, width: `${st.w}%`, height: `${st.h}%`, display: "flex" }}>
              <Icon size={9} color={st.color} style={{ width: "100%", height: "100%" }} />
            </div>
          );
        }
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: `${st.x}%`, top: `${st.y}%`, width: `${st.w}%`, height: `${st.h}%`,
              background: st.color, opacity: 0.85,
              borderRadius: st.kind === "tape" ? 1 : st.kind === "shape" ? 3 : 0,
            }}
          />
        );
      })}
    </div>
  );
}

function StickerSlot({ element, canEdit, style, onDragStart, isDragging }) {
  const stickerId = element.sticker_id || "leaf";
  const kind = stickerId.endsWith("-shape") ? "shape" : stickerId.startsWith("tape-") ? "tape" : "icon";
  const color = element.sticker_color || TOKENS.teal;
  const rot = seeded(element.id, 3) * 20 - 10; // -10..10deg, decorative

  let inner;
  if (kind === "tape") {
    const striped = stickerId === "tape-stripe";
    inner = (
      <div
        style={{
          width: "100%", height: "100%",
          background: striped
            ? `repeating-linear-gradient(45deg, ${color}, ${color} 8px, rgba(255,255,255,0.55) 8px, rgba(255,255,255,0.55) 16px)`
            : color,
          opacity: 0.82,
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          borderRadius: 1,
        }}
      />
    );
  } else if (kind === "shape") {
    if (stickerId === "circle-shape") {
      inner = <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: color, opacity: 0.85 }} />;
    } else if (stickerId === "square-shape") {
      inner = <div style={{ width: "100%", height: "100%", borderRadius: 4, background: color, opacity: 0.85 }} />;
    } else {
      // triangle-shape — CSS border-trick uchburchak
      inner = (
        <div
          style={{
            width: 0, height: 0,
            borderLeft: "50% solid transparent",
            borderRight: "50% solid transparent",
            borderBottom: "100% solid " + color,
            opacity: 0.85,
            aspectRatio: "1/1",
          }}
        />
      );
    }
  } else {
    const Icon = STICKER_ICONS[stickerId] || Leaf;
    inner = <Icon size="70%" color={color} strokeWidth={1.4} fill={color} fillOpacity={0.3} />;
  }

  return (
    <div
      style={{ ...style, position: "absolute", opacity: isDragging ? 0.5 : 1, transition: "opacity 0.2s", cursor: canEdit ? "grab" : "default" }}
      draggable={canEdit}
      onDragStart={onDragStart}
    >
      <div style={{ width: "100%", height: "100%", transform: `rotate(${rot}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {inner}
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
            fontFamily: FONT_FAMILIES[element.text_font || "handwriting"],
            fontSize: element.text_size || 22,
            lineHeight: 1.35,
            color: element.text_color || TOKENS.ink,
            textAlign: element.text_align || "left",
            fontWeight: (element.text_font || "handwriting") === "handwriting" ? 600 : 500,
          }}
        />
      </form>
      {state?.error && <div style={{ fontSize: 9.5, color: TOKENS.danger }}>{state.error}</div>}
    </div>
  );
}

/* ---------------- Selected-element style panels ---------------- */

const PANEL_LABEL_STYLE = { fontSize: 10.5, fontWeight: 600, color: TOKENS.ink60, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 };

function StylePanelShell({ title, onClose, children }) {
  return (
    <div style={{ width: 208, flexShrink: 0, background: TOKENS.card, borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}`, padding: 14, alignSelf: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.ink }}>{title}</span>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 2 }}>
          <X size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function TextStylePanel({ element, familySlug, updateElementTextStyleAction, onClose }) {
  const [, formAction] = useActionState(updateElementTextStyleAction, undefined);
  const formRef = useRef(null);
  const [size, setSize] = useState(element.text_size || 22);

  // Boshqa elementga o'tilganda slider'ni shu elementning saqlangan qiymatiga tenglashtiramiz.
  useEffect(() => { setSize(element.text_size || 22); }, [element.id]);

  const submit = (overrides) => {
    const f = formRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.elementId.value = element.id;
    f.elements.textSize.value = String(overrides.size ?? size);
    f.elements.textColor.value = overrides.color ?? (element.text_color || TOKENS.ink);
    f.elements.textAlign.value = overrides.align ?? (element.text_align || "left");
    f.elements.textFont.value = overrides.font ?? (element.text_font || "handwriting");
    f.requestSubmit();
  };

  return (
    <StylePanelShell title="Matn uslubi" onClose={onClose}>
      <form ref={formRef} action={formAction} style={{ display: "none" }}>
        <input type="hidden" name="familySlug" />
        <input type="hidden" name="elementId" />
        <input type="hidden" name="textSize" />
        <input type="hidden" name="textColor" />
        <input type="hidden" name="textAlign" />
        <input type="hidden" name="textFont" />
      </form>

      <div style={PANEL_LABEL_STYLE}>Shrift</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {FONT_LIST.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => submit({ font: f.id })}
            title={f.name}
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 6, cursor: "pointer",
              border: `1px solid ${(element.text_font || "handwriting") === f.id ? TOKENS.gold : TOKENS.parchmentDeep}`,
              background: (element.text_font || "handwriting") === f.id ? TOKENS.parchmentDeep : "transparent",
              fontFamily: FONT_FAMILIES[f.id], fontSize: 15, color: TOKENS.ink,
            }}
          >
            Aa
          </button>
        ))}
      </div>

      <div style={PANEL_LABEL_STYLE}>O'lcham ({size}px)</div>
      <input
        type="range" min={12} max={48} step={1}
        value={size}
        onChange={(e) => setSize(Number(e.target.value))}
        onPointerUp={() => submit({ size })}
        style={{ width: "100%", marginBottom: 14 }}
      />

      <div style={PANEL_LABEL_STYLE}>Tekislash</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {ALIGN_LIST.map((a) => {
          const AIcon = a.icon;
          const active = (element.text_align || "left") === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => submit({ align: a.id })}
              title={a.name}
              style={{
                flex: 1, padding: "7px 4px", borderRadius: 6, cursor: "pointer", display: "flex", justifyContent: "center",
                border: `1px solid ${active ? TOKENS.gold : TOKENS.parchmentDeep}`,
                background: active ? TOKENS.parchmentDeep : "transparent",
              }}
            >
              <AIcon size={14} color={TOKENS.ink} />
            </button>
          );
        })}
      </div>

      <div style={PANEL_LABEL_STYLE}>Rang</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => submit({ color: c })}
            title={c}
            style={{
              width: 22, height: 22, borderRadius: "50%", cursor: "pointer", padding: 0,
              background: c, border: (element.text_color || TOKENS.ink).toLowerCase() === c.toLowerCase() ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`,
            }}
          />
        ))}
      </div>
    </StylePanelShell>
  );
}

function StickerStylePanel({ element, familySlug, updateElementStickerColorAction, onClose }) {
  const [, formAction] = useActionState(updateElementStickerColorAction, undefined);
  const formRef = useRef(null);

  const submit = (color) => {
    const f = formRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.elementId.value = element.id;
    f.elements.color.value = color;
    f.requestSubmit();
  };

  const stickerMeta = STICKER_LIST.find((s) => s.id === element.sticker_id);

  return (
    <StylePanelShell title={stickerMeta?.name || "Stiker"} onClose={onClose}>
      <form ref={formRef} action={formAction} style={{ display: "none" }}>
        <input type="hidden" name="familySlug" />
        <input type="hidden" name="elementId" />
        <input type="hidden" name="color" />
      </form>
      <div style={PANEL_LABEL_STYLE}>Rang</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {STICKER_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => submit(c)}
            title={c}
            style={{
              width: 24, height: 24, borderRadius: "50%", cursor: "pointer", padding: 0,
              background: c, border: (element.sticker_color || "").toLowerCase() === c.toLowerCase() ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`,
            }}
          />
        ))}
      </div>
    </StylePanelShell>
  );
}

function ElementFloatingToolbar({ onDuplicate, onLayerUp, onLayerDown, onDelete, busy }) {
  return (
    <div
      className="fm-element-toolbar"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", left: "50%", bottom: "calc(100% + 10px)", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 2, background: TOKENS.ink, borderRadius: 9,
        padding: 4, boxShadow: "0 6px 16px rgba(30,26,15,0.3)", zIndex: 70, whiteSpace: "nowrap",
      }}
    >
      <button type="button" className="fm-toolbar-btn" title="Nusxalash" disabled={busy} onClick={onDuplicate}>
        <Copy size={14} />
      </button>
      <button type="button" className="fm-toolbar-btn" title="Tepaga chiqarish" onClick={onLayerUp}>
        <ChevronUp size={16} />
      </button>
      <button type="button" className="fm-toolbar-btn" title="Pastga tushirish" onClick={onLayerDown}>
        <ChevronDown size={16} />
      </button>
      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.18)", margin: "0 2px" }} />
      <button type="button" className="fm-toolbar-btn danger" title="O'chirish" onClick={onDelete}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function PageCanvas({ page, layout, familySlug, albumId, canEdit, saveElementPhotoUrlAction, updateElementTextAction, reorderElementsAction, deleteElementAction, updateElementPositionAction, updateElementCaptionAction, updateElementPlaceAction, changeZIndexAction, duplicateElementAction, moveElementUpAction, moveElementDownAction, updateElementFrameAction, updateElementTextStyleAction, updateElementStickerColorAction, backgroundId }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [reorderState, reorderFormAction, reorderPending] = useActionState(reorderElementsAction, undefined);
  const [posState, posFormAction, posPending] = useActionState(updateElementPositionAction, undefined);
  const [delState, delFormAction, delPending] = useActionState(deleteElementAction, undefined);
  const [dupState, dupFormAction, dupPending] = useActionState(duplicateElementAction, undefined);
  const [zState, zFormAction] = useActionState(changeZIndexAction, undefined);

  const reorderRef = useRef(null);
  const posRef = useRef(null);
  const delRef = useRef(null);
  const dupRef = useRef(null);
  const zRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const canvasRef = useRef(null);
  const dragState = useRef(null);
  const [, forceRender] = useState(0);

  const submitDuplicate = (elId) => {
    const f = dupRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.albumId.value = albumId;
    f.elements.elementId.value = elId;
    setTimeout(() => f.requestSubmit(), 0);
  };

  const submitZIndex = (elId, direction) => {
    const f = zRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.elementId.value = elId;
    f.elements.direction.value = direction;
    setTimeout(() => f.requestSubmit(), 0);
  };

  const submitDelete = (elId) => {
    const f = delRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.albumId.value = albumId;
    f.elements.elementId.value = elId;
    setTimeout(() => f.requestSubmit(), 0);
    setSelectedId(null);
  };

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

  const MIN_SIZE = 4; // % — elementning eng kichik ruxsat etilgan kengligi/balandligi

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
    const box = getElBox(el, page.elements.indexOf(el));
    if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
      dragState.current = {
        id: el.id, mode: "move",
        startX: box.x, startY: box.y, startW: box.w, startH: box.h, startR: box.r,
        offsetX: px - box.x, offsetY: py - box.y,
        lastX: box.x, lastY: box.y, lastW: box.w, lastH: box.h, lastR: box.r,
        moved: false,
      };
      canvas.setPointerCapture?.(e.pointerId);
    }
  };

  // Resize (burchak tutqichi) yoki rotate (burish tutqichi) tortishni boshlaydi.
  const onPointerDownHandle = (e, el, mode) => {
    if (!canEdit) return;
    e.stopPropagation();
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = getElBox(el, page.elements.indexOf(el));
    dragState.current = {
      id: el.id, mode,
      startX: box.x, startY: box.y, startW: box.w, startH: box.h, startR: box.r,
      offsetX: 0, offsetY: 0,
      lastX: box.x, lastY: box.y, lastW: box.w, lastH: box.h, lastR: box.r,
      moved: false,
    };
    canvas.setPointerCapture?.(e.pointerId);
  };

  const onPointerMoveCanvas = (e) => {
    const ds = dragState.current;
    if (!ds) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width * 100;
    const py = (e.clientY - rect.top) / rect.height * 100;

    if (ds.mode === "move") {
      ds.lastX = Math.max(0, Math.min(100 - ds.startW, px - ds.offsetX));
      ds.lastY = Math.max(0, Math.min(100 - ds.startH, py - ds.offsetY));
      ds.moved = true;
    } else if (ds.mode.startsWith("resize-")) {
      const corner = ds.mode.slice("resize-".length); // nw | ne | sw | se
      const x2 = ds.startX + ds.startW;
      const y2 = ds.startY + ds.startH;
      let newX = ds.startX, newY = ds.startY, newW = ds.startW, newH = ds.startH;
      if (corner === "se") {
        newW = Math.max(MIN_SIZE, px - ds.startX);
        newH = Math.max(MIN_SIZE, py - ds.startY);
      } else if (corner === "nw") {
        newX = Math.min(px, x2 - MIN_SIZE);
        newY = Math.min(py, y2 - MIN_SIZE);
        newW = x2 - newX;
        newH = y2 - newY;
      } else if (corner === "ne") {
        newY = Math.min(py, y2 - MIN_SIZE);
        newW = Math.max(MIN_SIZE, px - ds.startX);
        newH = y2 - newY;
      } else if (corner === "sw") {
        newX = Math.min(px, x2 - MIN_SIZE);
        newW = x2 - newX;
        newH = Math.max(MIN_SIZE, py - ds.startY);
      }
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      newW = Math.min(newW, 100 - newX);
      newH = Math.min(newH, 100 - newY);
      ds.lastX = newX; ds.lastY = newY; ds.lastW = newW; ds.lastH = newH;
      ds.moved = true;
    } else if (ds.mode === "rotate") {
      // Aylanish burchagini piksellarda hisoblaymiz (canvas kvadrat emas, 4:3),
      // aks holda % koordinatalar bo'yicha burchak noto'g'ri chiqadi.
      const cx = rect.left + (ds.startX + ds.startW / 2) / 100 * rect.width;
      const cy = rect.top + (ds.startY + ds.startH / 2) / 100 * rect.height;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
      ds.lastR = Math.round(angle);
      ds.moved = true;
    }
    forceRender(v => v + 1);
  };

  const onPointerUpCanvas = () => {
    const ds = dragState.current;
    if (!ds) return;
    dragState.current = null;
    if (!ds.moved) return;
    if (ds.mode === "move") {
      submitPosition(ds.id, ds.lastX, ds.lastY, ds.startW, ds.startH, undefined, undefined);
    } else if (ds.mode.startsWith("resize-")) {
      submitPosition(ds.id, ds.lastX, ds.lastY, ds.lastW, ds.lastH, undefined, undefined);
    } else if (ds.mode === "rotate") {
      submitPosition(ds.id, ds.startX, ds.startY, ds.startW, ds.startH, undefined, ds.lastR);
    }
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

  const saving = posPending || delPending;

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div
        ref={canvasRef}
        onPointerMove={onPointerMoveCanvas}
        onPointerUp={onPointerUpCanvas}
        onPointerCancel={onPointerUpCanvas}
        onClick={() => setSelectedId(null)}
        style={{
          flex: 1, minWidth: 0, aspectRatio: "4/3", borderRadius: 3, position: "relative",
          background: `${PAPER_TEXTURE_URL}, radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.5), transparent 60%), linear-gradient(180deg, ${(BACKGROUNDS[backgroundId] || BACKGROUNDS.paper).from}, ${(BACKGROUNDS[backgroundId] || BACKGROUNDS.paper).to})`,
          backgroundSize: "220px 220px, cover, cover",
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
        <form ref={delRef} action={delFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="albumId" />
        </form>
        <form ref={dupRef} action={dupFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="albumId" />
        </form>
        <form ref={zRef} action={zFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="direction" />
        </form>
        {elements.map((el, i) => {
          const live = dragState.current?.id === el.id;
          const box = getElBox(el, i);
          const x = live ? dragState.current.lastX : box.x;
          const y = live ? dragState.current.lastY : box.y;
          const isSelected = selectedId === el.id;
          const isHovered = hoveredId === el.id && !isSelected && !dragState.current;
          const style = {
            left: `${x}%`,
            top: `${y}%`,
            width: `${box.w}%`,
            height: `${box.h}%`,
            transform: `rotate(${box.r}deg)`,
            zIndex: isSelected ? 500 : box.z,
            position: "absolute",
            border: isSelected ? `2px solid ${TOKENS.gold}` : isHovered ? `2px solid ${TOKENS.gold}88` : "1px solid transparent",
            borderRadius: 4,
            boxShadow: isSelected ? `0 0 0 3px ${TOKENS.gold}33` : "none",
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
              onMouseEnter={() => setHoveredId(el.id)}
              onMouseLeave={() => setHoveredId((h) => (h === el.id ? null : h))}
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
              {canEdit && selectedId === el.id && (
                <>
                  {["nw", "ne", "sw", "se"].map((corner) => (
                    <div
                      key={corner}
                      onPointerDown={(e) => onPointerDownHandle(e, el, `resize-${corner}`)}
                      className="fm-resize-handle"
                      style={{
                        position: "absolute",
                        width: 16, height: 16, borderRadius: "50%",
                        background: "#fff", border: `2.5px solid ${TOKENS.gold}`,
                        boxShadow: "0 2px 5px rgba(30,26,15,0.35)",
                        top: corner[0] === "n" ? -8 : "auto",
                        bottom: corner[0] === "s" ? -8 : "auto",
                        left: corner[1] === "w" ? -8 : "auto",
                        right: corner[1] === "e" ? -8 : "auto",
                        cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize",
                        touchAction: "none",
                        zIndex: 60,
                        transition: "transform 0.1s",
                      }}
                    />
                  ))}
                  <div
                    onPointerDown={(e) => onPointerDownHandle(e, el, "rotate")}
                    title="Burish"
                    className="fm-resize-handle"
                    style={{
                      position: "absolute", left: "50%", top: -34, width: 18, height: 18, borderRadius: "50%",
                      background: TOKENS.teal, border: "2.5px solid #fff", boxShadow: "0 2px 5px rgba(30,26,15,0.35)",
                      transform: "translateX(-50%)", cursor: "grab", touchAction: "none", zIndex: 60,
                    }}
                  />
                  <div
                    aria-hidden
                    style={{ position: "absolute", left: "50%", top: -20, width: 1.5, height: 20, background: `${TOKENS.teal}99`, transform: "translateX(-50%)", pointerEvents: "none" }}
                  />
                  <ElementFloatingToolbar
                    onDuplicate={() => submitDuplicate(el.id)}
                    onLayerUp={() => submitZIndex(el.id, "up")}
                    onLayerDown={() => submitZIndex(el.id, "down")}
                    onDelete={() => {
                      if (!confirm("Bu elementni o'chirishni xohlaysizmi?")) return;
                      submitDelete(el.id);
                    }}
                    busy={dupPending}
                  />
                </>
              )}
            </div>
          );
        })}
        {[reorderState?.error, posState?.error, delState?.error].filter(Boolean).length > 0 && (
          <div style={{ position: "absolute", top: 8, left: 8, right: 8, background: "#fff1f0", color: TOKENS.danger, border: `1px solid ${TOKENS.danger}`, borderRadius: 6, padding: "6px 10px", fontSize: 11.5, zIndex: 50 }}>
            {[reorderState?.error, posState?.error, delState?.error].filter(Boolean)[0]}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, color: TOKENS.ink40, display: "flex", alignItems: "center", gap: 10 }}>
          {page.date_label && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} /> {page.date_label}</span>}
          {page.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPinned size={10} /> {page.location}</span>}
        </div>
      </div>

      {canEdit && selected && selected.type === "text" && (
        <TextStylePanel
          element={selected}
          familySlug={familySlug}
          updateElementTextStyleAction={updateElementTextStyleAction}
          onClose={() => setSelectedId(null)}
        />
      )}
      {canEdit && selected && selected.type === "sticker" && (
        <StickerStylePanel
          element={selected}
          familySlug={familySlug}
          updateElementStickerColorAction={updateElementStickerColorAction}
          onClose={() => setSelectedId(null)}
        />
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
  applyPageTemplateAction,
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
  updateElementTextStyleAction,
  updateElementStickerColorAction,
  changePageBackgroundAction,
  addStickerElementAction,
  addTextElementAction,
  addPhotoElementAction,
  deleteAlbumAction,
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [activeSide, setActiveSide] = useState("left"); // "left" | "right" — Layout/Stiker/Fon shu tomonga ta'sir qiladi
  const [activePanel, setActivePanel] = useState(null); // null | "template" | "layout" | "sticker" | "bg"
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(false);

  const pages = album.pages;
  const currentPage = pages[Math.min(pageIndex, pages.length - 1)];
  const currentLayout = currentPage ? LAYOUTS.find((l) => l.id === currentPage.layout_id) || LAYOUTS[0] : LAYOUTS[0];

  const [addPageState, addPageFormAction, addPagePending] = useActionState(addAlbumPageAction, undefined);
  const [layoutState, layoutFormAction] = useActionState(changePageLayoutAction, undefined);
  const [templateState, templateFormAction, templatePending] = useActionState(applyPageTemplateAction, undefined);
  const [deletePageState, deletePageFormAction] = useActionState(deleteAlbumPageAction, undefined);
  const [deleteAlbumState, deleteAlbumFormAction, deleteAlbumPending] = useActionState(deleteAlbumAction, undefined);
  const [bgState, bgFormAction] = useActionState(changePageBackgroundAction, undefined);
  const [stickerState, stickerFormAction, stickerPending] = useActionState(addStickerElementAction, undefined);
  const [addTextState, addTextFormAction, addTextPending] = useActionState(addTextElementAction, undefined);
  const [addPhotoState, addPhotoFormAction, addPhotoPending] = useActionState(addPhotoElementAction, undefined);
  const addTextRef = useRef(null);
  const addPhotoRef = useRef(null);

  return (
    <div style={{ padding: "22px clamp(16px, 4vw, 48px) 60px", maxWidth: 1680, margin: "0 auto" }}>
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
          const targetPage = activeSide === "right" && rightPage ? rightPage : currentPage;
          const targetLayout = activeSide === "right" && rightLayout ? rightLayout : currentLayout;

          return (
            <div style={{ background: `linear-gradient(180deg, ${TOKENS.bookCoverSoft}, ${TOKENS.bookCover})`, borderRadius: 18, padding: "18px 18px 20px" }}>
              {/* Book toolbar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button onClick={() => { setPageIndex(Math.max(0, pageIndex - 2)); setActiveSide("left"); }} disabled={pageIndex === 0} style={{ background: "none", border: "none", cursor: pageIndex === 0 ? "default" : "pointer", color: "#F2EDE2", opacity: pageIndex === 0 ? 0.3 : 0.85 }}><ChevronLeft size={20} /></button>
                  <span style={{ fontSize: 12.5, color: "rgba(242,237,226,0.75)", fontWeight: 500 }}>Sahifa {spreadNum} / {totalSpreads}</span>
                  <button onClick={() => { setPageIndex(Math.min(pages.length - (pages.length % 2 === 0 ? 2 : 1), pageIndex + 2)); setActiveSide("left"); }} disabled={pageIndex + 2 >= pages.length} style={{ background: "none", border: "none", cursor: pageIndex + 2 >= pages.length ? "default" : "pointer", color: "#F2EDE2", opacity: pageIndex + 2 >= pages.length ? 0.3 : 0.85 }}><ChevronRight size={20} /></button>
                  {canEdit && rightPage && (
                    <div style={{ display: "flex", gap: 4, marginLeft: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 3 }}>
                      <button onClick={() => setActiveSide("left")} style={{ fontSize: 10.5, fontWeight: 600, padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", background: activeSide === "left" ? TOKENS.gold : "transparent", color: activeSide === "left" ? "#fff" : "rgba(242,237,226,0.6)" }}>Chap</button>
                      <button onClick={() => setActiveSide("right")} style={{ fontSize: 10.5, fontWeight: 600, padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", background: activeSide === "right" ? TOKENS.gold : "transparent", color: activeSide === "right" ? "#fff" : "rgba(242,237,226,0.6)" }}>O'ng</button>
                    </div>
                  )}
                </div>
              </div>
              <form ref={addTextRef} action={addTextFormAction} style={{ display: "none" }}>
                <input type="hidden" name="familySlug" />
                <input type="hidden" name="albumId" />
                <input type="hidden" name="pageId" />
              </form>
              <form ref={addPhotoRef} action={addPhotoFormAction} style={{ display: "none" }}>
                <input type="hidden" name="familySlug" />
                <input type="hidden" name="albumId" />
                <input type="hidden" name="pageId" />
              </form>
              {addTextState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{addTextState.error}</div>}
              {addPhotoState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{addPhotoState.error}</div>}

              <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                {canEdit && (
                  <div style={{ display: "flex", flexShrink: 0, width: 58, flexDirection: "column", background: "rgba(0,0,0,0.16)", borderRadius: 10, overflow: "hidden", paddingBottom: 4 }}>
                    <RailButton icon={Sparkles} label="Shablon" active={activePanel === "template"} onClick={() => setActivePanel((p) => (p === "template" ? null : "template"))} />
                    <RailButton icon={LayoutGrid} label="Layout" active={activePanel === "layout"} onClick={() => setActivePanel((p) => (p === "layout" ? null : "layout"))} />
                    <RailButton icon={StickerIcon} label="Stiker" active={activePanel === "sticker"} onClick={() => setActivePanel((p) => (p === "sticker" ? null : "sticker"))} />
                    <RailButton icon={Palette} label="Fon" active={activePanel === "bg"} onClick={() => setActivePanel((p) => (p === "bg" ? null : "bg"))} />
                    <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 10px" }} />
                    <RailButton
                      icon={Type}
                      label="Matn"
                      onClick={() => {
                        const f = addTextRef.current; if (!f) return;
                        f.elements.familySlug.value = familySlug;
                        f.elements.albumId.value = album.id;
                        f.elements.pageId.value = targetPage.id;
                        setTimeout(() => f.requestSubmit(), 0);
                      }}
                    />
                    <RailButton
                      icon={ImagePlus}
                      label="Rasm"
                      onClick={() => {
                        const f = addPhotoRef.current; if (!f) return;
                        f.elements.familySlug.value = familySlug;
                        f.elements.albumId.value = album.id;
                        f.elements.pageId.value = targetPage.id;
                        setTimeout(() => f.requestSubmit(), 0);
                      }}
                    />
                  </div>
                )}

                {canEdit && activePanel && (
                  <div className="fm-flyout-panel" style={{ width: 250, flexShrink: 0, background: TOKENS.card, borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}`, padding: 12, maxHeight: 560, overflowY: "auto" }}>
                    {activePanel === "template" && (
                      <div>
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>
                          Shablon {activeSide === "right" ? "o'ng" : "chap"} sahifaga qo'llanadi — mavjud elementlar shablon bilan almashtiriladi.
                        </div>
                        {TEMPLATE_CATEGORIES.map((cat) => (
                          <div key={cat} style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: TOKENS.ink60, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>{cat}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                              {TEMPLATE_LIST.filter((t) => t.category === cat).map((t) => (
                                <form key={t.id} action={templateFormAction} onSubmit={() => setActivePanel(null)}>
                                  <input type="hidden" name="familySlug" value={familySlug} />
                                  <input type="hidden" name="albumId" value={album.id} />
                                  <input type="hidden" name="pageId" value={targetPage.id} />
                                  <input type="hidden" name="templateId" value={t.id} />
                                  <button type="submit" disabled={templatePending} style={{ width: "100%", cursor: templatePending ? "default" : "pointer", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: 6, background: "#fff" }}>
                                    <TemplateThumbnail template={t} />
                                    <div style={{ fontSize: 9.5, color: TOKENS.ink60, textAlign: "center", marginTop: 6 }}>{t.name}</div>
                                  </button>
                                </form>
                              ))}
                            </div>
                          </div>
                        ))}
                        {templateState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{templateState.error}</div>}
                      </div>
                    )}

                    {activePanel === "layout" && (
                      <div>
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>{activeSide === "right" ? "O'ng" : "Chap"} sahifa uchun joylashuv.</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                          {LAYOUTS.map((l) => (
                            <form key={l.id} action={layoutFormAction} onSubmit={() => setActivePanel(null)}>
                              <input type="hidden" name="familySlug" value={familySlug} />
                              <input type="hidden" name="albumId" value={album.id} />
                              <input type="hidden" name="pageId" value={targetPage.id} />
                              <input type="hidden" name="layoutId" value={l.id} />
                              <button
                                type="submit"
                                style={{ width: "100%", cursor: "pointer", border: targetLayout.id === l.id ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: 8, background: "#fff" }}
                              >
                                <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: TOKENS.parchment, borderRadius: 3, marginBottom: 6 }}>
                                  {l.slots.map((s, i) => <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`, background: s.type === "photo" ? TOKENS.goldSoft : TOKENS.tealSoft, borderRadius: 2, opacity: 0.7 }} />)}
                                </div>
                                <div style={{ fontSize: 9.5, color: TOKENS.ink60, textAlign: "center" }}>{l.name}</div>
                              </button>
                            </form>
                          ))}
                        </div>
                        {layoutState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginTop: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{layoutState.error}</div>}
                      </div>
                    )}

                    {activePanel === "sticker" && (
                      <div>
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>{activeSide === "right" ? "O'ng" : "Chap"} sahifaga qo'shiladi, keyin sudrab joylashtiring.</div>
                        {STICKER_GROUPS.map((group) => (
                          <div key={group.label} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: TOKENS.ink60, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>{group.label}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                              {group.items.map((s) => (
                                <form key={s.id} action={stickerFormAction} onSubmit={() => setActivePanel(null)}>
                                  <input type="hidden" name="familySlug" value={familySlug} />
                                  <input type="hidden" name="albumId" value={album.id} />
                                  <input type="hidden" name="pageId" value={targetPage.id} />
                                  <input type="hidden" name="stickerId" value={s.id} />
                                  <button type="submit" disabled={stickerPending} title={s.name} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "8px 4px", cursor: stickerPending ? "default" : "pointer" }}>
                                    <StickerPickerPreview stickerId={s.id} kind={s.kind} />
                                    <span style={{ fontSize: 9, color: TOKENS.ink60, textAlign: "center", lineHeight: 1.2 }}>{s.name}</span>
                                  </button>
                                </form>
                              ))}
                            </div>
                          </div>
                        ))}
                        {stickerState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{stickerState.error}</div>}
                      </div>
                    )}

                    {activePanel === "bg" && (
                      <div>
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>{activeSide === "right" ? "O'ng" : "Chap"} sahifaning foniga qo'llanadi.</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                          {BACKGROUND_LIST.map((b) => (
                            <form key={b.id} action={bgFormAction} onSubmit={() => setActivePanel(null)}>
                              <input type="hidden" name="familySlug" value={familySlug} />
                              <input type="hidden" name="albumId" value={album.id} />
                              <input type="hidden" name="pageId" value={targetPage.id} />
                              <input type="hidden" name="backgroundId" value={b.id} />
                              <button type="submit" title={b.name} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "transparent", border: (targetPage.background_id || "paper") === b.id ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: 8, cursor: "pointer" }}>
                                <div style={{ width: 34, height: 34, borderRadius: 6, background: `linear-gradient(180deg, ${b.from}, ${b.to})` }} />
                                <span style={{ fontSize: 9.5, color: TOKENS.ink60 }}>{b.name}</span>
                              </button>
                            </form>
                          ))}
                        </div>
                        {bgState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginTop: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{bgState.error}</div>}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
              {/* Two-page spread */}
              <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.45)", position: "relative" }}>
                <div
                  onMouseDownCapture={() => canEdit && setActiveSide("left")}
                  style={{
                    flex: 1, position: "relative",
                    boxShadow: canEdit && rightPage && activeSide === "left" ? `inset 0 0 0 3px ${TOKENS.gold}` : "none",
                    zIndex: canEdit && rightPage && activeSide === "left" ? 2 : 1,
                  }}
                >
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
                    updateElementTextStyleAction={updateElementTextStyleAction}
                    updateElementStickerColorAction={updateElementStickerColorAction}
                    backgroundId={currentPage.background_id || "paper"}
                  />
                </div>
                {/* Spine shadow between pages */}
                <div style={{ width: 22, marginLeft: -11, marginRight: -11, zIndex: 5, background: "linear-gradient(90deg, transparent, rgba(30,26,15,0.22) 45%, rgba(30,26,15,0.22) 55%, transparent)", pointerEvents: "none" }} />
                <div
                  onMouseDownCapture={() => canEdit && rightPage && setActiveSide("right")}
                  style={{
                    flex: 1, position: "relative",
                    boxShadow: canEdit && rightPage && activeSide === "right" ? `inset 0 0 0 3px ${TOKENS.gold}` : "none",
                    zIndex: canEdit && rightPage && activeSide === "right" ? 2 : 1,
                  }}
                >
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
                      updateElementTextStyleAction={updateElementTextStyleAction}
                      updateElementStickerColorAction={updateElementStickerColorAction}
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
                </div>
              </div>

              {canEdit && (
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <form action={deletePageFormAction} style={{ display: "inline" }}>
                    <input type="hidden" name="familySlug" value={familySlug} />
                    <input type="hidden" name="albumId" value={album.id} />
                    <input type="hidden" name="pageId" value={targetPage.id} />
                    <button type="submit" disabled={pages.length <= 1} style={{ fontSize: 11.5, color: pages.length <= 1 ? "rgba(242,237,226,0.3)" : "#E7A79B", background: "none", border: "none", cursor: pages.length <= 1 ? "default" : "pointer" }}>
                      {activeSide === "right" ? "O'ng" : "Chap"} sahifani o'chirish
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
                      onClick={() => { setPageIndex(i % 2 === 0 ? i : i - 1); setActiveSide(i % 2 === 0 ? "left" : "right"); }}
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
  applyPageTemplateAction,
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
  updateElementTextStyleAction,
  updateElementStickerColorAction,
  changePageBackgroundAction,
  addStickerElementAction,
  addTextElementAction,
  addPhotoElementAction,
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
          applyPageTemplateAction={applyPageTemplateAction}
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
          updateElementTextStyleAction={updateElementTextStyleAction}
          updateElementStickerColorAction={updateElementStickerColorAction}
          changePageBackgroundAction={changePageBackgroundAction}
          addStickerElementAction={addStickerElementAction}
          addTextElementAction={addTextElementAction}
          addPhotoElementAction={addPhotoElementAction}
          deleteAlbumAction={deleteAlbumAction}
        />      ) : (
        <AlbumGrid albums={albums} onOpen={(a) => setOpenAlbumId(a.id)} canEdit={canEdit} createAlbumAction={createAlbumAction} familySlug={familySlug} />
      )}
    </div>
  );
}
