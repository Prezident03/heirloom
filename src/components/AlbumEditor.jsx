"use client";

import React, { useState, useRef, useEffect, useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  BookImage, Plus, X, ImagePlus, Images, Shapes, LayoutGrid,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Copy, Trash2, Calendar, MapPinned,
  Leaf, Flower2, Heart, Star, Sun, Palette,
  Sticker as StickerIcon, Frame,
  AlignLeft, AlignCenter, AlignRight,
  Sparkles, Moon, Cloud, Gift, Cake, PartyPopper,
  Camera, Music, Crown, Umbrella,
  Snowflake, Smile, Feather, Type, Download,
  Loader2, Undo2, Redo2, Share2, Link2, Group, Ungroup, Check, FlipHorizontal2, FlipVertical2,
  Maximize2, Minimize2, Layers,
} from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { AlbumCard } from "./shared";
import { updatePageBackgroundImageAction, addPhotoWithUrlAction, renameAlbumAction } from "@/lib/actions";

const LAYOUTS = [
  { id: "l1", name: "Bitta katta", slots: [{ type: "photo", x: 8, y: 8, w: 84, h: 60 }, { type: "text", x: 8, y: 72, w: 84, h: 20 }] },
  { id: "l2", name: "Ikkita yonma-yon", slots: [{ type: "photo", x: 6, y: 8, w: 41, h: 70 }, { type: "photo", x: 53, y: 8, w: 41, h: 70 }, { type: "text", x: 6, y: 82, w: 88, h: 12 }] },
  { id: "l3", name: "Katta + ikkita kichik", slots: [{ type: "photo", x: 6, y: 6, w: 60, h: 50 }, { type: "photo", x: 68, y: 6, w: 26, h: 24 }, { type: "photo", x: 68, y: 32, w: 26, h: 24 }, { type: "text", x: 6, y: 60, w: 88, h: 32 }] },
  { id: "l4", name: "Uchtasi qatorda", slots: [{ type: "photo", x: 5, y: 10, w: 28, h: 55 }, { type: "photo", x: 36, y: 10, w: 28, h: 55 }, { type: "photo", x: 67, y: 10, w: 28, h: 55 }, { type: "text", x: 5, y: 70, w: 90, h: 22 }] },
];

const BACKGROUNDS = {
  paper: { name: "Qog'oz", from: "#F4EDDD", to: "#ECE2C8" },
  sage: { name: "Sage", from: "#E7EDE3", to: "#D3DECB" },
  slate: { name: "Slate", from: "#E4E7E6", to: "#CBD2D0" },
  blush: { name: "Blush", from: "#F3E4DD", to: "#E6C9BC" },
  midnight: { name: "Midnight", from: "#2A3630", to: "#1B231F" },
};
const BACKGROUND_LIST = Object.entries(BACKGROUNDS).map(([id, v]) => ({ id, ...v }));

const PAPER_TEXTURE_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

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

function seeded(id, salt = 0) {
  const str = String(id || "x") + "-" + salt;
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000;
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
        width: "100%", padding: "12px 4px", background: active ? "rgba(184,134,59,0.16)" : "transparent",
        border: "none", borderLeft: active ? `3px solid ${TOKENS.gold}` : "3px solid transparent",
        cursor: "pointer", color: active ? TOKENS.gold : TOKENS.ink60, transition: "background 0.15s ease, color 0.15s ease",
      }}
      className="fm-rail-btn"
    >
      <Icon size={19} />
      <span style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1 }}>{label}</span>
    </button>
  );
}

// ============================================================
// 🆕 Chap panel — Photos
// ============================================================

function PhotosPanel({ familySlug, photos, uploadedPhotos, onUploaded, onDragStart, onAddPhoto }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 15 * 1024 * 1024) continue;
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
          clientPayload: JSON.stringify({ familySlug }),
        });
        uploaded.push({ id: blob.url, url: blob.url });
      }
      onUploaded?.([...uploaded, ...(uploadedPhotos || [])]);
    } catch (err) {
      console.error("Rasm yuklashda xato:", err);
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  };

  const allPhotos = [...(uploadedPhotos || []), ...(photos || [])];

  return (
    <div style={{ padding: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink60 }}>Rasmlar</span>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: TOKENS.gold }}
        >
          {uploading ? "⏳" : "+ Yuklash"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} style={{ display: "none" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {allPhotos.map((photo, i) => (
          <div
            key={photo.id || photo.url || i}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", JSON.stringify({ type: "photo", url: photo.url, id: photo.id || photo.url }));
              onDragStart?.(photo);
            }}
            style={{
              aspectRatio: "1",
              borderRadius: 4,
              background: `url(${photo.url}) center/cover`,
              cursor: "grab",
              border: `1px solid ${TOKENS.parchmentDeep}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 🆕 Chap panel — Elements
// ============================================================

const DECORATIVE_ELEMENTS = [
  { id: "flower", icon: Flower2, label: "Gul", defaultColor: "#E6C9BC" },
  { id: "tape", icon: Frame, label: "Lenta", defaultColor: "#D9BC85" },
  { id: "heart", icon: Heart, label: "Yurak", defaultColor: "#A8453A" },
  { id: "star", icon: Star, label: "Yulduz", defaultColor: "#B8863B" },
  { id: "leaf", icon: Leaf, label: "Barg", defaultColor: "#2F4C48" },
  { id: "circle", icon: () => <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#D9BC85" }} />, label: "Doira" },
  { id: "square", icon: () => <div style={{ width: 16, height: 16, borderRadius: 2, background: "#5C7A73" }} />, label: "Kvadrat" },
  { id: "triangle", icon: () => <div style={{ width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "16px solid #A8453A" }} />, label: "Uchburchak" },
];

const DECORATIVE_TO_STICKER_ID = {
  flower: "flower",
  tape: "tape-gold",
  heart: "heart",
  star: "star",
  leaf: "leaf",
  circle: "circle-shape",
  square: "square-shape",
  triangle: "triangle-shape",
};

function ElementsPanel({ onAddElement }) {
  return (
    <div style={{ padding: "8px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink60, marginBottom: 8 }}>Dekorativ elementlar</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {DECORATIVE_ELEMENTS.map((el) => (
          <button
            key={el.id}
            onClick={() => onAddElement?.(el)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: 8,
              borderRadius: 6,
              border: `1px solid ${TOKENS.parchmentDeep}`,
              background: "transparent",
              cursor: "pointer",
              fontSize: 10,
              color: TOKENS.ink60,
            }}
          >
            <el.icon size={18} color={el.defaultColor} />
            <span>{el.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TransformableElement({
  element,
  children,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onLayerUp,
  onLayerDown,
  onStyle,
  canEdit,
  canvasRef,
}) {
  const [pos, setPos] = useState({
    x: element.position_x || 0,
    y: element.position_y || 0,
    w: element.position_w || 40,
    h: element.position_h || 40,
    rotate: element.rotation || 0,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPos: pos });
  const resizeRef = useRef({ handle: null, startX: 0, startY: 0, startPos: pos });
  const rotatingRef = useRef(false);
  // isDragging/isResizing (state) faqat render uchun (kursor, o'tish animatsiyasi).
  // interactingRef esa quyidagi effekt ichida darhol o'qiladigan "hozir faol
  // sudrayapmi/cho'zyapmimi/buryapmimi" bayrog'i — buni useEffect'ning dependency
  // massiviga QO'SHMASLIK kerak edi: aks holda faqat isDragging/isResizing state
  // false'ga o'tgani sababli effekt o'zi ishga tushib, hali serverdan yangi
  // (revalidatePath'dan keyingi) qiymat kelmagan eski `element` prop'ini qaytarib
  // qo'yardi — natijada foydalanuvchi o'zgartirgan zahoti bir zumga ESKI holatga
  // "sakrab qaytib", keyin bir necha yuz millisekundan so'ng server javobi kelib,
  // YANGI holatga qaytar edi (ko'rinishda: kichraytirasan → birdan avvalgi
  // holatga qaytadi → keyin sen o'zgartirgan holatga o'tadi).
  const interactingRef = useRef(false);

  // element.position_x/y/w/h/rotation faqat mahalliy `pos` bilan sinxron
  // saqlanadi (masalan, bekor qilish/qaytarish tugmasi bosilganda, yoki
  // boshqa foydalanuvchi joylashuvni o'zgartirganda). Faol sudrash/cho'zish/
  // burish davomida esa mahalliy holat ustunlik qiladi — aks holda server
  // javobi kelib, foydalanuvchi hali sudrayotgan elementni orqaga tortib
  // yuborishi mumkin. MUHIM: bu effekt faqat `element`dagi HAQIQIY
  // pozitsiya qiymatlari o'zgarganda ishga tushishi kerak — isDragging/
  // isResizing state o'zgarishi (masalan, gesture tugaganda) buni ishga
  // tushirmasligi kerak, aks holda yuqoridagi "orqaga sakrash" bug'i qaytadi.
  useEffect(() => {
    if (interactingRef.current) return;
    setPos({
      x: element.position_x || 0,
      y: element.position_y || 0,
      w: element.position_w || 40,
      h: element.position_h || 40,
      rotate: element.rotation || 0,
    });
  }, [element.position_x, element.position_y, element.position_w, element.position_h, element.rotation]);

  const handleDragStart = (e) => {
    if (!canEdit || element.locked) return;
    // Ichki interaktiv boshqaruvlar (yuklash tugmasi, fayl input va h.k.) ustida
    // bosilganda sudrashni boshlamaslik kerak — aks holda ularning click hodisasi
    // pointer capture tufayli hech qachon yetib bormaydi (masalan, layout
    // tanlangandan keyin bo'sh rasm slotiga bosib rasm yuklab bo'lmaydi).
    if (e.target.closest?.("button, input, a, [data-no-drag], [contenteditable='true']")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...pos },
    };
    setIsDragging(true);
    interactingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const dx = ((e.clientX - dragRef.current.startX) / e.currentTarget.parentElement.getBoundingClientRect().width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / e.currentTarget.parentElement.getBoundingClientRect().height) * 100;
    const newX = Math.max(0, Math.min(100 - pos.w, dragRef.current.startPos.x + dx));
    const newY = Math.max(0, Math.min(100 - pos.h, dragRef.current.startPos.y + dy));
    setPos((p) => ({ ...p, x: newX, y: newY }));
  };

  const handleDragEnd = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    interactingRef.current = false;
    const sp = dragRef.current.startPos;
    onUpdate({ x: pos.x, y: pos.y, w: pos.w, h: pos.h, rotate: pos.rotate, prev: { x: sp.x, y: sp.y, w: sp.w, h: sp.h, rotate: sp.rotate } });
  };

  const handleResizeStart = (e, handle) => {
    if (!canEdit || element.locked) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    resizeRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...pos },
    };
    setIsResizing(true);
    interactingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    const { handle, startX, startY, startPos } = resizeRef.current;
    const parentRect = (canvasRef?.current || e.currentTarget.parentElement).getBoundingClientRect();
    const dx = ((e.clientX - startX) / parentRect.width) * 100;
    const dy = ((e.clientY - startY) / parentRect.height) * 100;

    let newW = startPos.w;
    let newH = startPos.h;
    let newX = startPos.x;
    let newY = startPos.y;
    const minSize = 3;
    const aspect = startPos.h > 0 ? startPos.w / startPos.h : 1;
    const free = e.shiftKey === true; // Shift = erkin resize
    const isCorner = handle === "se" || handle === "nw" || handle === "ne" || handle === "sw";

    const clampFree = (h) => {
      switch (h) {
        case "se": newW = Math.max(minSize, startPos.w + dx); newH = Math.max(minSize, startPos.h + dy); break;
        case "nw": newW = Math.max(minSize, startPos.w - dx); newH = Math.max(minSize, startPos.h - dy); newX = startPos.x + (startPos.w - newW); newY = startPos.y + (startPos.h - newH); break;
        case "ne": newW = Math.max(minSize, startPos.w + dx); newH = Math.max(minSize, startPos.h - dy); newY = startPos.y + (startPos.h - newH); break;
        case "sw": newW = Math.max(minSize, startPos.w - dx); newH = Math.max(minSize, startPos.h + dy); newX = startPos.x + (startPos.w - newW); break;
        case "n": newH = Math.max(minSize, startPos.h - dy); newY = startPos.y + (startPos.h - newH); break;
        case "s": newH = Math.max(minSize, startPos.h + dy); break;
        case "w": newW = Math.max(minSize, startPos.w - dx); newX = startPos.x + (startPos.w - newW); break;
        case "e": newW = Math.max(minSize, startPos.w + dx); break;
      }
    };

    if (free || !isCorner) {
      clampFree(handle);
    } else {
      // Aspect-ratio saqlab, kattaroq harakat o'qi bo'yicha proporsional resize.
      const relW = startPos.w > 0 ? dx / startPos.w : dx;
      const relH = startPos.h > 0 ? dy / startPos.h : dy;
      const rel = Math.abs(relW) > Math.abs(relH) ? relW : relH;
      newW = Math.max(minSize, startPos.w * (1 + rel));
      newH = newW / aspect;
      if (handle === "nw") { newX = startPos.x + (startPos.w - newW); newY = startPos.y + (startPos.h - newH); }
      else if (handle === "ne") { newY = startPos.y + (startPos.h - newH); }
      else if (handle === "sw") { newX = startPos.x + (startPos.w - newW); }
    }

    setPos({ ...pos, x: Math.round(newX * 100) / 100, y: Math.round(newY * 100) / 100, w: Math.round(newW * 100) / 100, h: Math.round(newH * 100) / 100 });
  };

  const handleResizeEnd = (e) => {
    if (!isResizing) return;
    setIsResizing(false);
    interactingRef.current = false;
    resizeRef.current.handle = null;
    const sp = resizeRef.current.startPos;
    onUpdate({ x: pos.x, y: pos.y, w: pos.w, h: pos.h, rotate: pos.rotate, prev: { x: sp.x, y: sp.y, w: sp.w, h: sp.h, rotate: sp.rotate } });
  };

  const rotateRef = useRef({ startX: 0, startY: 0, startRotate: 0, centerX: 0, centerY: 0 });

  const handleRotateStart = (e) => {
    if (!canEdit || element.locked) return;
    e.stopPropagation();
    const rect = (canvasRef?.current || e.currentTarget.parentElement).getBoundingClientRect();
    const centerX = rect.left + rect.width * (pos.x + pos.w / 2) / 100;
    const centerY = rect.top + rect.height * (pos.y + pos.h / 2) / 100;
    rotateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRotate: pos.rotate,
      centerX,
      centerY,
    };
    rotatingRef.current = true;
    interactingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleRotateMove = (e) => {
    const { startX, startY, startRotate, centerX, centerY } = rotateRef.current;
    if (centerX === undefined) return;
    const angle1 = Math.atan2(startY - centerY, startX - centerX) * 180 / Math.PI;
    const angle2 = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
    let newRotate = startRotate + (angle2 - angle1);
    if (e.shiftKey) newRotate = Math.round(newRotate / 15) * 15; // Shift = 15° snap
    setPos((p) => ({ ...p, rotate: newRotate }));
  };

  const handleRotateEnd = (e) => {
    const startRotate = rotateRef.current.startRotate;
    rotateRef.current.centerX = undefined;
    rotatingRef.current = false;
    interactingRef.current = false;
    onUpdate({ x: pos.x, y: pos.y, w: pos.w, h: pos.h, rotate: pos.rotate, prev: { x: pos.x, y: pos.y, w: pos.w, h: pos.h, rotate: startRotate } });
  };

  const resizeHandles = [
    { id: "se", cursor: "nwse-resize", x: 1, y: 1 },
    { id: "nw", cursor: "nwse-resize", x: 0, y: 0 },
    { id: "ne", cursor: "nesw-resize", x: 1, y: 0 },
    { id: "sw", cursor: "nesw-resize", x: 0, y: 1 },
    { id: "n", cursor: "ns-resize", x: 0.5, y: 0 },
    { id: "s", cursor: "ns-resize", x: 0.5, y: 1 },
    { id: "w", cursor: "ew-resize", x: 0, y: 0.5 },
    { id: "e", cursor: "ew-resize", x: 1, y: 0.5 },
  ];

  const opacity = element.opacity !== undefined ? element.opacity / 100 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        width: `${pos.w}%`,
        height: `${pos.h}%`,
        transform: `rotate(${pos.rotate}deg)`,
        cursor: canEdit && !element.locked ? "grab" : "default",
        touchAction: "none",
        zIndex: isSelected ? 500 : (element.z_index || 0),
        border: isSelected ? `2px solid ${TOKENS.gold}` : "1px solid transparent",
        borderRadius: 4,
        boxShadow: isSelected ? `0 0 0 3px ${TOKENS.gold}33` : "none",
        transition: isDragging || isResizing ? "none" : "border 0.15s, box-shadow 0.15s",
        userSelect: "none",
        opacity: opacity,
        pointerEvents: element.locked ? "none" : "auto",
      }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
      onClick={(e) => { e.stopPropagation(); onSelect(element.id, e.shiftKey); }}
    >
      {children}

      {isSelected && canEdit && !element.locked && (
        <>
          {resizeHandles.map((h) => (
            <div
              key={h.id}
              style={{
                position: "absolute",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#fff",
                border: `2px solid ${TOKENS.gold}`,
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                left: `calc(${h.x * 100}% - 6px)`,
                top: `calc(${h.y * 100}% - 6px)`,
                cursor: h.cursor,
                touchAction: "none",
                zIndex: 10,
              }}
              onPointerDown={(e) => { e.stopPropagation(); handleResizeStart(e, h.id); }}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              onPointerCancel={handleResizeEnd}
            />
          ))}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -34,
              transform: "translateX(-50%)",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: TOKENS.teal,
              border: "2.5px solid #fff",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              cursor: "grab",
              touchAction: "none",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 10,
            }}
            onPointerDown={handleRotateStart}
            onPointerMove={handleRotateMove}
            onPointerUp={handleRotateEnd}
            onPointerCancel={handleRotateEnd}
          >
            ↻
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -20,
              width: 1.5,
              height: 20,
              background: `${TOKENS.teal}99`,
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          />

          <ElementFloatingToolbar
            onDuplicate={() => onDuplicate(element.id)}
            onLayerUp={() => onLayerUp(element.id)}
            onLayerDown={() => onLayerDown(element.id)}
            onDelete={() => onDelete(element.id)}
            onStyle={() => onStyle(element.id)}
          />
        </>
      )}
    </div>
  );
}

function ElementFloatingToolbar({ onDuplicate, onLayerUp, onLayerDown, onDelete, onStyle }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "calc(100% + 10px)",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: TOKENS.ink,
        borderRadius: 9,
        padding: 4,
        boxShadow: "0 6px 16px rgba(30,26,15,0.3)",
        zIndex: 70,
        whiteSpace: "nowrap",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" className="fm-toolbar-btn" title="Uslub" onClick={onStyle}>
        <Palette size={14} />
      </button>
      <button type="button" className="fm-toolbar-btn" title="Nusxalash" onClick={onDuplicate}>
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

function PageCanvas({
  page,
  layout,
  familySlug,
  albumId,
  canEdit,
  saveElementPhotoUrlAction,
  updateElementTextAction,
  deleteElementAction,
  updateElementPositionAction,
  updateElementFrameAction,
  updateElementTextStyleAction,
  updateElementStickerColorAction,
  changeZIndexAction,
  duplicateElementAction,
  backgroundId,
  backgroundImageUrl,
  onDropPhoto,
  onCommitPosition,
  onDuplicated,
  onZIndexChange,
  onElementSelect,
  onStyleElement,
  groupElementsAction,
  ungroupElementsAction,
  updateElementCropAction,
  selectedId,
}) {
  const router = useRouter();
  const canvasRef = useRef(null);
  const elements = page.elements || [];

  const [multiIds, setMultiIds] = useState([]);
  const [multiGhost, setMultiGhost] = useState(null);
  const multiDragRef = useRef(null);
  const [groupState, groupFormAction] = useActionState(groupElementsAction, undefined);
  const [ungroupState, ungroupFormAction] = useActionState(ungroupElementsAction, undefined);
  const groupFormRef = useRef(null);
  const ungroupFormRef = useRef(null);
  const [delState, delFormAction] = useActionState(deleteElementAction, undefined);
  const [posState, posFormAction] = useActionState(updateElementPositionAction, undefined);
  const [dupState, dupFormAction] = useActionState(duplicateElementAction, undefined);
  const [zState, zFormAction] = useActionState(changeZIndexAction, undefined);
  const lastDupSourceRef = useRef(null);

  // MUHIM: bu forma amallari (o'chirish, joylashuv, nusxalash, qatlam) real
  // Server Action'larga ulangan va DBga to'g'ri yozadi — lekin Next.js'ning
  // <form action> orqali "avtomatik" client-refresh mexanizmiga tayanib
  // bo'lmaydi (amaliyotda ishonchli ishlamadi, foydalanuvchi har safar F5
  // bosishga majbur bo'lardi). Shu sabab har bir amal muvaffaqiyatli
  // yakunlangach (state?.ok) QO'LDA router.refresh() chaqiriladi — bu
  // page.tsx'dagi `force-dynamic` bilan birga har doim eng yangi
  // ma'lumotni serverdan qayta oladi.
  useEffect(() => { if (delState?.ok) router.refresh(); }, [delState, router]);
  useEffect(() => { if (posState?.ok) router.refresh(); }, [posState, router]);
  useEffect(() => { if (zState?.ok) router.refresh(); }, [zState, router]);
  useEffect(() => { if (dupState?.ok) router.refresh(); }, [dupState, router]);
  useEffect(() => { if (groupState?.ok) router.refresh(); }, [groupState, router]);
  useEffect(() => { if (ungroupState?.ok) router.refresh(); }, [ungroupState, router]);

  useEffect(() => {
    if (dupState?.ok && dupState.elementId) {
      onDuplicated?.({ pageId: page.id, sourceId: lastDupSourceRef.current, newId: dupState.elementId });
    }
  }, [dupState]);

  const handleElementSelect = (id, shift) => {
    if (shift && canEdit) {
      setMultiIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setMultiIds([]);
      onElementSelect(id);
    }
  };

  const multiElements = multiIds.length > 0 ? elements.filter((el) => multiIds.includes(el.id)) : [];

  const submitGroup = () => {
    if (multiElements.length < 2) return;
    const f = groupFormRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.groupId.value = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    f.elements.elementIds.value = multiIds.join(",");
    f.requestSubmit();
    setMultiIds([]);
    onElementSelect(null);
  };

  const submitUngroup = () => {
    const f = ungroupFormRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.elementIds.value = multiIds.join(",");
    f.requestSubmit();
    setMultiIds([]);
    onElementSelect(null);
  };

  const startMultiDrag = (e) => {
    if (!canEdit || multiElements.length === 0) return;
    e.stopPropagation();
    multiDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      starts: multiElements.map((el) => ({ id: el.id, x: el.position_x ?? 0, y: el.position_y ?? 0 })),
    };
    setMultiGhost({ dx: 0, dy: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveMultiDrag = (e) => {
    const d = multiDragRef.current;
    if (!d) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setMultiGhost({ dx: ((e.clientX - d.startX) / rect.width) * 100, dy: ((e.clientY - d.startY) / rect.height) * 100 });
  };

  const endMultiDrag = (e) => {
    const d = multiDragRef.current;
    if (!d) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (rect && rect.width > 0) {
      dx = ((e.clientX - d.startX) / rect.width) * 100;
      dy = ((e.clientY - d.startY) / rect.height) * 100;
    }
    if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
      d.starts.forEach((s) => {
        handleUpdate(s.id, { x: Math.round((s.x + dx) * 10) / 10, y: Math.round((s.y + dy) * 10) / 10 });
      });
    }
    multiDragRef.current = null;
    setMultiGhost(null);
  };

  const box = (() => {
    if (multiElements.length === 0) return null;
    const mx = Math.min(...multiElements.map((el) => el.position_x ?? 0));
    const my = Math.min(...multiElements.map((el) => el.position_y ?? 0));
    const mw = Math.max(...multiElements.map((el) => (el.position_x ?? 0) + (el.position_w ?? 40))) - mx;
    const mh = Math.max(...multiElements.map((el) => (el.position_y ?? 0) + (el.position_h ?? 40))) - my;
    return { mx, my, mw, mh };
  })();

  const handleCanvasDrop = async (e) => {
    if (!canEdit) return;
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
    if (!data || data.type !== "photo" || !data.url) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const dropX = ((e.clientX - rect.left) / rect.width) * 100;
    const dropY = ((e.clientY - rect.top) / rect.height) * 100;

    // If the drop lands on top of an existing empty photo slot (e.g. from a
    // layout template), fill that slot instead of creating a new free-
    // floating photo element on top of it.
    const targetSlot = elements.find((el) => {
      if (el.type !== "photo" || el.photo_url) return false;
      const ex = el.position_x ?? 0;
      const ey = el.position_y ?? 0;
      const ew = el.position_w ?? 40;
      const eh = el.position_h ?? 30;
      return dropX >= ex && dropX <= ex + ew && dropY >= ey && dropY <= ey + eh;
    });

    if (targetSlot) {
      try {
        const result = await saveElementPhotoUrlAction(familySlug, albumId, targetSlot.id, data.url, false);
        if (result?.error) console.error(result.error);
        else router.refresh();
      } catch (err) {
        console.error("Rasmni slotga joylashtirishda xato:", err);
      }
      return;
    }

    const dw = 40;
    const dh = 30;
    const x = Math.max(0, Math.min(100 - dw, dropX));
    const y = Math.max(0, Math.min(100 - dh, dropY));
    onDropPhoto?.(data.url, Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  };

  const [snapGuides, setSnapGuides] = useState({ vx: null, hy: null });

  const findSnap = useCallback((movingId, x, y, w, h) => {
    const threshold = 0.8;
    const targetsX = [0, 50, 100];
    const targetsY = [0, 50, 100];

    elements.forEach((el) => {
      if (el.id === movingId) return;
      const ex = el.position_x ?? 0;
      const ey = el.position_y ?? 0;
      const ew = el.position_w ?? 40;
      const eh = el.position_h ?? 40;
      targetsX.push(ex, ex + ew, ex + ew / 2);
      targetsY.push(ey, ey + eh, ey + eh / 2);
    });

    const edgesX = [x, x + w, x + w / 2];
    const edgesY = [y, y + h, y + h / 2];

    let snapX = null, snapY = null;
    for (const edge of edgesX) {
      for (const t of targetsX) {
        if (Math.abs(edge - t) < threshold) { snapX = { edge, target: t }; break; }
      }
      if (snapX) break;
    }
    for (const edge of edgesY) {
      for (const t of targetsY) {
        if (Math.abs(edge - t) < threshold) { snapY = { edge, target: t }; break; }
      }
      if (snapY) break;
    }

    const result = {
      x: snapX ? x + (snapX.target - snapX.edge) : x,
      y: snapY ? y + (snapY.target - snapY.edge) : y,
      vx: snapX ? snapX.target : null,
      hy: snapY ? snapY.target : null,
    };
    setSnapGuides({ vx: result.vx, hy: result.hy });
    return result;
  }, [elements]);

  const submitPositionForm = (elId, newPos) => {
    const f = posRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.elementId.value = elId;
    f.elements.positionX.value = String(newPos.x);
    f.elements.positionY.value = String(newPos.y);
    f.elements.positionW.value = String(newPos.w);
    f.elements.positionH.value = String(newPos.h);
    f.elements.rotation.value = String(newPos.rotation);
    f.elements.zIndex.value = "";
    setTimeout(() => f.requestSubmit(), 0);
  };

  const handleUpdate = (elId, updates) => {
    const el = elements.find((e) => e.id === elId);
    if (!el) return;

    const newPos = {
      x: updates.x ?? el.position_x ?? 0,
      y: updates.y ?? el.position_y ?? 0,
      w: updates.w ?? el.position_w ?? 40,
      h: updates.h ?? el.position_h ?? 40,
      rotation: updates.rotate ?? el.rotation ?? 0,
    };

    // TransformableElement gesture boshida o'zining mahalliy holatidan aniq
    // `prev`ni yuboradi (updates.prev) — bu `elements` prop'i hali server bilan
    // qayta sinxronlanmagan bo'lsa ham (masalan, ketma-ket ikki marta cho'zishda)
    // to'g'ri tarixni ta'minlaydi. Agar berilmagan bo'lsa (masalan boshqa chaqiruv
    // yo'llaridan), eski usulga — joriy prop qiymatiga — qaytiladi.
    const prevBox = updates.prev
      ? { x: updates.prev.x ?? 0, y: updates.prev.y ?? 0, w: updates.prev.w ?? 40, h: updates.prev.h ?? 40, r: updates.prev.rotate ?? 0 }
      : { x: el.position_x ?? 0, y: el.position_y ?? 0, w: el.position_w ?? 40, h: el.position_h ?? 40, r: el.rotation ?? 0 };

    onCommitPosition?.({
      pageId: page.id,
      elementId: elId,
      prev: prevBox,
      next: newPos,
    });

    submitPositionForm(elId, newPos);
  };

  const handleDelete = (elId) => {
    const f = delRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.albumId.value = albumId;
    f.elements.elementId.value = elId;
    f.requestSubmit();
    onElementSelect(null);
  };

  const handleDuplicate = (elId) => {
    const f = dupRef.current;
    if (!f) return;
    lastDupSourceRef.current = elId;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.albumId.value = albumId;
    f.elements.elementId.value = elId;
    f.requestSubmit();
  };

  const handleLayerUp = (elId) => {
    onZIndexChange?.({ pageId: page.id, elementId: elId, direction: "up" });
    const f = zRef.current;
    if (f) {
      f.elements.familySlug.value = familySlug;
      f.elements.pageId.value = page.id;
      f.elements.elementId.value = elId;
      f.elements.direction.value = "up";
      f.requestSubmit();
    }
  };

  const handleLayerDown = (elId) => {
    onZIndexChange?.({ pageId: page.id, elementId: elId, direction: "down" });
    const f = zRef.current;
    if (f) {
      f.elements.familySlug.value = familySlug;
      f.elements.pageId.value = page.id;
      f.elements.elementId.value = elId;
      f.elements.direction.value = "down";
      f.requestSubmit();
    }
  };

  const posRef = useRef(null);
  const delRef = useRef(null);
  const dupRef = useRef(null);
  const zRef = useRef(null);
  const copiedRef = useRef([]);

  useEffect(() => {
    if (!canEdit) return;
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;

      const applyToAll = (fn) => { const ids = multiIds.length ? multiIds : (selectedId ? [selectedId] : []); ids.forEach(fn); };

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        applyToAll((id) => handleDelete(id));
        return;
      }
      if (e.key === "Escape") {
        if (multiIds.length) { setMultiIds([]); return; }
        onElementSelect(null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (multiIds.length === 0 && !selectedId) return;
        e.preventDefault();
        applyToAll((id) => handleDuplicate(id));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        if (elements.length === 0) return;
        e.preventDefault();
        setMultiIds(elements.map((el) => el.id));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (multiIds.length === 0 && !selectedId) return;
        e.preventDefault();
        copiedRef.current = multiIds.length ? multiIds : [selectedId];
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (copiedRef.current.length === 0) return;
        e.preventDefault();
        copiedRef.current.slice().forEach((id) => handleDuplicate(id));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) submitUngroup(); else submitGroup();
        return;
      }
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (dir) {
        const ids = multiIds.length ? multiIds : (selectedId ? [selectedId] : []);
        if (ids.length === 0) return;
        const els = elements.filter((x) => ids.includes(x.id));
        if (els.length === 0) return;
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.25;
        els.forEach((el) => {
          const prev = { x: el.position_x ?? 0, y: el.position_y ?? 0, w: el.position_w ?? 40, h: el.position_h ?? 40, r: el.rotation ?? 0 };
          const next = { x: Math.round((prev.x + dir[0] * step) * 100) / 100, y: Math.round((prev.y + dir[1] * step) * 100) / 100, w: prev.w, h: prev.h, rotation: prev.r };
          onCommitPosition?.({ pageId: page.id, elementId: el.id, prev, next });
          submitPositionForm(el.id, next);
        });
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit, selectedId, multiIds, elements, page.id, familySlug, onCommitPosition, handleDelete, handleDuplicate, submitPositionForm, submitGroup, submitUngroup]);

  const renderContent = (el) => {
    if (el.type === "photo") {
      return (
        <PhotoSlotContent
          element={el}
          familySlug={familySlug}
          albumId={albumId}
          pageId={page.id}
          saveElementPhotoUrlAction={saveElementPhotoUrlAction}
          updateElementCropAction={updateElementCropAction}
          canEdit={canEdit}
        />
      );
    }
    if (el.type === "text") {
      return (
        <TextSlotContent
          element={el}
          familySlug={familySlug}
          albumId={albumId}
          updateElementTextAction={updateElementTextAction}
          canEdit={canEdit}
        />
      );
    }
    if (el.type === "sticker") {
      return <StickerSlotContent element={el} canEdit={canEdit} />;
    }
    return null;
  };

  return (
    <div
      ref={canvasRef}
      onClick={() => { onElementSelect(null); setSnapGuides({ vx: null, hy: null }); setMultiIds([]); }}
      onDragOver={(e) => {
        if (!canEdit) return;
        if (Array.from(e.dataTransfer.types).includes("text/plain")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={handleCanvasDrop}
      style={{
        flex: 1,
        minWidth: 0,
        aspectRatio: "4/3",
        borderRadius: 3,
        position: "relative",
        background: backgroundImageUrl
          ? `url("${backgroundImageUrl}") center/cover no-repeat`
          : `${PAPER_TEXTURE_URL}, radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.5), transparent 60%), linear-gradient(180deg, ${BACKGROUNDS[backgroundId]?.from || BACKGROUNDS.paper.from}, ${BACKGROUNDS[backgroundId]?.to || BACKGROUNDS.paper.to})`,
        backgroundSize: backgroundImageUrl ? "cover" : "220px 220px, cover, cover",
        boxShadow: `inset 0 0 40px rgba(120,96,54,0.16), 0 2px 6px rgba(30,38,33,0.08)`,
        touchAction: "none",
        overflow: "hidden",
      }}
    >
      <LeafDoodle style={{ bottom: 6, right: 8 }} flip />
      <LeafDoodle style={{ top: 4, left: 6, opacity: 0.28 }} />

      {snapGuides.vx != null && (
        <div style={{ position: "absolute", left: `${snapGuides.vx}%`, top: 0, bottom: 0, width: 1, background: TOKENS.gold, opacity: 0.85, pointerEvents: "none", zIndex: 100 }} />
      )}
      {snapGuides.hy != null && (
        <div style={{ position: "absolute", top: `${snapGuides.hy}%`, left: 0, right: 0, height: 1, background: TOKENS.gold, opacity: 0.85, pointerEvents: "none", zIndex: 100 }} />
      )}

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
      <form ref={groupFormRef} action={groupFormAction} style={{ display: "none" }}>
        <input type="hidden" name="familySlug" />
        <input type="hidden" name="pageId" />
        <input type="hidden" name="groupId" />
        <input type="hidden" name="elementIds" />
      </form>
      <form ref={ungroupFormRef} action={ungroupFormAction} style={{ display: "none" }}>
        <input type="hidden" name="familySlug" />
        <input type="hidden" name="pageId" />
        <input type="hidden" name="elementIds" />
      </form>

      {elements.map((el, i) => (
        <TransformableElement
          key={el.id}
          element={el}
          isSelected={selectedId === el.id}
          onSelect={handleElementSelect}
          onUpdate={(updates) => handleUpdate(el.id, updates)}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onLayerUp={handleLayerUp}
          onLayerDown={handleLayerDown}
          onStyle={onStyleElement}
          canEdit={canEdit}
          canvasRef={canvasRef}
        >
          {renderContent(el)}
        </TransformableElement>
      ))}

      {box && canEdit && (
        <>
          <div style={{ position: "absolute", left: `${box.mx}%`, top: `${box.my}%`, width: `${box.mw}%`, height: `${box.mh}%`, border: `1.5px dashed ${TOKENS.gold}`, borderRadius: 2, pointerEvents: "none", zIndex: 60 }} />
          {multiGhost && (
            <div style={{ position: "absolute", left: `${box.mx + multiGhost.dx}%`, top: `${box.my + multiGhost.dy}%`, width: `${box.mw}%`, height: `${box.mh}%`, border: "1.5px solid rgba(43,92,255,0.6)", background: "rgba(43,92,255,0.06)", borderRadius: 2, pointerEvents: "none", zIndex: 59 }} />
          )}
          <div
            onPointerDown={startMultiDrag}
            onPointerMove={moveMultiDrag}
            onPointerUp={endMultiDrag}
            onPointerCancel={endMultiDrag}
            style={{ position: "absolute", left: `${box.mx}%`, top: `${box.my}%`, width: `${box.mw}%`, height: 14, cursor: "move", zIndex: 66, touchAction: "none" }}
          />
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", left: `${box.mx}%`, top: `${box.my}%`, transform: "translateY(-108%)", zIndex: 70, display: "flex", alignItems: "center", gap: 3, background: TOKENS.ink, borderRadius: 9, padding: 4, boxShadow: "0 6px 16px rgba(30,26,15,0.3)", whiteSpace: "nowrap" }}
          >
            <span style={{ color: "#fff", fontSize: 10.5, padding: "0 6px", fontWeight: 600 }}>{multiElements.length}</span>
            <button type="button" className="fm-toolbar-btn" title="Guruhlash" onClick={submitGroup}><Group size={14} /></button>
            <button type="button" className="fm-toolbar-btn" title="Guruhdan chiqarish" onClick={submitUngroup}><Ungroup size={14} /></button>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.18)", margin: "0 2px" }} />
            <button type="button" className="fm-toolbar-btn" title="Nusxalash (Ctrl+D)" onClick={() => { multiElements.forEach((el) => handleDuplicate(el.id)); }}><Copy size={14} /></button>
            <button type="button" className="fm-toolbar-btn danger" title="O'chirish" onClick={() => { multiElements.forEach((el) => handleDelete(el.id)); }}><Trash2 size={14} /></button>
          </div>
        </>
      )}

      <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, color: TOKENS.ink40, display: "flex", alignItems: "center", gap: 10 }}>
        {page.date_label && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} /> {page.date_label}</span>}
        {page.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPinned size={10} /> {page.location}</span>}
      </div>
    </div>
  );
}

function PhotoSlotContent({ element, familySlug, albumId, pageId, saveElementPhotoUrlAction, updateElementCropAction, canEdit }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const [cropState, cropFormAction] = useActionState(updateElementCropAction, undefined);
  const cropFormRef = useRef(null);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState({ scale: 1, dx: 0, dy: 0, flipH: false, flipV: false });
  const cropDragRef = useRef(null);

  const [isDragOver, setIsDragOver] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return;

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    await uploadFile(file);
  };

  const handlePhotoDragOver = (e) => {
    if (!canEdit || cropMode) return;
    if (!Array.from(e.dataTransfer?.types || []).includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handlePhotoDragLeave = (e) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handlePhotoDrop = (e) => {
    if (!canEdit || cropMode) return;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    uploadFile(file);
  };

  const openCrop = () => {
    if (!element.photo_url) return;
    setCrop({ scale: element.crop_scale || 1, dx: element.crop_dx || 0, dy: element.crop_dy || 0, flipH: !!element.flip_h, flipV: !!element.flip_v });
    setCropMode(true);
  };

  const commitCrop = () => {
    const f = cropFormRef.current;
    if (f) {
      f.elements.familySlug.value = familySlug;
      f.elements.pageId.value = pageId;
      f.elements.elementId.value = element.id;
      f.elements.scale.value = String(Math.round(crop.scale * 100) / 100);
      f.elements.dx.value = String(Math.round(crop.dx * 100) / 100);
      f.elements.dy.value = String(Math.round(crop.dy * 100) / 100);
      f.elements.flipH.value = String(crop.flipH);
      f.elements.flipV.value = String(crop.flipV);
      f.requestSubmit();
    }
    setCropMode(false);
    router.refresh();
  };

  const cropPointerDown = (e) => {
    if (!cropMode || !canEdit) return;
    e.stopPropagation();
    e.preventDefault();
    cropDragRef.current = { startX: e.clientX, startY: e.clientY, dx: crop.dx, dy: crop.dy };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const cropPointerMove = (e) => {
    if (!cropMode || !cropDragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const dx = ((e.clientX - cropDragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - cropDragRef.current.startY) / rect.height) * 100;
    setCrop((c) => ({ ...c, dx: cropDragRef.current.dx + dx, dy: cropDragRef.current.dy + dy }));
  };
  const cropPointerUp = () => { cropDragRef.current = null; };

  const frameStyle = element.frame_style || "polaroid";
  const isPolaroid = frameStyle === "polaroid";
  const tilt = element.photo_url && isPolaroid ? (seeded(element.id, 1) * 4 - 2) : 0;
  const flipSX = crop.flipH ? -1 : 1;
  const flipSY = crop.flipV ? -1 : 1;
  const imgTransform = `translate(${crop.dx}%, ${crop.dy}%) scale(${crop.scale}) scaleX(${flipSX}) scaleY(${flipSY})`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: isPolaroid ? 2 : 8,
        position: "relative",
        transform: `rotate(${tilt}deg)`,
        background: element.photo_url ? (isPolaroid ? "#fff" : "transparent") : (isDragOver ? TOKENS.parchmentDeep : TOKENS.parchment),
        padding: element.photo_url && isPolaroid ? "5% 5% 9%" : 0,
        boxShadow: element.photo_url ? "0 8px 18px rgba(30,26,15,0.22), 0 2px 5px rgba(30,26,15,0.12)" : "none",
        border: element.photo_url ? "none" : `1.5px dashed ${isDragOver ? TOKENS.gold : TOKENS.parchmentDeep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        overflow: "hidden",
        transition: "background 0.12s, border-color 0.12s",
      }}
      onDragOver={canEdit && !element.photo_url ? handlePhotoDragOver : undefined}
      onDragLeave={canEdit && !element.photo_url ? handlePhotoDragLeave : undefined}
      onDrop={canEdit && !element.photo_url ? handlePhotoDrop : undefined}
    >
      {element.photo_url && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            width: 46,
            height: 20,
            transform: `translateX(-50%) rotate(${seeded(element.id, 2) * 16 - 8}deg)`,
            background: TOKENS.tape,
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: 1,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onDoubleClick={(e) => { e.stopPropagation(); if (element.photo_url && canEdit && !cropMode) openCrop(); }}
      >
        <form ref={cropFormRef} action={cropFormAction} style={{ display: "none" }}>
          <input type="hidden" name="familySlug" />
          <input type="hidden" name="pageId" />
          <input type="hidden" name="elementId" />
          <input type="hidden" name="scale" />
          <input type="hidden" name="dx" />
          <input type="hidden" name="dy" />
          <input type="hidden" name="flipH" />
          <input type="hidden" name="flipV" />
        </form>
        {element.photo_url ? (
          <img
            src={element.photo_url}
            alt=""
            draggable={false}
            onPointerDown={cropPointerDown}
            onPointerMove={cropPointerMove}
            onPointerUp={cropPointerUp}
            onPointerCancel={cropPointerUp}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: imgTransform,
              transformOrigin: "center",
              userSelect: "none",
              pointerEvents: cropMode ? "auto" : "none",
              cursor: cropMode ? "grab" : "inherit",
            }}
          />
        ) : (
          <BookImage size={20} color={TOKENS.ink40} />
        )}
        {cropMode && canEdit && (
          <div
            style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 6, zIndex: 12, display: "flex", alignItems: "center", gap: 4, background: "rgba(30,38,33,0.92)", borderRadius: 8, padding: "4px 6px" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <input type="range" min={100} max={400} value={Math.round(crop.scale * 100)} onChange={(e) => setCrop((c) => ({ ...c, scale: Number(e.target.value) / 100 }))} style={{ width: 64 }} />
            <button type="button" className="fm-toolbar-btn" title="Gorizontal aylantirish" onClick={() => setCrop((c) => ({ ...c, flipH: !c.flipH }))}><FlipHorizontal2 size={13} /></button>
            <button type="button" className="fm-toolbar-btn" title="Vertikal aylantirish" onClick={() => setCrop((c) => ({ ...c, flipV: !c.flipV }))}><FlipVertical2 size={13} /></button>
            <button type="button" className="fm-toolbar-btn" title="Bajarildi" onClick={commitCrop}><Check size={13} /></button>
            <button type="button" className="fm-toolbar-btn" title="Bekor qilish" onClick={() => setCropMode(false)}><X size={13} /></button>
          </div>
        )}
        {canEdit && !cropMode && (
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        )}
        {canEdit && (
          <>
            {!element.photo_url && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDoubleClick={() => inputRef.current?.click()}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={pending}
                title="Rasm tanlash uchun bosing yoki shu yerga sudrab tashlang"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(30,38,33,0.0)",
                  border: "none",
                  cursor: pending ? "default" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {pending ? (
                  <span style={{ fontSize: 10, color: TOKENS.ink }}>Yuklanmoqda...</span>
                ) : isDragOver ? (
                  <span style={{ fontSize: 10, color: TOKENS.gold, fontWeight: 600 }}>Shu yerga tashlang</span>
                ) : null}
              </button>
            )}
            {element.photo_url && !cropMode && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                title="Rasmni almashtirish"
                onPointerDown={(e) => e.stopPropagation()}
                onClickCapture={(e) => e.stopPropagation()}
                style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", background: "rgba(30,38,33,0.72)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9 }}
              >
                <Images size={12} />
              </button>
            )}
          </>
        )}
      </div>
      {error && <div style={{ fontSize: 9.5, color: TOKENS.danger, marginTop: 3 }}>{error}</div>}
    </div>
  );
}

// ============================================================
// 🆕 TextSlotContent — formatlash bilan
// ============================================================

function TextSlotContent({ element, familySlug, albumId, updateElementTextAction, canEdit }) {
  const [state, formAction] = useActionState(updateElementTextAction, undefined);
  const [value, setValue] = useState(element.text_content || "");
  const [isFocused, setIsFocused] = useState(false);
  const formRef = useRef(null);
  const editorRef = useRef(null);

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    const newContent = editorRef.current?.innerHTML || "";
    setValue(newContent);
    // Avtomatik saqlash
    if (canEdit && newContent !== (element.text_content || "")) {
      const f = formRef.current;
      if (f) {
        f.elements.text.value = newContent;
        setTimeout(() => f.requestSubmit(), 0);
      }
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="albumId" value={albumId} />
        <input type="hidden" name="elementId" value={element.id} />
        <input type="hidden" name="text" value={value} />
      </form>

      {/* Formatlash toolbar */}
      {canEdit && isFocused && (
        <div
          style={{
            position: "absolute",
            top: -44,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 4,
            background: TOKENS.ink,
            borderRadius: 8,
            padding: 4,
            zIndex: 20,
            boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
          }}
        >
          <button onClick={() => handleFormat("bold")} style={toolbarBtnStyle} title="Qalin">B</button>
          <button onClick={() => handleFormat("italic")} style={toolbarBtnStyle} title="Qiyshiq">I</button>
          <button onClick={() => handleFormat("underline")} style={toolbarBtnStyle} title="Tagiga chizish">U</button>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)" }} />
          <button onClick={() => handleFormat("insertUnorderedList")} style={toolbarBtnStyle} title="Ro'yxat">•</button>
          <button onClick={() => handleFormat("insertOrderedList")} style={toolbarBtnStyle} title="Raqamli ro'yxat">1.</button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable={canEdit}
        suppressContentEditableWarning
        onInput={(e) => {
          setValue(e.currentTarget.innerHTML);
          if (canEdit) {
            const f = formRef.current;
            if (f) {
              f.elements.text.value = e.currentTarget.innerHTML;
              clearTimeout(window._textSaveTimer);
              window._textSaveTimer = setTimeout(() => f.requestSubmit(), 1000);
            }
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (canEdit && value !== (element.text_content || "")) {
            formRef.current?.requestSubmit();
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: FONT_FAMILIES[element.text_font || "handwriting"],
          fontSize: element.text_size || 22,
          lineHeight: 1.35,
          color: element.text_color || TOKENS.ink,
          textAlign: element.text_align || "left",
          fontWeight: (element.text_font || "handwriting") === "handwriting" ? 600 : 500,
          padding: 0,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          cursor: canEdit ? "text" : "default",
          minHeight: "100%",
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
      {state?.error && <div style={{ fontSize: 9.5, color: TOKENS.danger }}>{state.error}</div>}
    </div>
  );
}

const toolbarBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 4,
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.85)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function StickerSlotContent({ element, canEdit }) {
  const stickerId = element.sticker_id || "leaf";
  const kind = stickerId.endsWith("-shape") ? "shape" : stickerId.startsWith("tape-") ? "tape" : "icon";
  const color = element.sticker_color || TOKENS.teal;
  const rot = seeded(element.id, 3) * 20 - 10;

  let inner;
  if (kind === "tape") {
    const striped = stickerId === "tape-stripe";
    inner = (
      <div
        style={{
          width: "100%",
          height: "100%",
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
      inner = (
        <div
          style={{
            width: 0,
            height: 0,
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
      style={{
        width: "100%",
        height: "100%",
        transform: `rotate(${rot}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {inner}
    </div>
  );
}

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

function FramePreviewSwatch({ frameId }) {
  if (frameId === "polaroid") {
    return (
      <div style={{ width: 30, height: 30, background: "#fff", borderRadius: 2, padding: "3px 3px 6px", boxShadow: "0 2px 5px rgba(30,26,15,0.22)", boxSizing: "border-box" }}>
        <div style={{ width: "100%", height: "100%", background: TOKENS.parchmentDeep, borderRadius: 1 }} />
      </div>
    );
  }
  if (frameId === "soft") {
    return <div style={{ width: 30, height: 30, borderRadius: 6, background: TOKENS.parchmentDeep, boxShadow: "0 4px 10px rgba(30,26,15,0.25)" }} />;
  }
  return <div style={{ width: 30, height: 30, borderRadius: 2, background: TOKENS.parchmentDeep, border: `1px dashed ${TOKENS.ink40}` }} />;
}

function PhotoStylePanel({ element, familySlug, albumId, updateElementFrameAction, onClose }) {
  const [, formAction] = useActionState(updateElementFrameAction, undefined);
  const formRef = useRef(null);

  const submit = (frameId) => {
    const f = formRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.albumId.value = albumId;
    f.elements.elementId.value = element.id;
    f.elements.frameStyle.value = frameId;
    f.requestSubmit();
  };

  const current = element.frame_style || "polaroid";

  return (
    <StylePanelShell title="Rasm ramkasi" onClose={onClose}>
      <form ref={formRef} action={formAction} style={{ display: "none" }}>
        <input type="hidden" name="familySlug" />
        <input type="hidden" name="albumId" />
        <input type="hidden" name="elementId" />
        <input type="hidden" name="frameStyle" />
      </form>
      <div style={PANEL_LABEL_STYLE}>Ramka</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {FRAME_LIST.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => submit(f.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 7, cursor: "pointer",
              border: `1px solid ${current === f.id ? TOKENS.gold : TOKENS.parchmentDeep}`,
              background: current === f.id ? TOKENS.parchmentDeep : "transparent",
            }}
          >
            <FramePreviewSwatch frameId={f.id} />
            <span style={{ fontSize: 12, color: TOKENS.ink, fontWeight: current === f.id ? 600 : 400 }}>{f.name}</span>
          </button>
        ))}
      </div>
    </StylePanelShell>
  );
}

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

function waitFrames(n = 2) {
  return new Promise((resolve) => {
    let count = 0;
    function step() {
      count += 1;
      if (count >= n) resolve();
      else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function captureNodeToCanvas(node) {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(node, {
    useCORS: true,
    backgroundColor: "#ffffff",
    scale: Math.min(2, window.devicePixelRatio || 2),
    logging: false,
  });
}

function slugifyFilename(name) {
  return (name || "albom").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "albom";
}

function ExportMenu({ album, exporting, setExporting, exportError, setExportError, pageNodeRef, previewMode, setPreviewMode, activePanel, setActivePanel, pages, pageIndex, setPageIndex }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const runExport = async (fn) => {
    setOpen(false);
    setExportError(null);
    setExporting(true);
    const restoreIndex = pageIndex;
    const restorePreview = previewMode;
    setActivePanel(null);
    setPreviewMode(true);
    try {
      await waitFrames(2);
      await fn();
    } catch (err) {
      setExportError("Eksport qilishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setPageIndex(restoreIndex);
      setPreviewMode(restorePreview);
      setExporting(false);
    }
  };

  const exportImage = (format) => runExport(async () => {
    await waitFrames(2);
    const canvas = await captureNodeToCanvas(pageNodeRef.current);
    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const quality = format === "jpg" ? 0.92 : undefined;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
    if (!blob) throw new Error("canvas empty");
    downloadBlob(blob, `${slugifyFilename(album.title)}-sahifa-${pageIndex + 1}.${format}`);
  });

  const exportPdf = () => runExport(async () => {
    const { default: jsPDF } = await import("jspdf");
    let pdf = null;
    for (let i = 0; i < pages.length; i += 1) {
      setPageIndex(i);
      await waitFrames(3);
      const canvas = await captureNodeToCanvas(pageNodeRef.current);
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
      if (!pdf) {
        pdf = new jsPDF({ orientation, unit: "px", format: [canvas.width, canvas.height] });
      } else {
        pdf.addPage([canvas.width, canvas.height], orientation);
      }
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);

      // 📌 Har bir sahifaga nom qo'shish
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Sahifa ${i + 1} / ${pages.length}`, 10, canvas.height - 10);
    }
    if (pdf) pdf.save(`${slugifyFilename(album.title)}.pdf`);
  });

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={exporting}
        style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
          background: "#F4F2ED", color: TOKENS.ink,
          border: "none", borderRadius: 8, padding: "8px 12px", cursor: exporting ? "default" : "pointer",
        }}
      >
        {exporting ? <Loader2 size={14} className="fm-spin" /> : <Download size={14} />}
        {exporting ? "Eksport qilinmoqda…" : "Yuklab olish"}
      </button>
      {open && !exporting && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 60,
            background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10,
            boxShadow: "0 10px 24px rgba(30,26,15,0.3)", padding: 6, width: 200,
          }}
        >
          {[
            { label: "Joriy sahifa — PNG", onClick: () => exportImage("png") },
            { label: "Joriy sahifa — JPG", onClick: () => exportImage("jpg") },
            { label: "Butun albom — PDF", onClick: exportPdf },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              style={{
                display: "block", width: "100%", textAlign: "left", fontSize: 12.5, color: TOKENS.ink,
                background: "transparent", border: "none", borderRadius: 6, padding: "8px 10px", cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = TOKENS.parchmentDeep; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {item.label}
            </button>
          ))}
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
  reorderAlbumPagesAction,
  duplicateAlbumPageAction,
  groupElementsAction,
  ungroupElementsAction,
  updateElementCropAction,
  photos,
  onToolbarChange,
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [activePanel, setActivePanel] = useState(null);
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const effectiveCanEdit = canEdit && !previewMode;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const pageNodeRef = useRef(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [stylePopupId, setStylePopupId] = useState(null);
  const [draggedPageIndex, setDraggedPageIndex] = useState(null);
  const [sessionUploads, setSessionUploads] = useState([]);
  const router = useRouter();

  const [saveStatus, setSaveStatus] = useState("saved");
  const saveTimeoutRef = useRef(null);

  const triggerAutosave = useCallback(() => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saved");
    }, 3000);
  }, []);

  const ZOOM_MIN = 0.5, ZOOM_MAX = 2, ZOOM_STEP = 0.1;
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => { setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100)); resetPan(); };
  const zoomOut = () => { setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100)); resetPan(); };
  const zoomFit = () => { setZoom(1); resetPan(); };

  // ── "100%" endi ekranga (kengligi VA balandligi) to'liq sig'adigan eng katta
  // o'lcham sifatida hisoblanadi — statik foizga emas, o'lchangan bo'sh joyga asoslanadi.
  const canvasAreaRef = useRef(null);
  const topToolbarRef = useRef(null);
  const pageNavRowRef = useRef(null);
  const [fitWidth, setFitWidth] = useState(null);

  // Chap asboblar paneli (Shablon/Layout/Stiker/...) desktopda global
  // Sidebar'ning o'ng tomonidan canvas ustiga suzib chiqishi kerak — buning
  // uchun avval faqat CSS media-query (`position: fixed !important`) ga
  // tayanilgan edi, lekin bu ba'zan ishlamay (yoki canvasAreaRef balandligi
  // auto bo'lgani uchun `bottom:0` to'g'ri cho'zilmay), panel sahifa
  // (canvas) orqasida "yashirinib"/kesilib qolardi. Endi buni JS orqali
  // ANIQ hisoblab, inline style bilan beramiz — CSS'ga bog'liq bo'lmaydi.
  const [flyoutMetrics, setFlyoutMetrics] = useState({ isDesktop: false, topOffset: 0 });

  useEffect(() => {
    const recomputeFit = () => {
      const areaEl = canvasAreaRef.current;
      if (!areaEl) return;
      const availableWidthPx = areaEl.clientWidth;
      const toolbarH = topToolbarRef.current?.offsetHeight || 0;
      const navH = pageNavRowRef.current?.offsetHeight || 0;
      // 24+36 = sahifa konteyneri padding'i, 18 = nav qatori marginBottom'i, 10 = zaxira
      const availableHeightPx = Math.max(200, window.innerHeight - toolbarH - navH - 24 - 36 - 18 - 10);
      const next = Math.max(240, Math.min(availableWidthPx, availableHeightPx * (4 / 3)));
      setFitWidth(next);
      setFlyoutMetrics({ isDesktop: window.innerWidth >= 769, topOffset: toolbarH });
    };
    recomputeFit();
    window.addEventListener("resize", recomputeFit);
    const ro = new ResizeObserver(recomputeFit);
    if (canvasAreaRef.current) ro.observe(canvasAreaRef.current);
    return () => {
      window.removeEventListener("resize", recomputeFit);
      ro.disconnect();
    };
  }, []);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const sceneRef = useRef(null);
  const panAnchorRef = useRef(null);
  const [isSpacePan, setIsSpacePan] = useState(false);
  const resetPan = () => setPan((p) => (p.x === 0 && p.y === 0 ? p : { x: 0, y: 0 }));

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!canEdit || previewMode) return;
    const onKeyDown = (e) => {
      if (e.code !== "Space") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      setIsSpacePan(true);
    };
    const onKeyUp = (e) => { if (e.code === "Space") setIsSpacePan(false); };
    const onBlur = () => setIsSpacePan(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [canEdit, previewMode]);

  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const [, forceHistoryRender] = useState(0);

  const [, undoPosFormAction] = useActionState(updateElementPositionAction, undefined);
  const undoPosRef = useRef(null);
  const [, undoDupFormAction] = useActionState(duplicateElementAction, undefined);
  const undoDupRef = useRef(null);
  const [, undoDelFormAction] = useActionState(deleteElementAction, undefined);
  const undoDelRef = useRef(null);
  const [, undoZFormAction] = useActionState(changeZIndexAction, undefined);
  const undoZRef = useRef(null);

  const submitUndoPosition = (pageId, elId, x, y, w, h, r) => {
    const f = undoPosRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = pageId;
    f.elements.elementId.value = elId;
    f.elements.positionX.value = String(x);
    f.elements.positionY.value = String(y);
    f.elements.positionW.value = String(w);
    f.elements.positionH.value = String(h);
    f.elements.zIndex.value = "";
    f.elements.rotation.value = r != null ? String(r) : "";
    setTimeout(() => f.requestSubmit(), 0);
  };

  const submitUndoDuplicate = (pageId, sourceId) => {
    const f = undoDupRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = pageId;
    f.elements.albumId.value = album.id;
    f.elements.elementId.value = sourceId;
    setTimeout(() => f.requestSubmit(), 0);
  };

  const submitUndoDelete = (pageId, elId) => {
    const f = undoDelRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = pageId;
    f.elements.albumId.value = album.id;
    f.elements.elementId.value = elId;
    setTimeout(() => f.requestSubmit(), 0);
  };

  const submitUndoZIndex = (pageId, elId, direction) => {
    const f = undoZRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = pageId;
    f.elements.elementId.value = elId;
    f.elements.direction.value = direction;
    setTimeout(() => f.requestSubmit(), 0);
  };

  const pushHistory = (entry) => {
    undoStackRef.current = [...undoStackRef.current.slice(-49), entry];
    redoStackRef.current = [];
    forceHistoryRender((v) => v + 1);
  };

  const handleCommitPosition = ({ pageId, elementId, prev, next }) => {
    pushHistory({ type: "position", pageId, elementId, prev, next });
    triggerAutosave();
  };

  const handleDuplicated = ({ pageId, sourceId, newId }) => {
    pushHistory({ type: "duplicate", pageId, elementId: newId, sourceId });
    triggerAutosave();
  };

  const handleZIndexChange = ({ pageId, elementId, direction }) => {
    pushHistory({ type: "zindex", pageId, elementId, direction });
    triggerAutosave();
  };

  const applyHistoryEntry = (entry, direction) => {
    if (entry.type === "position") {
      const box = direction === "undo" ? entry.prev : entry.next;
      submitUndoPosition(entry.pageId, entry.elementId, box.x, box.y, box.w, box.h, box.r ?? box.rotation);
    } else if (entry.type === "duplicate") {
      if (direction === "undo") submitUndoDelete(entry.pageId, entry.elementId);
      else submitUndoDuplicate(entry.pageId, entry.sourceId);
    } else if (entry.type === "zindex") {
      const dir = direction === "undo" ? (entry.direction === "up" ? "down" : "up") : entry.direction;
      submitUndoZIndex(entry.pageId, entry.elementId, dir);
    }
  };

  const handleUndo = () => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const entry = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, entry];
    applyHistoryEntry(entry, "undo");
    forceHistoryRender((v) => v + 1);
  };

  const handleRedo = () => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const entry = stack[stack.length - 1];
    redoStackRef.current = stack.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, entry];
    applyHistoryEntry(entry, "redo");
    forceHistoryRender((v) => v + 1);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!canEdit || previewMode) return;
      const tag = document.activeElement?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
      if (isEditable) return;
      if (e.key === "Escape") {
        setActivePanel(null);
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) handleRedo(); else handleUndo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit, previewMode]);

  const pages = album.pages;
  const currentPage = pages[Math.min(pageIndex, pages.length - 1)];
  const currentLayout = currentPage ? LAYOUTS.find((l) => l.id === currentPage.layout_id) || LAYOUTS[0] : LAYOUTS[0];
  const styleElement = stylePopupId
    ? (currentPage?.elements || []).find((e) => e.id === stylePopupId) || null
    : null;

  const [addPageState, addPageFormAction, addPagePending] = useActionState(addAlbumPageAction, undefined);
  const [layoutState, layoutFormAction] = useActionState(changePageLayoutAction, undefined);
  const [templateState, templateFormAction, templatePending] = useActionState(applyPageTemplateAction, undefined);
  const [deletePageState, deletePageFormAction] = useActionState(deleteAlbumPageAction, undefined);
  const [deleteAlbumState, deleteAlbumFormAction, deleteAlbumPending] = useActionState(deleteAlbumAction, undefined);
  const [bgState, bgFormAction] = useActionState(changePageBackgroundAction, undefined);
  const [bgImageState, bgImageFormAction] = useActionState(updatePageBackgroundImageAction, undefined);
  const [stickerState, stickerFormAction, stickerPending] = useActionState(addStickerElementAction, undefined);
  const [addTextState, addTextFormAction, addTextPending] = useActionState(addTextElementAction, undefined);
  const [addPhotoState, addPhotoFormAction, addPhotoPending] = useActionState(addPhotoElementAction, undefined);
  const addTextRef = useRef(null);
  const addPhotoRef = useRef(null);
  const stickerFormRef = useRef(null);
  const [layerFormState, layerFormAction] = useActionState(changeZIndexAction, undefined);
  const layerFormRef = useRef(null);

  // Yuqoridagi PageCanvas'dagi izohdagi kabi: bu forma amallari (sahifa
  // qo'shish, layout, shablon, sahifa o'chirish, fon, fon rasmi, stiker,
  // matn/rasm qo'shish, qatlam) ham muvaffaqiyatli tugagach QO'LDA
  // router.refresh() qilinadi — aks holda o'zgarish faqat F5'dan keyin
  // ko'rinardi.
  useEffect(() => { if (addPageState?.ok) router.refresh(); }, [addPageState, router]);
  useEffect(() => { if (layoutState?.ok) router.refresh(); }, [layoutState, router]);
  useEffect(() => { if (templateState?.ok) router.refresh(); }, [templateState, router]);
  useEffect(() => { if (deletePageState?.ok) router.refresh(); }, [deletePageState, router]);
  useEffect(() => { if (bgState?.ok) router.refresh(); }, [bgState, router]);
  useEffect(() => { if (bgImageState?.ok) router.refresh(); }, [bgImageState, router]);
  useEffect(() => { if (stickerState?.ok) router.refresh(); }, [stickerState, router]);
  useEffect(() => { if (addTextState?.ok) router.refresh(); }, [addTextState, router]);
  useEffect(() => { if (addPhotoState?.ok) router.refresh(); }, [addPhotoState, router]);
  useEffect(() => { if (layerFormState?.ok) router.refresh(); }, [layerFormState, router]);

  const onQuickText = useCallback(() => {
    const f = addTextRef.current;
    if (!f || !currentPage) return;
    f.elements.familySlug.value = familySlug;
    f.elements.albumId.value = album.id;
    f.elements.pageId.value = currentPage.id;
    setTimeout(() => f.requestSubmit(), 0);
  }, [familySlug, album.id, currentPage?.id]);

  const onQuickPhoto = useCallback(() => {
    const f = addPhotoRef.current;
    if (!f || !currentPage) return;
    f.elements.familySlug.value = familySlug;
    f.elements.albumId.value = album.id;
    f.elements.pageId.value = currentPage.id;
    setTimeout(() => f.requestSubmit(), 0);
  }, [familySlug, album.id, currentPage?.id]);

  // ── Chap sidebar'dagi Shablon/Layout/Stiker... asboblarini global Sidebar'ga
  // "ro'yxatdan o'tkazish" — Sidebar HeirloomApp darajasida joylashgani uchun
  // AlbumEditor o'z holatini (activePanel va h.k.) yuqoriga uzatadi.
  useEffect(() => {
    onToolbarChange?.({
      canEdit: effectiveCanEdit,
      activePanel,
      setActivePanel,
      onQuickText,
      onQuickPhoto,
      onBackToAlbums: onBack,
    });
  }, [effectiveCanEdit, activePanel, onQuickText, onQuickPhoto, onBack, onToolbarChange]);

  useEffect(() => {
    return () => { onToolbarChange?.(null); };
  }, [onToolbarChange]);

  const layerPage = currentPage;
  const layerElements = [...(layerPage?.elements || [])].sort((a, b) => (b.z_index || 0) - (a.z_index || 0));

  // ── Canva-style editable album title + Share ──
  const [titleDraft, setTitleDraft] = useState(album.title);
  const [titleSaving, setTitleSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const titleSaveTimerRef = useRef(null);
  const lastSavedTitleRef = useRef(album.title);

  useEffect(() => { setTitleDraft(album.title); }, [album.title]);
  useEffect(() => () => { if (titleSaveTimerRef.current) clearTimeout(titleSaveTimerRef.current); }, []);

  const handleTitleSave = useCallback(async (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed || trimmed === lastSavedTitleRef.current) return;
    setTitleSaving(true);
    try {
      const fd = new FormData();
      fd.append("familySlug", familySlug);
      fd.append("albumId", album.id);
      fd.append("title", trimmed);
      const res = await renameAlbumAction(null, fd);
      if (res && "error" in res && res.error) {
        console.error("Albom nomini saqlashda xatolik:", res.error);
      } else {
        lastSavedTitleRef.current = trimmed;
        router.refresh();
      }
    } catch (err) {
      console.error("Albom nomini saqlashda xatolik:", err);
    }
    setTitleSaving(false);
  }, [familySlug, album.id]);

  const handleTitleInputChange = (e) => {
    setTitleDraft(e.target.value);
    if (titleSaveTimerRef.current) clearTimeout(titleSaveTimerRef.current);
    titleSaveTimerRef.current = setTimeout(() => handleTitleSave(e.target.value), 900);
  };

  const handleTitleCommit = () => {
    if (titleSaveTimerRef.current) clearTimeout(titleSaveTimerRef.current);
    handleTitleSave(titleDraft);
  };

  const handleDropPhoto = async (url, x, y) => {
    const dropTargetPage = currentPage;
    if (!canEdit || previewMode || !dropTargetPage || !url) return;
    try {
      const fd = new FormData();
      fd.append("familySlug", familySlug);
      fd.append("albumId", album.id);
      fd.append("pageId", dropTargetPage.id);
      fd.append("photoUrl", url);
      fd.append("positionX", String(x));
      fd.append("positionY", String(y));
      fd.append("positionW", "40");
      fd.append("positionH", "30");
      const res = await addPhotoWithUrlAction(null, fd);
      if (res?.error) console.error(res.error);
      // Mavjud bo'sh slotga tushirilganda (handleCanvasDrop'dagi targetSlot
      // shoxobchasi) router.refresh() chaqiriladi, lekin bo'sh fon ustiga
      // tashlab YANGI suzuvchi element yaratilganda bu yerda refresh
      // chaqirilmagan edi — server rasmni saqlagan bo'lsa ham, mijozning
      // ekrani yangilanmasdi ("rasm tushmayapti" effekti). Endi shu yerda
      // ham chaqiriladi.
      else router.refresh();
    } catch (err) {
      console.error("Rasm qo'shishda xato:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#EDEAE4" }}>
      {/* ── Canva-style top toolbar ── */}
      <div ref={topToolbarRef} style={{ position: "sticky", top: 0, zIndex: 60, display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "#fff", borderBottom: "1px solid #DFDBD2", boxShadow: "0 1px 4px rgba(30,26,15,0.06)", flexWrap: "wrap" }}>
        <button onClick={onBack} title="Albomlarga qaytish" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "transparent", border: "none", borderRadius: 8, color: TOKENS.ink60, cursor: "pointer" }}>
          <ChevronLeft size={18} />
        </button>

        {canEdit && !previewMode ? (
          <input value={titleDraft} onChange={handleTitleInputChange} onBlur={handleTitleCommit} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} title="Albom nomini tahrirlash" aria-label="Albom nomi" style={{ fontSize: 15, fontWeight: 600, color: TOKENS.ink, background: "transparent", border: "none", borderBottom: "1px dashed " + (titleSaving ? TOKENS.gold : "rgba(30,26,15,0.3)"), outline: "none", padding: "6px 2px", width: 300, maxWidth: "38vw" }} />
        ) : (
          <span style={{ fontSize: 15, fontWeight: 600, color: TOKENS.ink, maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album.title}</span>
        )}

        <span style={{ fontSize: 11.5, color: TOKENS.ink40, whiteSpace: "nowrap" }}>{[album.date_label, album.location].filter(Boolean).join(" · ") || "Oilaviy albom"}</span>

        <span style={{ fontSize: 11.5, color: (saveStatus === "saving" || titleSaving) ? TOKENS.gold : TOKENS.teal, whiteSpace: "nowrap" }}>{(saveStatus === "saving" || titleSaving) ? "💾 Saqlanmoqda..." : "✅ Saqlandi"}</span>

        <div style={{ flex: 1 }} />

        {!previewMode && canEdit && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#F4F2ED", borderRadius: 8, padding: 3 }}>
            <button type="button" onClick={handleUndo} disabled={undoStackRef.current.length === 0} title="Bekor qilish (Ctrl+Z)" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 28, background: "transparent", border: "none", borderRadius: 6, color: undoStackRef.current.length === 0 ? "#C9C4BA" : TOKENS.ink, cursor: undoStackRef.current.length === 0 ? "default" : "pointer" }}><Undo2 size={15} /></button>
            <button type="button" onClick={handleRedo} disabled={redoStackRef.current.length === 0} title="Qaytarish (Ctrl+Shift+Z)" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 28, background: "transparent", border: "none", borderRadius: 6, color: redoStackRef.current.length === 0 ? "#C9C4BA" : TOKENS.ink, cursor: redoStackRef.current.length === 0 ? "default" : "pointer" }}><Redo2 size={15} /></button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#F4F2ED", borderRadius: 8, padding: 3 }}>
          <button type="button" onClick={zoomOut} disabled={zoom <= ZOOM_MIN} title="Kichraytirish" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, background: "transparent", border: "none", borderRadius: 5, color: zoom <= ZOOM_MIN ? "#C9C4BA" : TOKENS.ink60, cursor: zoom <= ZOOM_MIN ? "default" : "pointer", fontSize: 15, lineHeight: 1 }}>−</button>
          <button type="button" onClick={zoomFit} title="Ekranga moslash" style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink60, background: "transparent", border: "none", cursor: "pointer", padding: "0 8px", minWidth: 44, textAlign: "center" }}>{Math.round(zoom * 100)}%</button>
          <button type="button" onClick={zoomIn} disabled={zoom >= ZOOM_MAX} title="Kattalashtirish" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, background: "transparent", border: "none", borderRadius: 5, color: zoom >= ZOOM_MAX ? "#C9C4BA" : TOKENS.ink60, cursor: zoom >= ZOOM_MAX ? "default" : "pointer", fontSize: 15, lineHeight: 1 }}>+</button>
        </div>

        <button type="button" onClick={toggleFullscreen} title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran (F11)"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 32, background: "transparent", border: "none", borderRadius: 8, color: TOKENS.ink60, cursor: "pointer" }}>
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

      <button onClick={() => { setPreviewMode((v) => !v); setActivePanel(null); }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: previewMode ? "#fff" : TOKENS.ink, background: previewMode ? TOKENS.gold : "#F4F2ED", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
          {previewMode ? <><X size={13} /> Tahrirlash</> : "Ko'rish"}
        </button>

        <div style={{ position: "relative" }}>
          <button onClick={() => { setShareOpen((v) => !v); setShareCopied(false); }} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "#fff", background: "#2B5CFF", border: "none", borderRadius: 8, padding: "8px 15px", cursor: "pointer", boxShadow: "0 1px 8px rgba(43,92,255,0.35)" }}>
            <Share2 size={14} /> Ulashish
          </button>
          {shareOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, zIndex: 70, background: "#fff", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, boxShadow: "0 12px 28px rgba(30,26,15,0.25)", padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TOKENS.ink, marginBottom: 6 }}>Albom havolasi</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input readOnly value={typeof window !== "undefined" ? `${window.location.origin}/${familySlug}/dashboard?view=albums&album=${album.id}` : ""} style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: TOKENS.ink60, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "7px 8px", background: "#F7F5F0" }} />
                <button onClick={() => { const url = `${window.location.origin}/${familySlug}/dashboard?view=albums&album=${album.id}`; navigator.clipboard?.writeText(url).then(() => setShareCopied(true)).catch(() => setShareCopied(true)); }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#fff", background: "#2B5CFF", border: "none", borderRadius: 6, padding: "0 12px", cursor: "pointer", whiteSpace: "nowrap" }}><Link2 size={14} /> Nusxalash</button>
              </div>
              <div style={{ fontSize: 10.5, color: shareCopied ? TOKENS.teal : TOKENS.ink40, marginTop: 7 }}>{shareCopied ? "✅ Havola nusxalandi!" : "Bu havola oila a'zolaringizga albomni ochish uchun (tizimga kirish talab qilinadi)."}</div>
              <button onClick={() => setShareOpen(false)} style={{ position: "absolute", top: 6, right: 6, background: "transparent", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={14} /></button>
            </div>
          )}
        </div>

        <ExportMenu album={album} exporting={exporting} setExporting={setExporting} exportError={exportError} setExportError={setExportError} pageNodeRef={pageNodeRef} previewMode={previewMode} setPreviewMode={setPreviewMode} activePanel={activePanel} setActivePanel={setActivePanel} pages={pages} pageIndex={pageIndex} setPageIndex={setPageIndex} />

        {canEdit && (
          !confirmDeleteAlbum ? (
            <button onClick={() => setConfirmDeleteAlbum(true)} title="Albomni o'chirish" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: TOKENS.danger, background: "transparent", border: `1px solid ${TOKENS.danger}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
              <Trash2 size={14} /> O'chirish
            </button>
          ) : (
            <form action={deleteAlbumFormAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="hidden" name="familySlug" value={familySlug} />
              <input type="hidden" name="albumId" value={album.id} />
              <span style={{ fontSize: 11.5, color: TOKENS.danger }}>Rostdan ham?</span>
              <button type="submit" disabled={deleteAlbumPending} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: TOKENS.danger, border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>Ha</button>
              <button type="button" onClick={() => setConfirmDeleteAlbum(false)} style={{ fontSize: 12, fontWeight: 600, color: TOKENS.ink60, background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>Bekor</button>
            </form>
          )
        )}
      </div>
      {exportError && <div style={{ fontSize: 11.5, color: "#C0392B", background: "#fff1f0", padding: "7px 16px", textAlign: "right" }}>{exportError}</div>}

      <div style={{ flex: 1, minHeight: 0 }}>

      {pages.length === 0 || !currentPage ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: TOKENS.ink60, fontSize: 13.5 }}>Bu albomda hali sahifa yo'q.</div>
      ) : (
        (() => {
          const targetPage = currentPage;
  const allPhotos = (photos && photos.length > 0)
    ? photos.map((p) => ({ id: p.id, url: p.photo_url || "" }))
    : (pages || []).flatMap((p) =>
        (p.elements || []).filter((e) => e.type === "photo" && e.photo_url).map((e) => ({ id: e.id, url: e.photo_url }))
      );
          const targetLayout = currentLayout;

          return (
            <div style={{ background: "#EDEAE4", borderRadius: 0, padding: "24px 28px 36px" }}>
              <div ref={pageNavRowRef} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, padding: "0 4px" }}>
                <button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0} style={{ background: "none", border: "none", cursor: pageIndex === 0 ? "default" : "pointer", color: TOKENS.ink60, opacity: pageIndex === 0 ? 0.35 : 0.9 }}><ChevronLeft size={20} /></button>
                <span style={{ fontSize: 12.5, color: TOKENS.ink60, fontWeight: 500 }}>Sahifa {pageIndex + 1} / {pages.length}</span>
                <button onClick={() => setPageIndex(Math.min(pages.length - 1, pageIndex + 1))} disabled={pageIndex + 1 >= pages.length} style={{ background: "none", border: "none", cursor: pageIndex + 1 >= pages.length ? "default" : "pointer", color: TOKENS.ink60, opacity: pageIndex + 1 >= pages.length ? 0.35 : 0.9 }}><ChevronRight size={20} /></button>
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
              <form ref={stickerFormRef} action={stickerFormAction} style={{ display: "none" }}>
                <input type="hidden" name="familySlug" />
                <input type="hidden" name="albumId" />
                <input type="hidden" name="pageId" />
                <input type="hidden" name="stickerId" />
              </form>
              <form ref={undoPosRef} action={undoPosFormAction} style={{ display: "none" }}>
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
              <form ref={undoDupRef} action={undoDupFormAction} style={{ display: "none" }}>
                <input type="hidden" name="familySlug" />
                <input type="hidden" name="pageId" />
                <input type="hidden" name="albumId" />
                <input type="hidden" name="elementId" />
              </form>
              <form ref={undoDelRef} action={undoDelFormAction} style={{ display: "none" }}>
                <input type="hidden" name="familySlug" />
                <input type="hidden" name="pageId" />
                <input type="hidden" name="albumId" />
                <input type="hidden" name="elementId" />
              </form>
              <form ref={undoZRef} action={undoZFormAction} style={{ display: "none" }}>
                <input type="hidden" name="familySlug" />
                <input type="hidden" name="pageId" />
                <input type="hidden" name="elementId" />
                <input type="hidden" name="direction" />
              </form>
              <form ref={layerFormRef} action={layerFormAction} style={{ display: "none" }}>
                <input type="hidden" name="familySlug" />
                <input type="hidden" name="pageId" />
                <input type="hidden" name="elementId" />
                <input type="hidden" name="direction" />
              </form>

              {addTextState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{addTextState.error}</div>}
              {addPhotoState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 10, background: "#fff1f0", padding: "6px 10px", borderRadius: 6 }}>{addPhotoState.error}</div>}

              <div ref={canvasAreaRef} style={{ position: "relative", display: "flex", gap: 12, alignItems: "stretch", overflowX: zoom > 1 ? "auto" : "visible" }}>
                {effectiveCanEdit && (
                  <div className="fm-album-rail-inline" style={{ display: "flex", flexShrink: 0, width: 58, flexDirection: "column", background: "#F4F2ED", borderRadius: 10, overflow: "hidden", paddingBottom: 4, boxShadow: "inset 0 0 0 1px rgba(30,26,15,0.05)" }}>
                    <RailButton icon={Sparkles} label="Shablon" active={activePanel === "template"} onClick={() => setActivePanel((p) => (p === "template" ? null : "template"))} />
                    <RailButton icon={LayoutGrid} label="Layout" active={activePanel === "layout"} onClick={() => setActivePanel((p) => (p === "layout" ? null : "layout"))} />
                    <RailButton icon={StickerIcon} label="Stiker" active={activePanel === "sticker"} onClick={() => setActivePanel((p) => (p === "sticker" ? null : "sticker"))} />
                    <RailButton icon={Palette} label="Fon" active={activePanel === "bg"} onClick={() => setActivePanel((p) => (p === "bg" ? null : "bg"))} />
                    <RailButton icon={ImagePlus} label="Fon rasmi" active={activePanel === "bgImage"} onClick={() => setActivePanel((p) => (p === "bgImage" ? null : "bgImage"))} />
                    <RailButton icon={Images} label="Rasmlar" active={activePanel === "photos"} onClick={() => setActivePanel((p) => (p === "photos" ? null : "photos"))} />
                    <RailButton icon={Shapes} label="Elementlar" active={activePanel === "elements"} onClick={() => setActivePanel((p) => (p === "elements" ? null : "elements"))} />
                    <RailButton icon={Layers} label="Qatlamlar" active={activePanel === "layers"} onClick={() => setActivePanel((p) => (p === "layers" ? null : "layers"))} />
                    <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 10px" }} />
                    <RailButton icon={Type} label="Matn" onClick={onQuickText} />
                    <RailButton icon={ImagePlus} label="Rasm" onClick={onQuickPhoto} />
                  </div>
                )}

                {effectiveCanEdit && activePanel && (
                  <div
                    className="fm-flyout-panel fm-album-flyout"
                    style={{
                      zIndex: 90,
                      width: 272,
                      background: TOKENS.card,
                      borderLeft: `1px solid ${TOKENS.parchmentDeep}`,
                      borderRight: `1px solid ${TOKENS.parchmentDeep}`,
                      padding: "38px 12px 12px",
                      overflowY: "auto",
                      boxShadow: "10px 0 26px rgba(30,26,15,0.14)",
                      // CSS media-query'ga tayanish o'rniga aniq JS-hisoblangan
                      // pozitsiya: desktopda global Sidebar yonidan (220px)
                      // top toolbar tagidan boshlab butun balandlikka fixed
                      // qilib chiqadi, canvas ustida to'liq ko'rinadi.
                      ...(flyoutMetrics.isDesktop
                        ? { position: "fixed", left: 220, top: flyoutMetrics.topOffset, bottom: 0 }
                        : {}),
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      title="Panelni yopish"
                      style={{ position: "absolute", top: 10, right: 10, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, background: "rgba(30,26,15,0.06)", border: "none", borderRadius: 6, color: TOKENS.ink60, cursor: "pointer" }}
                    >
                      <X size={15} />
                    </button>
                    {activePanel === "template" && (
                      <div>
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>Shablon sahifaga qo'llanadi — mavjud elementlar shablon bilan almashtiriladi.</div>
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
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>Sahifa uchun joylashuv.</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                          {LAYOUTS.map((l) => (
                            <form key={l.id} action={layoutFormAction} onSubmit={() => setActivePanel(null)}>
                              <input type="hidden" name="familySlug" value={familySlug} />
                              <input type="hidden" name="albumId" value={album.id} />
                              <input type="hidden" name="pageId" value={targetPage.id} />
                              <input type="hidden" name="layoutId" value={l.id} />
                              <button type="submit" style={{ width: "100%", cursor: "pointer", border: targetLayout.id === l.id ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: 8, background: "#fff" }}>
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
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>Sahifaga qo'shiladi, keyin sudrab joylashtiring.</div>
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
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>Sahifaning foniga qo'llanadi.</div>
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

                    {activePanel === "bgImage" && (
                      <div>
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>
                          Sahifaga fon rasmi qo'shing.
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            // Rasmni yuklash va saqlash
                            const blob = await upload(file.name, file, {
                              access: "public",
                              handleUploadUrl: "/api/blob-upload",
                              clientPayload: JSON.stringify({ familySlug }),
                            });
                            const fd = new FormData();
                            fd.append("familySlug", familySlug);
                            fd.append("pageId", targetPage.id);
                            fd.append("imageUrl", blob.url);
                            bgImageFormAction(fd);
                            e.target.value = "";
                          }}
                          style={{ width: "100%", padding: 8, borderRadius: 4, border: `1px solid ${TOKENS.parchmentDeep}` }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            // Fon rasmini olib tashlash
                            const fd = new FormData();
                            fd.append("familySlug", familySlug);
                            fd.append("pageId", targetPage.id);
                            fd.append("imageUrl", "");
                            bgImageFormAction(fd);
                          }}
                          style={{ marginTop: 8, width: "100%", padding: 8, borderRadius: 4, border: `1px solid ${TOKENS.danger}`, color: TOKENS.danger, background: "transparent", cursor: "pointer" }}
                        >
                          Fon rasmini olib tashlash
                        </button>
                        {bgImageState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginTop: 8 }}>{bgImageState.error}</div>}
                      </div>
                    )}

                    {activePanel === "photos" && (
                      <div>
                        <PhotosPanel
                          familySlug={familySlug}
                          photos={allPhotos}
                          uploadedPhotos={sessionUploads}
                          onUploaded={(list) => setSessionUploads(list)}
                          onDragStart={() => {}}
                          onAddPhoto={() => {}}
                        />
                      </div>
                    )}

                    {activePanel === "elements" && (
                      <div>
                        <ElementsPanel
                          onAddElement={(el) => {
                            const stickerId = DECORATIVE_TO_STICKER_ID[el.id] || el.id;
                            const f = stickerFormRef.current;
                            if (!f) return;
                            f.elements.familySlug.value = familySlug;
                            f.elements.albumId.value = album.id;
                            f.elements.pageId.value = targetPage.id;
                            f.elements.stickerId.value = stickerId;
                            setTimeout(() => f.requestSubmit(), 0);
                          }}
                        />
                      </div>
                    )}

                    {activePanel === "layers" && (
                      <div>
                        <div style={{ fontSize: 10.5, color: TOKENS.ink40, marginBottom: 10 }}>
                          Qatlamlar sahifa uchun — tepadagilari oldinda. Qatlamga bosing, berilgan tugmalar bilan tartiblang.
                        </div>
                        {layerElements.length === 0 ? (
                          <div style={{ fontSize: 11, color: TOKENS.ink40, padding: "10px 0" }}>Hozircha elementlar mavjud emas.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {layerElements.map((el, i) => (
                              <div
                                key={el.id}
                                onPointerDown={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6, padding: "5px 6px",
                                  borderRadius: 6, background: selectedElementId === el.id ? `${TOKENS.gold}22` : "#FBF9F4",
                                  border: `1px solid ${selectedElementId === el.id ? TOKENS.gold : TOKENS.parchmentDeep}`, cursor: "pointer",
                                }}
                              >
                                <span style={{ width: 16, textAlign: "center", fontSize: 9.5, color: TOKENS.ink40 }}>{i + 1}</span>
                                <span style={{ fontSize: 11.5, color: TOKENS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textTransform: "capitalize" }}>
                                  {el.type === "photo" ? "📷 Rasm" : el.type === "text" ? "✏️ Matn" : el.type === "sticker" ? "🏷 Stiker" : (el.type || "element")}
                                </span>
                                <button type="button" title="Oldinga chiqarish" onClick={(e) => { e.stopPropagation(); const f = layerFormRef.current; if (!f) return; f.elements.familySlug.value = familySlug; f.elements.pageId.value = layerPage.id; f.elements.elementId.value = el.id; f.elements.direction.value = "up"; setTimeout(() => f.requestSubmit(), 0); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 4, border: "none", background: "transparent", color: TOKENS.ink60, cursor: "pointer" }}><ChevronUp size={13} /></button>
                                <button type="button" title="Orqaga yuborish" onClick={(e) => { e.stopPropagation(); const f = layerFormRef.current; if (!f) return; f.elements.familySlug.value = familySlug; f.elements.pageId.value = layerPage.id; f.elements.elementId.value = el.id; f.elements.direction.value = "down"; setTimeout(() => f.requestSubmit(), 0); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 4, border: "none", background: "transparent", color: TOKENS.ink60, cursor: "pointer" }}><ChevronDown size={13} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        {layerFormState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginTop: 8 }}>{layerFormState.error}</div>}
                      </div>
                    )}
                  </div>
                )}

                {styleElement && (
                  <div
                    style={{ position: "absolute", top: 12, right: 12, zIndex: 80, boxShadow: "0 14px 34px rgba(30,26,15,0.22)", borderRadius: 10 }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {styleElement.type === "text" ? (
                      <TextStylePanel element={styleElement} familySlug={familySlug} updateElementTextStyleAction={updateElementTextStyleAction} onClose={() => setStylePopupId(null)} />
                    ) : styleElement.type === "photo" ? (
                      <PhotoStylePanel element={styleElement} familySlug={familySlug} albumId={album.id} updateElementFrameAction={updateElementFrameAction} onClose={() => setStylePopupId(null)} />
                    ) : (
                      <StickerStylePanel element={styleElement} familySlug={familySlug} updateElementStickerColorAction={updateElementStickerColorAction} onClose={() => setStylePopupId(null)} />
                    )}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }} onPointerDownCapture={() => { setActivePanel(null); if (stylePopupId) setStylePopupId(null); }}>
                  <div
                    ref={sceneRef}
                    onPointerDownCapture={(e) => {
                      if (!isSpacePan) return;
                      e.stopPropagation();
                      panAnchorRef.current = { x: e.clientX, y: e.clientY, start: { ...pan } };
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                      e.preventDefault();
                    }}
                    onPointerMove={(e) => {
                      const a = panAnchorRef.current;
                      if (!a) return;
                      setPan({ x: a.start.x + (e.clientX - a.x), y: a.start.y + (e.clientY - a.y) });
                    }}
                    onPointerUp={() => { panAnchorRef.current = null; }}
                    onPointerCancel={() => { panAnchorRef.current = null; }}
                    style={{ display: "flex", borderRadius: 6, overflow: "hidden", boxShadow: "0 2px 10px rgba(30,26,15,0.22)", position: "relative", width: fitWidth ? `${fitWidth * zoom}px` : `${zoom * 100}%`, margin: "0 auto", transition: "width 0.15s ease", touchAction: "none", cursor: isSpacePan ? "grab" : "default", transform: pan.x || pan.y ? `translate(${pan.x}px, ${pan.y}px)` : undefined }}
                  >
                    <div ref={pageNodeRef} style={{ flex: 1, position: "relative" }}>
                      <PageCanvas
                        page={currentPage}
                        layout={currentLayout}
                        familySlug={familySlug}
                        albumId={album.id}
                        canEdit={effectiveCanEdit}
                        saveElementPhotoUrlAction={saveElementPhotoUrlAction}
                        updateElementTextAction={updateElementTextAction}
                        deleteElementAction={deleteElementAction}
                        updateElementPositionAction={updateElementPositionAction}
                        changeZIndexAction={changeZIndexAction}
                        duplicateElementAction={duplicateElementAction}
                        updateElementFrameAction={updateElementFrameAction}
                        updateElementTextStyleAction={updateElementTextStyleAction}
                        updateElementStickerColorAction={updateElementStickerColorAction}
                        backgroundId={currentPage.background_id || "paper"}
                        backgroundImageUrl={currentPage.background_image_url || null}
                        onDropPhoto={handleDropPhoto}
                        onCommitPosition={handleCommitPosition}
                        onDuplicated={handleDuplicated}
                        onZIndexChange={handleZIndexChange}
                        onElementSelect={setSelectedElementId}
                        onStyleElement={setStylePopupId}
                        groupElementsAction={groupElementsAction}
                        ungroupElementsAction={ungroupElementsAction}
                        updateElementCropAction={updateElementCropAction}
                        selectedId={selectedElementId}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {effectiveCanEdit && (
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <form action={deletePageFormAction} style={{ display: "inline" }}>
                    <input type="hidden" name="familySlug" value={familySlug} />
                    <input type="hidden" name="albumId" value={album.id} />
                    <input type="hidden" name="pageId" value={targetPage.id} />
                    <button type="submit" disabled={pages.length <= 1} style={{ fontSize: 11.5, color: pages.length <= 1 ? TOKENS.ink40 : TOKENS.danger, background: "none", border: "none", cursor: pages.length <= 1 ? "default" : "pointer" }}>
                      Sahifani o'chirish
                    </button>
                  </form>
                </div>
              )}
              {deletePageState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, textAlign: "center", marginTop: 6 }}>{deletePageState.error}</div>}

              {/* Thumbnail filmstrip */}
              <div style={{ display: "flex", gap: 10, overflowX: "auto", marginTop: 22, paddingTop: 4, paddingBottom: 2 }}>
                {pages.map((p, i) => {
                  const firstPhoto = p.elements.find((e) => e.type === "photo" && e.photo_url);
                  const isActive = i === pageIndex;
                  const isDragging = draggedPageIndex === i;
                  
                  return (
                    <div
                      key={p.id}
                      draggable={effectiveCanEdit}
                      onDragStart={() => effectiveCanEdit && setDraggedPageIndex(i)}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!effectiveCanEdit || draggedPageIndex === null || draggedPageIndex === i) return;
                        const newPages = [...pages];
                        const [dragged] = newPages.splice(draggedPageIndex, 1);
                        newPages.splice(i, 0, dragged);
                        const pageIds = newPages.map(p => p.id).join(",");
                        const fd = new FormData();
                        fd.append("familySlug", familySlug);
                        fd.append("albumId", album.id);
                        fd.append("pageIds", pageIds);
                        reorderAlbumPagesAction(undefined, fd);
                        setDraggedPageIndex(null);
                      }}
                      style={{
                        width: 72,
                        aspectRatio: "4/3",
                        flexShrink: 0,
                        borderRadius: 4,
                        background: "#fff",
                        border: isActive ? `2px solid ${TOKENS.gold}` : "1px solid rgba(30,26,19,0.18)",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: isActive ? `0 0 0 2px rgba(184,134,59,0.25)` : "none",
                        opacity: isDragging ? 0.4 : 1,
                        transform: isDragging ? "scale(0.9)" : "scale(1)",
                        transition: "opacity 0.2s, transform 0.2s",
                      }}
                      onClick={() => setPageIndex(i)}
                      title={`Sahifa ${i + 1}`}
                    >
                      {firstPhoto ? (
                        <div style={{ position: "absolute", inset: 3, backgroundImage: `url(${firstPhoto.photo_url})`, backgroundSize: "cover", borderRadius: 2 }} />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, background: TOKENS.parchment }} />
                      )}
                      <div style={{ position: "absolute", bottom: 2, right: 3, fontSize: 8.5, color: "#fff", background: "rgba(0,0,0,0.5)", borderRadius: 3, padding: "0 3px" }}>{i + 1}</div>
                      
                      {effectiveCanEdit && (
                        <div style={{ position: "absolute", top: 2, right: 2, display: "flex", gap: 2 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const fd = new FormData();
                              fd.append("familySlug", familySlug);
                              fd.append("albumId", album.id);
                              fd.append("pageId", p.id);
                              duplicateAlbumPageAction(undefined, fd);
                            }}
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: "rgba(0,0,0,0.6)",
                              border: "none",
                              color: "#fff",
                              cursor: "pointer",
                              fontSize: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title="Nusxalash"
                          >
                            📋
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {effectiveCanEdit && (
                  <form action={addPageFormAction}>
                    <input type="hidden" name="familySlug" value={familySlug} />
                    <input type="hidden" name="albumId" value={album.id} />
                    <button type="submit" disabled={addPagePending} style={{ width: 72, aspectRatio: "4/3", flexShrink: 0, borderRadius: 4, border: "1.5px dashed rgba(30,26,19,0.3)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.ink40, cursor: addPagePending ? "default" : "pointer" }}>
                      <Plus size={16} />
                    </button>
                  </form>
                )}
              </div>
              {addPageState?.error && <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 8 }}>{addPageState.error}</div>}
            </div>
          );
        })()
      )}
        </div>
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
  reorderAlbumPagesAction,
  duplicateAlbumPageAction,
  groupElementsAction,
  ungroupElementsAction,
  updateElementCropAction,
  photos,
  onToolbarChange,
}) {
  const openAlbum = albums.find((a) => a.id === openAlbumId) || null;

  return (
    <div className="fm-fade" style={{ height: "100%", overflow: "auto" }}>
      {openAlbum ? (
        <AlbumEditor
          album={openAlbum}
          onBack={() => setOpenAlbumId(null)}
          familySlug={familySlug}
          canEdit={canEdit}
          photos={photos}
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
          reorderAlbumPagesAction={reorderAlbumPagesAction}
          duplicateAlbumPageAction={duplicateAlbumPageAction}
          groupElementsAction={groupElementsAction}
          ungroupElementsAction={ungroupElementsAction}
          updateElementCropAction={updateElementCropAction}
          onToolbarChange={onToolbarChange}
        />
      ) : (
        <AlbumGrid albums={albums} onOpen={(a) => setOpenAlbumId(a.id)} canEdit={canEdit} createAlbumAction={createAlbumAction} familySlug={familySlug} />
      )}
    </div>
  );
}
