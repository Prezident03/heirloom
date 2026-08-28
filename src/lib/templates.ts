// ============================================================
// Photo Book — Professional shablonlar katalogi
// Har bir id serverdagi (lib/albums.ts TEMPLATES) shablonga mos
// keladi, shuning uchun applyPageTemplateAction orqali qo'llanadi.
// ============================================================

export type BackgroundId = "paper" | "sage" | "slate" | "blush" | "midnight";
export type FrameStyle = "polaroid" | "soft" | "none";
export type TextAlign = "left" | "center" | "right";
export type TextFont = "handwriting" | "serif" | "sans";

export interface TemplateSlot {
  type: "photo" | "text";
  x: number; // 0-100%
  y: number; // 0-100%
  w: number; // 0-100%
  h: number; // 0-100%
  frame?: FrameStyle;
  rotation?: number;
  textStyle?: { size?: number; color?: string; align?: TextAlign; font?: TextFont };
  placeholder?: string; // matn sloti uchun boshlang'ich matn
}

export interface TemplateSticker {
  stickerId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  rotation?: number;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  backgroundId: BackgroundId;
  slots: TemplateSlot[];
  stickers: TemplateSticker[];
  thumbnail: string; // preview belgisi (emoji)
}

export const TEMPLATES: Template[] = [
  // ── Oddiy ────────────────────────────────────────────────
  {
    id: "classic-cream",
    name: "Klassik",
    category: "Oddiy",
    backgroundId: "paper",
    thumbnail: "📔",
    slots: [
      { type: "photo", x: 8, y: 8, w: 84, h: 58, frame: "polaroid", rotation: -2 },
      { type: "text", x: 8, y: 70, w: 84, h: 22, textStyle: { align: "center", font: "serif" }, placeholder: "Xotirangizni yozing..." },
    ],
    stickers: [{ stickerId: "tape-gold", x: 38, y: 3, w: 24, h: 7, rotation: -3 }],
  },
  {
    id: "ikki-esdalik",
    name: "Ikki xotira",
    category: "Oddiy",
    backgroundId: "sage",
    thumbnail: "🖼️",
    slots: [
      { type: "photo", x: 3, y: 7, w: 48, h: 64, rotation: -6 },
      { type: "photo", x: 40, y: 14, w: 48, h: 64, rotation: 4 },
      { type: "text", x: 6, y: 80, w: 88, h: 14, textStyle: { align: "center" } },
    ],
    stickers: [
      { stickerId: "heart", x: 46, y: 4, w: 10, h: 10, color: "#A8453A", rotation: 8 },
      { stickerId: "leaf", x: 2, y: 2, w: 9, h: 9, color: "#2F4C48", rotation: -10 },
    ],
  },
  {
    id: "uch-lavha",
    name: "Uch lavha",
    category: "Oddiy",
    backgroundId: "slate",
    thumbnail: "🎞️",
    slots: [
      { type: "photo", x: 2, y: 15, w: 33, h: 52, rotation: -8 },
      { type: "photo", x: 29, y: 6, w: 33, h: 56, rotation: 4 },
      { type: "photo", x: 57, y: 16, w: 33, h: 52, rotation: -6 },
      { type: "text", x: 5, y: 70, w: 90, h: 22, textStyle: { align: "center" } },
    ],
    stickers: [
      { stickerId: "cloud", x: 2, y: 2, w: 10, h: 10, color: "#5C7A73", rotation: 8 },
      { stickerId: "umbrella", x: 88, y: 2, w: 10, h: 10, color: "#5C7A73", rotation: -8 },
    ],
  },
  {
    id: "minimal-oq",
    name: "Minimal",
    category: "Oddiy",
    backgroundId: "paper",
    thumbnail: "⬜",
    slots: [
      { type: "photo", x: 12, y: 10, w: 76, h: 62 },
      { type: "text", x: 12, y: 76, w: 76, h: 16, textStyle: { align: "center" } },
    ],
    stickers: [{ stickerId: "square-shape", x: 4, y: 4, w: 7, h: 7, color: "#D9BC85" }],
  },
  {
    id: "klassik-katta",
    name: "Klassik katta",
    category: "Oddiy",
    backgroundId: "paper",
    thumbnail: "📷",
    slots: [
      { type: "photo", x: 6, y: 6, w: 88, h: 62, frame: "polaroid", rotation: -2 },
      { type: "text", x: 6, y: 72, w: 88, h: 20, textStyle: { align: "center", font: "serif" }, placeholder: "Eng qadrli lahza..." },
    ],
    stickers: [{ stickerId: "tape-gold", x: 38, y: 2, w: 24, h: 6, rotation: -2 }],
  },
  {
    id: "ikki-foto-tort",
    name: "Ikki foto (tort)",
    category: "Oddiy",
    backgroundId: "slate",
    thumbnail: "🗂️",
    slots: [
      { type: "photo", x: 8, y: 6, w: 84, h: 44, frame: "soft", rotation: 2 },
      { type: "photo", x: 8, y: 54, w: 84, h: 38, rotation: -3 },
    ],
    stickers: [],
  },

  // ── Kollej ───────────────────────────────────────────────
  {
    id: "kollej-2",
    name: "2 rasm kolleji",
    category: "Kollej",
    backgroundId: "sage",
    thumbnail: "🖼️🖼️",
    slots: [
      { type: "photo", x: 4, y: 8, w: 44, h: 84, rotation: -3 },
      { type: "photo", x: 52, y: 8, w: 44, h: 84, rotation: 3 },
    ],
    stickers: [{ stickerId: "tape-teal", x: 46, y: 2, w: 10, h: 6 }],
  },
  {
    id: "kollej-3",
    name: "3 rasm kolleji",
    category: "Kollej",
    backgroundId: "paper",
    thumbnail: "🖼️🖼️🖼️",
    slots: [
      { type: "photo", x: 4, y: 14, w: 29, h: 72, rotation: -6 },
      { type: "photo", x: 35, y: 6, w: 29, h: 80, rotation: 3 },
      { type: "photo", x: 66, y: 12, w: 29, h: 74, rotation: -4 },
    ],
    stickers: [],
  },
{
    id: "kollej-4-grid",
    name: "4 rasm (2x2)",
    category: "Kollej",
    backgroundId: "paper",
    thumbnail: "🔲",
    slots: [
      { type: "photo", x: 2, y: 2, w: 48, h: 48, rotation: -4 },
      { type: "photo", x: 50, y: 2, w: 48, h: 48, rotation: 3 },
      { type: "photo", x: 2, y: 50, w: 48, h: 48, rotation: -2 },
      { type: "photo", x: 50, y: 50, w: 48, h: 48, rotation: 5 },
    ],
    stickers: [],
  },
  {
    id: "kollej-4-mixed",
    name: "4 rasm (aralash)",
    category: "Kollej",
    backgroundId: "slate",
    thumbnail: "▦",
    slots: [
      { type: "photo", x: 2, y: 2, w: 60, h: 60, rotation: -3 },
      { type: "photo", x: 66, y: 2, w: 32, h: 28, rotation: 2 },
      { type: "photo", x: 66, y: 34, w: 32, h: 28, rotation: -2 },
      { type: "photo", x: 2, y: 66, w: 96, h: 32, rotation: 1 },
    ],
    stickers: [],
  },
  {
    id: "kollej-5",
    name: "5 rasm kolleji",
    category: "Kollej",
    backgroundId: "blush",
    thumbnail: "🖼",
    slots: [
      { type: "photo", x: 2, y: 2, w: 48, h: 48, rotation: -4 },
      { type: "photo", x: 50, y: 2, w: 48, h: 48, rotation: 3 },
      { type: "photo", x: 2, y: 54, w: 31, h: 44, rotation: -2 },
      { type: "photo", x: 34.5, y: 54, w: 31, h: 44, rotation: 2 },
      { type: "photo", x: 67, y: 54, w: 31, h: 44, rotation: -3 },
    ],
    stickers: [],
  },
  {
    id: "kollej-6",
    name: "6 rasm (3x2)",
    category: "Kollej",
    backgroundId: "paper",
    thumbnail: "🔳",
    slots: [
      { type: "photo", x: 0, y: 0, w: 33.3, h: 50, rotation: -3 },
      { type: "photo", x: 33.3, y: 0, w: 33.3, h: 50, rotation: 2 },
      { type: "photo", x: 66.6, y: 0, w: 33.4, h: 50, rotation: -2 },
      { type: "photo", x: 0, y: 50, w: 33.3, h: 50, rotation: 3 },
      { type: "photo", x: 33.3, y: 50, w: 33.3, h: 50, rotation: -4 },
      { type: "photo", x: 66.6, y: 50, w: 33.4, h: 50, rotation: 1 },
    ],
    stickers: [],
  },

  // ── Sayohat ──────────────────────────────────────────────
  {
    id: "sayohat",
    name: "Sayohat kundaligi",
    category: "Sayohat",
    backgroundId: "blush",
    thumbnail: "🧳",
    slots: [
      { type: "photo", x: 6, y: 6, w: 60, h: 50 },
      { type: "photo", x: 68, y: 6, w: 26, h: 24 },
      { type: "photo", x: 68, y: 32, w: 26, h: 24 },
      { type: "text", x: 6, y: 60, w: 88, h: 32, textStyle: { font: "handwriting", color: "#2F4C48" }, placeholder: "Sayohat hikoyasi..." },
    ],
    stickers: [
      { stickerId: "camera", x: 4, y: 58, w: 10, h: 10, color: "#1E2621" },
      { stickerId: "sun", x: 84, y: 4, w: 10, h: 10, color: "#B8863B" },
    ],
  },
  {
    id: "tabiat-sayri",
    name: "Tabiat sayri",
    category: "Sayohat",
    backgroundId: "sage",
    thumbnail: "🌲",
    slots: [
      { type: "photo", x: 6, y: 6, w: 60, h: 50 },
      { type: "photo", x: 68, y: 6, w: 26, h: 24 },
      { type: "photo", x: 68, y: 32, w: 26, h: 24 },
      { type: "text", x: 6, y: 60, w: 88, h: 32, textStyle: { font: "handwriting" } },
    ],
    stickers: [
      { stickerId: "leaf", x: 2, y: 2, w: 10, h: 10, color: "#2F4C48" },
      { stickerId: "feather", x: 90, y: 2, w: 8, h: 8, color: "#5C7A73" },
    ],
  },
{
    id: "sayohat-duo",
    name: "Sayohat duo",
    category: "Sayohat",
    backgroundId: "sage",
    thumbnail: "✈️",
    slots: [
      { type: "photo", x: 4, y: 6, w: 58, h: 88, rotation: -4 },
      { type: "photo", x: 66, y: 8, w: 30, h: 44, rotation: 3 },
      { type: "text", x: 66, y: 56, w: 30, h: 36, textStyle: { font: "handwriting", color: "#2F4C48" }, placeholder: "Chorrahada..." },
    ],
    stickers: [
      { stickerId: "camera", x: 3, y: 90, w: 10, h: 10, color: "#1E2621" },
      { stickerId: "sun", x: 88, y: 2, w: 10, h: 10, color: "#B8863B" },
    ],
  },
  {
    id: "sayohat-trilogiya",
    name: "Sayohat trilogiyasi",
    category: "Sayohat",
    backgroundId: "blush",
    thumbnail: "🗺️",
    slots: [
      { type: "photo", x: 4, y: 7, w: 30, h: 50, rotation: -7 },
      { type: "photo", x: 35, y: 4, w: 30, h: 54, rotation: 4 },
      { type: "photo", x: 66, y: 8, w: 30, h: 48, rotation: -5 },
      { type: "text", x: 4, y: 62, w: 92, h: 32, textStyle: { align: "center" }, placeholder: "Uch shahar, bitta xotira..." },
    ],
    stickers: [
      { stickerId: "camera", x: 2, y: 2, w: 9, h: 9, color: "#1E2621" },
      { stickerId: "feather", x: 90, y: 2, w: 8, h: 8, color: "#5C7A73" },
    ],
  },

  // ── Oila ─────────────────────────────────────────────────
  {
    id: "bolalik-lahzalari",
    name: "Bolalik lahzalari",
    category: "Oila",
    backgroundId: "blush",
    thumbnail: "👶",
    slots: [
      { type: "photo", x: 3, y: 6, w: 48, h: 66, rotation: -7 },
      { type: "photo", x: 39, y: 13, w: 48, h: 62, rotation: 5 },
      { type: "text", x: 6, y: 78, w: 88, h: 16, textStyle: { align: "center", font: "handwriting" } },
    ],
    stickers: [
      { stickerId: "smile", x: 46, y: 3, w: 9, h: 9, color: "#B8863B", rotation: -6 },
      { stickerId: "crown", x: 2, y: 2, w: 9, h: 9, color: "#B8863B", rotation: -8 },
    ],
  },
  {
    id: "oila-surati",
    name: "Oila surati",
    category: "Oila",
    backgroundId: "paper",
    thumbnail: "👨‍👩‍👧",
    slots: [
      { type: "photo", x: 5, y: 5, w: 90, h: 62, frame: "polaroid", rotation: -2 },
      { type: "text", x: 5, y: 70, w: 90, h: 22, textStyle: { align: "center", font: "serif" }, placeholder: "Bizning oila..." },
    ],
    stickers: [
      { stickerId: "flower", x: 2, y: 2, w: 10, h: 10, color: "#A8453A" },
      { stickerId: "leaf", x: 88, y: 2, w: 9, h: 9, color: "#2F4C48" },
    ],
  },
  {
    id: "oila-avlodlari",
    name: "Oila avlodlari",
    category: "Oila",
    backgroundId: "blush",
    thumbnail: "👨‍👩‍👧‍👦",
    slots: [
      { type: "photo", x: 3, y: 4, w: 46, h: 78, rotation: -5 },
      { type: "photo", x: 51, y: 4, w: 46, h: 78, rotation: 4 },
      { type: "text", x: 3, y: 84, w: 94, h: 12, textStyle: { align: "center" }, placeholder: "Avloddan avlodga..." },
    ],
    stickers: [
      { stickerId: "heart", x: 46, y: 3, w: 9, h: 9, color: "#A8453A", rotation: 8 },
      { stickerId: "star", x: 2, y: 2, w: 8, h: 8, color: "#B8863B", rotation: -8 },
    ],
  },

  // ── To'y ─────────────────────────────────────────────────
  {
    id: "toy-marosimi",
    name: "To'y marosimi",
    category: "To'y",
    backgroundId: "paper",
    thumbnail: "💍",
    slots: [
      { type: "photo", x: 4, y: 6, w: 44, h: 70, rotation: -4 },
      { type: "photo", x: 52, y: 6, w: 44, h: 70, rotation: 5 },
      { type: "text", x: 4, y: 80, w: 92, h: 12, textStyle: { align: "center", font: "serif", color: "#B8863B" }, placeholder: "2020 — eng baxtli kun" },
    ],
    stickers: [
      { stickerId: "heart", x: 2, y: 2, w: 9, h: 9, color: "#A8453A", rotation: -8 },
      { stickerId: "tape-gold", x: 38, y: 78, w: 24, h: 6, rotation: -3 },
    ],
  },
  {
    id: "toy-tantana",
    name: "To'y tantanasi",
    category: "To'y",
    backgroundId: "blush",
    thumbnail: "🥂",
    slots: [
      { type: "photo", x: 12, y: 6, w: 76, h: 60, frame: "polaroid", rotation: -3 },
      { type: "text", x: 12, y: 70, w: 76, h: 20, textStyle: { align: "center", font: "handwriting", color: "#A8453A" }, placeholder: "Hayotimizning eng go'zal kuni" },
    ],
    stickers: [
      { stickerId: "heart", x: 4, y: 4, w: 9, h: 9, color: "#A8453A", rotation: -8 },
      { stickerId: "flower", x: 88, y: 4, w: 9, h: 9, color: "#A8453A", rotation: 10 },
    ],
  },
{
    id: "tugilgan-kun",
    name: "Tug'ilgan kun",
    category: "Tug'ilgan kun",
    backgroundId: "paper",
    thumbnail: "🎂",
    slots: [
      { type: "photo", x: 10, y: 10, w: 80, h: 55 },
      { type: "text", x: 10, y: 68, w: 80, h: 24, textStyle: { align: "center" } },
    ],
    stickers: [
      { stickerId: "cake", x: 4, y: 4, w: 12, h: 12, color: "#A8453A" },
      { stickerId: "party", x: 84, y: 4, w: 12, h: 12, color: "#B8863B" },
      { stickerId: "gift", x: 4, y: 84, w: 10, h: 10, color: "#2F4C48" },
      { stickerId: "sparkles", x: 86, y: 84, w: 10, h: 10, color: "#B8863B" },
    ],
  },
  {
    id: "tugilgan-kun-muborak",
    name: "Tug'ilgan kun (kollej)",
    category: "Tug'ilgan kun",
    backgroundId: "paper",
    thumbnail: "🎈",
    slots: [
      { type: "photo", x: 6, y: 6, w: 52, h: 60, rotation: -3 },
      { type: "photo", x: 62, y: 6, w: 32, h: 28, rotation: 2 },
      { type: "photo", x: 62, y: 38, w: 32, h: 28, rotation: -2 },
      { type: "text", x: 6, y: 70, w: 88, h: 24, textStyle: { align: "center", font: "handwriting", color: "#A8453A" }, placeholder: "Tug'ilgan kuning muborak!" },
    ],
    stickers: [
      { stickerId: "cake", x: 2, y: 2, w: 10, h: 10, color: "#A8453A" },
      { stickerId: "party", x: 88, y: 2, w: 10, h: 10, color: "#B8863B" },
      { stickerId: "sparkles", x: 2, y: 88, w: 9, h: 9, color: "#B8863B" },
      { stickerId: "gift", x: 88, y: 88, w: 9, h: 9, color: "#2F4C48" },
    ],
  },

  // ── Tabiat ───────────────────────────────────────────────
  {
    id: "tabiat-manzarasi",
    name: "Tabiat manzarasi",
    category: "Tabiat",
    backgroundId: "sage",
    thumbnail: "🌿",
    slots: [
      { type: "photo", x: 4, y: 6, w: 92, h: 58, frame: "soft", rotation: 2 },
      { type: "text", x: 4, y: 68, w: 92, h: 26, textStyle: { align: "center", font: "serif", color: "#2F4C48" }, placeholder: "Tabiatning tiniq nafasi..." },
    ],
    stickers: [
      { stickerId: "leaf", x: 2, y: 2, w: 10, h: 10, color: "#2F4C48" },
      { stickerId: "feather", x: 88, y: 2, w: 9, h: 9, color: "#5C7A73" },
      { stickerId: "sun", x: 2, y: 88, w: 9, h: 9, color: "#B8863B" },
    ],
  },
  {
    id: "tabiat-qoyasi",
    name: "Tabiat qo'ynida",
    category: "Tabiat",
    backgroundId: "slate",
    thumbnail: "🏔️",
    slots: [
      { type: "photo", x: 4, y: 8, w: 44, h: 84, rotation: -4 },
      { type: "photo", x: 52, y: 8, w: 44, h: 44, rotation: 3 },
      { type: "photo", x: 52, y: 56, w: 44, h: 36, rotation: -2 },
    ],
    stickers: [
      { stickerId: "cloud", x: 2, y: 2, w: 9, h: 9, color: "#5C7A73" },
      { stickerId: "snowflake", x: 88, y: 2, w: 8, h: 8, color: "#5C7A73" },
      { stickerId: "leaf", x: 2, y: 90, w: 8, h: 8, color: "#2F4C48" },
    ],
  },
{
    id: "yubiley",
    name: "Yubiley",
    category: "Bayram",
    backgroundId: "paper",
    thumbnail: "🎉",
    slots: [
      { type: "photo", x: 10, y: 8, w: 80, h: 52 },
      { type: "text", x: 10, y: 64, w: 80, h: 26, textStyle: { align: "center" } },
    ],
    stickers: [
      { stickerId: "crown", x: 4, y: 4, w: 10, h: 10, color: "#B8863B" },
      { stickerId: "star", x: 88, y: 4, w: 9, h: 9, color: "#B8863B" },
      { stickerId: "tape-gold", x: 38, y: 2, w: 24, h: 6, color: "#D9BC85" },
      { stickerId: "tape-gold", x: 38, y: 60, w: 24, h: 6, color: "#D9BC85" },
    ],
  },
  {
    id: "bayram-kechasi",
    name: "Bayram kechasi",
    category: "Bayram",
    backgroundId: "midnight",
    thumbnail: "🎆",
    slots: [
      { type: "photo", x: 5, y: 8, w: 28, h: 50 },
      { type: "photo", x: 36, y: 8, w: 28, h: 50 },
      { type: "photo", x: 67, y: 8, w: 28, h: 50 },
      { type: "text", x: 5, y: 64, w: 90, h: 26, textStyle: { align: "center", color: "#F2EDE2" } },
    ],
    stickers: [
      { stickerId: "party", x: 2, y: 2, w: 9, h: 9, color: "#D9BC85" },
      { stickerId: "music", x: 90, y: 2, w: 8, h: 8, color: "#D9BC85" },
      { stickerId: "sparkles", x: 2, y: 92, w: 8, h: 8, color: "#D9BC85" },
      { stickerId: "sparkles", x: 90, y: 92, w: 8, h: 8, color: "#D9BC85" },
    ],
  },

  // ── Fasllar ──────────────────────────────────────────────
  {
    id: "bahor",
    name: "Bahor kayfiyati",
    category: "Fasllar",
    backgroundId: "sage",
    thumbnail: "🌸",
    slots: [
      { type: "photo", x: 8, y: 10, w: 84, h: 56 },
      { type: "text", x: 8, y: 70, w: 84, h: 20, textStyle: { align: "center" } },
    ],
    stickers: [
      { stickerId: "flower", x: 4, y: 4, w: 10, h: 10, color: "#A8453A" },
      { stickerId: "leaf", x: 88, y: 4, w: 9, h: 9, color: "#2F4C48" },
      { stickerId: "sun", x: 4, y: 88, w: 9, h: 9, color: "#B8863B" },
    ],
  },
  {
    id: "qish-ertagi",
    name: "Qish ertagi",
    category: "Fasllar",
    backgroundId: "midnight",
    thumbnail: "❄️",
    slots: [
      { type: "photo", x: 8, y: 10, w: 84, h: 54, frame: "soft", rotation: 2 },
      { type: "text", x: 8, y: 68, w: 84, h: 24, textStyle: { align: "center", color: "#F2EDE2", font: "serif" } },
    ],
    stickers: [
      { stickerId: "snowflake", x: 4, y: 4, w: 9, h: 9, color: "#D9BC85", rotation: 10 },
      { stickerId: "moon", x: 86, y: 4, w: 9, h: 9, color: "#D9BC85", rotation: -8 },
      { stickerId: "star", x: 4, y: 86, w: 8, h: 8, color: "#D9BC85", rotation: 12 },
      { stickerId: "sparkles", x: 88, y: 86, w: 8, h: 8, color: "#D9BC85", rotation: -10 },
    ],
  },

  // ── Romantik ─────────────────────────────────────────────
  {
    id: "romantik-kech",
    name: "Romantik kech",
    category: "Romantik",
    backgroundId: "midnight",
    thumbnail: "🌙",
    slots: [
      { type: "photo", x: 15, y: 8, w: 70, h: 58, frame: "polaroid", rotation: -3 },
      { type: "text", x: 15, y: 70, w: 70, h: 20, textStyle: { align: "center", font: "handwriting", color: "#D9BC85" }, placeholder: "Sen va men..." },
    ],
    stickers: [
      { stickerId: "heart", x: 4, y: 4, w: 9, h: 9, color: "#A8453A", rotation: -8 },
      { stickerId: "moon", x: 88, y: 4, w: 9, h: 9, color: "#D9BC85", rotation: 6 },
      { stickerId: "sparkles", x: 4, y: 88, w: 8, h: 8, color: "#D9BC85", rotation: 10 },
    ],
  },
];

export const TEMPLATE_LIST: Template[] = TEMPLATES;

export const TEMPLATE_CATEGORIES: string[] = [...new Set(TEMPLATES.map((t) => t.category))];

export function getTemplatesByCategory(category: string): Template[] {
  return category === "barchasi" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}