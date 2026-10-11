// ============================================================
// Shablonlar katalogi
// Koordinatalar foizda: x/w — sahifa kengligiga, y/h — balandligiga nisbatan.
// Stikerlarda h berilmasa, stikerning o'z nisbatidan hisoblanadi.
// Shablon faqat BOSHLANG'ICH NUQTA — qo'llangandan keyin hamma narsa erkin.
// ============================================================
import { PAGE_W, PAGE_H } from "./constants";
import { uid } from "./model";
import { stickerDef } from "./stickers";

export const TEMPLATE_CATEGORIES = [
  "Minimal", "Sayohat", "Oila", "Tug'ilgan kun", "To'y", "Bolalik",
  "Tabiat", "Xotiralar", "Romantik", "Bayram", "Oddiy", "Kollaj",
];

const P = (x, y, w, h, extra = {}) => ({ type: "photo", x, y, w, h, ...extra });
const T = (x, y, w, text, extra = {}) => ({ type: "text", x, y, w, text, ...extra });
const S = (id, x, y, w, extra = {}) => ({ type: "sticker", id, x, y, w, ...extra });

export const TEMPLATES = [
  // ── Minimal ──────────────────────────────────────────────
  {
    id: "min-gallery", name: "Galereya", category: "Minimal", background: "solid:#FBF8F0",
    elements: [
      P(14, 10, 72, 66, { frame: "minimal" }),
      T(14, 81, 72, "Bir lahza", { font: "cormorant", size: 46, align: "center", italic: true, color: "#3B3A36" }),
    ],
  },
  {
    id: "min-split", name: "Ikki ustun", category: "Minimal", background: "solid:#FFFFFF",
    elements: [
      P(0, 0, 50, 100, { frame: "none" }),
      T(56, 34, 38, "Sarlavha", { font: "playfair", size: 64, color: "#1E2621" }),
      T(56, 52, 36, "Bu kun haqida bir necha so'z yozing. Kim bor edi, nima his qildingiz?", { font: "sans", size: 24, color: "#6B645A", lineHeight: 1.55 }),
    ],
  },
  {
    id: "min-trio", name: "Uchlik", category: "Minimal", background: "solid:#F2EDE2",
    elements: [
      P(6, 18, 27, 52, { frame: "none" }), P(36.5, 18, 27, 52, { frame: "none" }), P(67, 18, 27, 52, { frame: "none" }),
      T(6, 78, 88, "— kichik narsalar, katta xotiralar —", { font: "cormorant", size: 34, align: "center", italic: true, color: "#6B645A" }),
    ],
  },

  // ── Sayohat ──────────────────────────────────────────────
  {
    id: "travel-journal", name: "Sayohat kundaligi", category: "Sayohat", background: "tex:kraft",
    elements: [
      S("paper-note", 58, 8, 36, { h: 62, rot: 3 }),
      P(5, 7, 50, 56, { frame: "polaroid", rot: -4 }),
      P(10, 60, 30, 34, { frame: "polaroid", rot: 6 }),
      S("tape-stripe", 20, 3, 18, { rot: -6 }),
      S("tape-clear", 15, 57, 14, { rot: 8 }),
      T(62, 16, 30, "Sayohatimiz", { font: "handwriting", size: 64, color: "#2F4C48" }),
      T(62, 30, 29, "Birinchi kun. Yo'lda...", { font: "patrick", size: 28, color: "#3B3A36", lineHeight: 1.6 }),
      S("stamp", 80, 72, 12, { rot: 8 }),
      S("plane", 46, 78, 8, { color: "#3E5C76", rot: -12 }),
    ],
  },
  {
    id: "travel-postcard", name: "Otkritka", category: "Sayohat", background: "tex:vintage",
    elements: [
      P(5, 8, 58, 84, { frame: "paper", rot: -2 }),
      T(67, 12, 28, "Salom,", { font: "dancing", size: 56, color: "#A8453A" }),
      T(67, 26, 28, "bu yerdan sizga eng iliq tilaklar!", { font: "handwriting", size: 34, color: "#3B3A36" }),
      S("stamp", 80, 56, 14, { rot: 5 }),
      S("seal", 68, 74, 10, { rot: -10 }),
      S("doodle-underline", 67, 22, 18),
    ],
  },
  {
    id: "travel-map", name: "Yo'l xaritasi", category: "Sayohat", background: "tex:grid",
    elements: [
      P(4, 6, 40, 46, { frame: "tape", rot: -5 }),
      P(52, 12, 42, 40, { frame: "tape", rot: 4 }),
      P(22, 54, 40, 40, { frame: "tape", rot: -2 }),
      S("arrow-curve", 40, 40, 14, { rot: 15 }),
      S("map-pin", 70, 62, 7, { color: "#A8453A" }),
      T(66, 74, 30, "Samarqand → Buxoro", { font: "typewriter", size: 28, color: "#3B3A36" }),
    ],
  },
  {
    id: "travel-ticket", name: "Chipta", category: "Sayohat", background: "grad:sea",
    elements: [
      P(8, 8, 84, 58, { frame: "rounded" }),
      S("paper-ticket", 24, 68, 52, { h: 24, rot: -2 }),
      T(28, 74, 34, "Yo'nalish: Dengiz", { font: "typewriter", size: 30, color: "#FFFFFF" }),
      S("anchor", 82, 72, 7, { color: "#FFFFFF" }),
    ],
  },

  // ── Oila ─────────────────────────────────────────────────
  {
    id: "family-portrait", name: "Oila surati", category: "Oila", background: "paper",
    elements: [
      P(8, 6, 84, 64, { frame: "polaroid", rot: -1.5 }),
      S("tape-gold", 40, 2, 20, { rot: -3 }),
      T(8, 76, 84, "Bizning oilamiz", { font: "serif", size: 54, align: "center", color: "#2F4C48" }),
      S("leaf-sprig", 2, 80, 14, { rot: -10 }),
      S("leaf-sprig", 84, 80, 14, { rot: 190 }),
    ],
  },
  {
    id: "family-generations", name: "Avlodlar", category: "Oila", background: "tex:linen",
    elements: [
      P(4, 8, 28, 56, { frame: "vintage", rot: -4 }),
      P(36, 6, 28, 56, { frame: "vintage", rot: 1 }),
      P(68, 8, 28, 56, { frame: "vintage", rot: 4 }),
      T(6, 72, 88, "Bobolar · Ota-onalar · Biz", { font: "cormorant", size: 44, align: "center", italic: true, color: "#3B3A36" }),
      S("heart-solid", 47, 86, 6, { color: "#A8453A" }),
    ],
  },
  {
    id: "family-sunday", name: "Yakshanba", category: "Oila", background: "blush",
    elements: [
      P(5, 6, 56, 62, { frame: "rounded" }),
      P(64, 6, 31, 30, { frame: "rounded" }),
      P(64, 38, 31, 30, { frame: "rounded" }),
      T(6, 74, 88, "Oilaviy yakshanba", { font: "handwriting", size: 62, color: "#A8453A" }),
      S("coffee", 88, 80, 7, { color: "#6B4F3A" }),
    ],
  },

  // ── Tug'ilgan kun ────────────────────────────────────────
  {
    id: "bday-party", name: "Tug'ilgan kun", category: "Tug'ilgan kun", background: "grad:gold",
    elements: [
      P(10, 12, 50, 64, { frame: "polaroid", rot: -5 }),
      S("tape-dots", 25, 7, 18, { rot: -8 }),
      T(62, 18, 34, "Tug'ilgan kuning muborak!", { font: "dancing", size: 60, color: "#A8453A", lineHeight: 1.1 }),
      T(62, 50, 32, "5 yosh", { font: "amatic", size: 70, color: "#2F4C48" }),
      S("cake", 70, 68, 10, { color: "#A8453A" }),
      S("party", 84, 6, 9, { color: "#B8863B", rot: 10 }),
      S("sparkle", 5, 80, 5, { color: "#B8863B" }),
      S("sparkle", 58, 84, 3.5, { color: "#B8863B" }),
    ],
  },
  {
    id: "bday-collage", name: "Bayram kolleji", category: "Tug'ilgan kun", background: "tex:dots",
    elements: [
      P(4, 6, 44, 50, { frame: "tape", rot: -3 }),
      P(52, 6, 44, 40, { frame: "tape", rot: 3 }),
      P(52, 50, 44, 44, { frame: "tape", rot: -2 }),
      T(4, 64, 44, "Bir yil kattaroq,\nbir yil baxtliroq", { font: "handwriting", size: 46, color: "#A8453A", align: "center" }),
      S("gift", 20, 86, 7, { color: "#2F4C48" }),
    ],
  },

  // ── To'y ─────────────────────────────────────────────────
  {
    id: "wedding-classic", name: "To'y kuni", category: "To'y", background: "solid:#FBF8F0",
    elements: [
      P(20, 6, 60, 66, { frame: "minimal" }),
      T(10, 76, 80, "Malika & Jasur", { font: "dancing", size: 72, align: "center", color: "#B8863B" }),
      T(10, 89, 80, "14 · 06 · 2026", { font: "cormorant", size: 30, align: "center", color: "#6B645A" }),
      S("leaf-branch", 6, 20, 9, { rot: -12, color: "#8FA89B" }),
      S("leaf-branch", 85, 20, 9, { rot: 12, color: "#8FA89B" }),
    ],
  },
  {
    id: "wedding-romance", name: "Oq libos", category: "To'y", background: "grad:lavender",
    elements: [
      P(5, 8, 44, 70, { frame: "polaroid", rot: -4 }),
      P(51, 12, 44, 70, { frame: "polaroid", rot: 4 }),
      S("heart-solid", 45, 6, 10, { color: "#C97B84", rot: 8 }),
      T(8, 84, 84, "Abadiy birga", { font: "playfair", size: 48, align: "center", italic: true, color: "#6E5A8A" }),
    ],
  },

  // ── Bolalik ──────────────────────────────────────────────
  {
    id: "child-play", name: "Bolalik", category: "Bolalik", background: "tex:lined",
    elements: [
      P(12, 10, 40, 52, { frame: "polaroid", rot: -6 }),
      P(50, 20, 38, 48, { frame: "polaroid", rot: 5 }),
      S("tape-blush", 22, 5, 16, { rot: -10 }),
      S("tape-grid", 60, 15, 16, { rot: 6 }),
      T(10, 74, 80, "Kichkintoyimiz", { font: "marker", size: 60, align: "center", color: "#3E5C76" }),
      S("star-solid", 84, 6, 7, { color: "#E0B04A", rot: 12 }),
      S("smile", 6, 76, 7, { color: "#B8863B" }),
    ],
  },
  {
    id: "child-first", name: "Birinchi qadamlar", category: "Bolalik", background: "sage",
    elements: [
      P(30, 6, 40, 56, { frame: "circle" }),
      T(10, 66, 80, "Birinchi qadamlar", { font: "amatic", size: 80, align: "center", color: "#2F4C48" }),
      T(20, 82, 60, "sana: ___________", { font: "patrick", size: 30, align: "center", color: "#5C7A73" }),
      S("cloud", 8, 10, 10, { color: "#8CA6C0" }),
      S("cloud", 80, 20, 12, { color: "#8CA6C0" }),
    ],
  },

  // ── Tabiat ───────────────────────────────────────────────
  {
    id: "nature-hike", name: "Tog'da", category: "Tabiat", background: "grad:forest",
    elements: [
      P(5, 6, 90, 62, { frame: "none" }),
      T(6, 74, 60, "Tog'lar chaqiradi", { font: "playfair", size: 58, color: "#F2EDE2" }),
      T(6, 87, 60, "Chimyon · 2026", { font: "montserrat", size: 24, color: "#D9BC85", letterSpacing: 3 }),
      S("leaf-sprig", 78, 76, 16, { color: "#8FA89B" }),
    ],
  },
  {
    id: "nature-garden", name: "Bog'", category: "Tabiat", background: "tex:watercolor",
    elements: [
      P(8, 10, 48, 60, { frame: "paper", rot: -3 }),
      P(58, 30, 34, 42, { frame: "paper", rot: 5 }),
      S("flower-bloom", 50, 4, 10, { color: "#C97B84" }),
      S("flower-daisy", 4, 66, 9),
      S("leaf-single", 88, 70, 8, { color: "#5C7A5E", rot: 30 }),
      T(56, 80, 40, "Bahor keldi", { font: "handwriting", size: 56, color: "#2F4C48" }),
    ],
  },

  // ── Xotiralar ────────────────────────────────────────────
  {
    id: "mem-scrap", name: "Scrapbook", category: "Xotiralar", background: "tex:kraft",
    elements: [
      S("paper-torn", 2, 70, 60, { h: 22, rot: -2, color: "#F7F1E3" }),
      P(6, 6, 42, 56, { frame: "polaroid", rot: -6 }),
      P(42, 10, 30, 40, { frame: "polaroid", rot: 7 }),
      P(70, 30, 26, 36, { frame: "polaroid", rot: -3 }),
      S("pin", 24, 4, 4),
      S("clip", 55, 6, 3),
      S("tape-kraft", 76, 26, 13, { rot: 20 }),
      T(6, 74, 52, "Unutilmas kunlar", { font: "handwriting", size: 58, color: "#3B3A36" }),
      S("word-memories", 66, 80, 26, { color: "#A8453A", rot: -6 }),
    ],
  },
  {
    id: "mem-notes", name: "Eslatmalar", category: "Xotiralar", background: "tex:linen",
    elements: [
      P(4, 6, 54, 72, { frame: "vintage", rot: -2 }),
      S("paper-sticky", 62, 10, 30, { h: 40, rot: 4, color: "#F3DE8A" }),
      T(64, 16, 26, "Eslab qol:\nshu kun kulgimiz to'xtamadi", { font: "patrick", size: 30, color: "#3B3A36", lineHeight: 1.45 }),
      S("pin", 75, 6, 4, { color: "#3E5C76" }),
      T(62, 66, 32, "— 2026 yoz", { font: "typewriter", size: 26, color: "#6B645A" }),
    ],
  },

  // ── Romantik ─────────────────────────────────────────────
  {
    id: "rom-evening", name: "Romantik kech", category: "Romantik", background: "midnight",
    elements: [
      P(14, 8, 72, 62, { frame: "polaroid", rot: -3 }),
      T(10, 76, 80, "Sen va men", { font: "dancing", size: 70, align: "center", color: "#D9BC85" }),
      S("heart", 6, 6, 7, { color: "#C97B84" }),
      S("moon", 86, 6, 7, { color: "#D9BC85" }),
      S("sparkle", 8, 84, 4, { color: "#D9BC85" }),
      S("sparkle", 88, 82, 3, { color: "#D9BC85" }),
    ],
  },
  {
    id: "rom-letter", name: "Sevgi maktubi", category: "Romantik", background: "blush",
    elements: [
      S("paper-note", 52, 8, 42, { h: 80, rot: 2 }),
      P(6, 12, 42, 64, { frame: "tape", rot: -4 }),
      T(56, 16, 34, "Azizim,", { font: "dancing", size: 54, color: "#A8453A" }),
      T(56, 30, 34, "Har kuni sen bilan yangi xotira...", { font: "handwriting", size: 36, color: "#3B3A36", lineHeight: 1.4 }),
      S("doodle-hearts", 62, 70, 22, { color: "#C0504D" }),
    ],
  },

  // ── Bayram ───────────────────────────────────────────────
  {
    id: "cel-night", name: "Bayram kechasi", category: "Bayram", background: "grad:night",
    elements: [
      P(3, 12, 32, 50, { frame: "polaroid", rot: -7 }),
      P(34, 5, 32, 54, { frame: "polaroid", rot: 3 }),
      P(65, 14, 32, 50, { frame: "polaroid", rot: -5 }),
      T(8, 70, 84, "Yangi yil kechasi", { font: "playfair", size: 62, align: "center", color: "#F2EDE2" }),
      S("sparkle", 4, 4, 5, { color: "#D9BC85" }), S("sparkle", 90, 4, 4, { color: "#D9BC85" }),
      S("star-solid", 48, 88, 4, { color: "#D9BC85" }),
    ],
  },
  {
    id: "cel-banner", name: "Tantana", category: "Bayram", background: "paper",
    elements: [
      S("paper-banner", 20, 4, 60, { h: 11, color: "#A8453A" }),
      T(24, 5.5, 52, "TABRIKLAYMIZ", { font: "montserrat", size: 40, align: "center", bold: true, color: "#FFFFFF", letterSpacing: 6 }),
      P(6, 22, 56, 70, { frame: "polaroid", rot: -3 }),
      P(64, 26, 30, 36, { frame: "polaroid", rot: 5 }),
      T(64, 70, 32, "Eng quvnoq kun!", { font: "handwriting", size: 48, color: "#2F4C48" }),
    ],
  },

  // ── Oddiy ────────────────────────────────────────────────
  {
    id: "simple-classic", name: "Klassik", category: "Oddiy", background: "paper",
    elements: [
      P(8, 7, 84, 62, { frame: "polaroid", rot: -1.5 }),
      S("tape-gold", 39, 3, 22, { rot: -3 }),
      T(8, 76, 84, "Xotirangizni yozing...", { font: "serif", size: 42, align: "center", color: "#2E362F" }),
    ],
  },
  {
    id: "simple-two", name: "Ikki xotira", category: "Oddiy", background: "sage",
    elements: [
      P(4, 8, 45, 66, { frame: "polaroid", rot: -5 }),
      P(51, 12, 45, 66, { frame: "polaroid", rot: 4 }),
      T(6, 82, 88, "Ikki lahza, bir hikoya", { font: "handwriting", size: 48, align: "center", color: "#2F4C48" }),
    ],
  },
  {
    id: "simple-full", name: "To'liq rasm", category: "Oddiy", background: "solid:#1E2621",
    elements: [
      P(0, 0, 100, 100, { frame: "none" }),
      T(5, 82, 70, "Sarlavha", { font: "playfair", size: 64, color: "#FFFFFF" }),
    ],
  },

  // ── Kollaj ───────────────────────────────────────────────
  {
    id: "col-grid4", name: "4 rasm (2×2)", category: "Kollaj", background: "solid:#FFFFFF",
    elements: [
      P(2, 2.7, 47.5, 46.6, { frame: "none" }), P(50.5, 2.7, 47.5, 46.6, { frame: "none" }),
      P(2, 50.7, 47.5, 46.6, { frame: "none" }), P(50.5, 50.7, 47.5, 46.6, { frame: "none" }),
    ],
  },
  {
    id: "col-mosaic", name: "Mozaika", category: "Kollaj", background: "solid:#F2EDE2",
    elements: [
      P(2, 2.7, 58, 62, { frame: "none" }),
      P(61, 2.7, 37, 30, { frame: "none" }), P(61, 34.7, 37, 30, { frame: "none" }),
      P(2, 66.7, 31, 30.6, { frame: "none" }), P(34.5, 66.7, 31, 30.6, { frame: "none" }), P(67, 66.7, 31, 30.6, { frame: "none" }),
    ],
  },
  {
    id: "col-polaroids", name: "Polaroidlar", category: "Kollaj", background: "tex:kraft",
    elements: [
      P(4, 6, 30, 44, { frame: "polaroid", rot: -8 }),
      P(35, 3, 30, 44, { frame: "polaroid", rot: 4 }),
      P(66, 7, 30, 44, { frame: "polaroid", rot: -3 }),
      P(10, 50, 30, 44, { frame: "polaroid", rot: 5 }),
      P(40, 52, 30, 44, { frame: "polaroid", rot: -6 }),
      P(68, 50, 28, 42, { frame: "polaroid", rot: 7 }),
      S("pin", 17, 4, 3.5), S("pin", 49, 1, 3.5, { color: "#3E5C76" }), S("pin", 80, 5, 3.5, { color: "#E0B04A" }),
    ],
  },
  {
    id: "col-strip", name: "Plyonka", category: "Kollaj", background: "solid:#2A2925",
    elements: [
      P(3, 14, 31, 72, { frame: "film" }), P(34.5, 14, 31, 72, { frame: "film" }), P(66, 14, 31, 72, { frame: "film" }),
      T(3, 89, 94, "kadr 1 · kadr 2 · kadr 3", { font: "typewriter", size: 24, align: "center", color: "#D9BC85" }),
    ],
  },
];

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

/** Shablondan yangi elementlar yaratadi (mantiqiy birliklarda). */
export function buildTemplateElements(tpl, existingPhotos = []) {
  let photoIdx = 0;
  const now = new Date().toISOString();
  return tpl.elements.map((d) => {
    const x = (d.x / 100) * PAGE_W;
    const y = (d.y / 100) * PAGE_H;
    const w = (d.w / 100) * PAGE_W;
    if (d.type === "photo") {
      const reuse = existingPhotos[photoIdx++];
      return {
        id: uid(), type: "photo", x, y, w, h: (d.h / 100) * PAGE_H, rotation: d.rot || 0,
        groupId: null, locked: false, opacity: 1, createdAt: now,
        src: reuse?.src || null, aspect: reuse?.aspect || null,
        frame: d.frame || "none", crop: { s: 1, cx: 0.5, cy: 0.5 }, imgRot: 0,
        flipH: false, flipV: false, filter: reuse?.filter || null, muted: true,
        caption: reuse?.caption || null, location: reuse?.location || null,
      };
    }
    if (d.type === "text") {
      const size = d.size || 32;
      const lines = String(d.text).split("\n").length;
      return {
        id: uid(), type: "text", x, y, w, h: size * (d.lineHeight || 1.3) * lines, rotation: d.rot || 0,
        groupId: null, locked: false, opacity: 1, createdAt: now,
        text: d.text, font: d.font || "sans", fontSize: size, color: d.color || "#1E2621",
        align: d.align || "left", bold: !!d.bold, italic: !!d.italic, underline: false, uppercase: false,
        letterSpacing: d.letterSpacing || 0, lineHeight: d.lineHeight || 1.3, autoHeight: true,
      };
    }
    const def = stickerDef(d.id);
    const h = d.h != null ? (d.h / 100) * PAGE_H : w / def.aspect;
    return {
      id: uid(), type: "sticker", x, y, w, h, rotation: d.rot || 0,
      groupId: null, locked: false, opacity: 1, createdAt: now,
      stickerId: def.id, color: d.color || def.color, flipH: false, flipV: false,
    };
  });
}
