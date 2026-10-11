// ============================================================
// Album Editor — umumiy konstantalar
// ============================================================

// Sahifa "mantiqiy" o'lchami. Barcha elementlar shu birliklarda saqlanadi
// (bazada esa foizda), ko'rsatishda butun sahifa CSS transform bilan
// masshtablanadi — shuning uchun zoom elementning haqiqiy o'lchamini buzmaydi.
export const PAGE_W = 1200;
export const PAGE_H = 900;

export const EDITOR_FONT_IMPORT =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=Caveat:wght@500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Dancing+Script:wght@500;700&family=Amatic+SC:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;600;700&family=Patrick+Hand&family=Lora:ital,wght@0,400;0,600;1,400&family=Special+Elite&family=Shadows+Into+Light&display=swap";

export const FONTS = [
  { id: "handwriting", name: "Caveat", css: "'Caveat', cursive", weight: 600 },
  { id: "serif", name: "Fraunces", css: "'Fraunces', serif", weight: 500 },
  { id: "sans", name: "Inter", css: "'Inter', sans-serif", weight: 500 },
  { id: "playfair", name: "Playfair Display", css: "'Playfair Display', serif", weight: 400 },
  { id: "dancing", name: "Dancing Script", css: "'Dancing Script', cursive", weight: 500 },
  { id: "amatic", name: "Amatic SC", css: "'Amatic SC', cursive", weight: 700 },
  { id: "cormorant", name: "Cormorant", css: "'Cormorant Garamond', serif", weight: 400 },
  { id: "montserrat", name: "Montserrat", css: "'Montserrat', sans-serif", weight: 400 },
  { id: "patrick", name: "Patrick Hand", css: "'Patrick Hand', cursive", weight: 400 },
  { id: "lora", name: "Lora", css: "'Lora', serif", weight: 400 },
  { id: "typewriter", name: "Special Elite", css: "'Special Elite', monospace", weight: 400 },
  { id: "marker", name: "Shadows Into Light", css: "'Shadows Into Light', cursive", weight: 400 },
];
export const FONT_BY_ID = Object.fromEntries(FONTS.map((f) => [f.id, f]));

export const TEXT_PRESETS = [
  { id: "heading", label: "Sarlavha qo'shish", fontSize: 72, font: "serif", bold: true, text: "Sarlavha", w: 620 },
  { id: "subheading", label: "Kichik sarlavha qo'shish", fontSize: 44, font: "playfair", italic: true, text: "Kichik sarlavha", w: 520 },
  { id: "body", label: "Oddiy matn qo'shish", fontSize: 28, font: "sans", text: "Bu yerga xotirangizni yozing", w: 480 },
  { id: "handwritten", label: "Qo'lyozma matn", fontSize: 54, font: "handwriting", text: "Eng yaxshi kunlar", w: 520 },
  { id: "typewriter", label: "Yozuv mashinkasi", fontSize: 30, font: "typewriter", text: "12.05.2026 — Samarqand", w: 480 },
];

export const PALETTE = [
  "#1E2621", "#3B3A36", "#6B645A", "#FFFFFF", "#F2EDE2", "#E9E1D0",
  "#B8863B", "#D9BC85", "#A8453A", "#D98C7A", "#E6C9BC", "#C97B84",
  "#2F4C48", "#5C7A73", "#8FA89B", "#3E5C76", "#8CA6C0", "#6E5A8A",
];

// ------------------------------------------------------------
// Fonlar
// ------------------------------------------------------------
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23n%29'/%3E%3C/svg%3E\")";
const NOISE_STRONG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.3 0 0 0 0 0.2 0 0 0 0 0.1 0 0 0 0.16 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23n%29'/%3E%3C/svg%3E\")";

export const BACKGROUND_GROUPS = [
  {
    label: "Qog'oz",
    items: [
      { id: "paper", name: "Qaymoq qog'oz", css: `${NOISE}, linear-gradient(180deg, #F4EDDD, #ECE2C8)` },
      { id: "tex:kraft", name: "Kraft", css: `${NOISE_STRONG}, linear-gradient(160deg, #C9A57A, #B88E5F)` },
      { id: "tex:linen", name: "Zig'ir", css: `${NOISE}, repeating-linear-gradient(0deg, rgba(120,96,54,0.05) 0 2px, transparent 2px 5px), repeating-linear-gradient(90deg, rgba(120,96,54,0.05) 0 2px, transparent 2px 5px), #F1EADB` },
      { id: "tex:lined", name: "Daftar", css: `linear-gradient(90deg, transparent 88px, rgba(168,69,58,0.35) 88px 90px, transparent 90px), repeating-linear-gradient(180deg, transparent 0 43px, rgba(62,92,118,0.22) 43px 45px), #FBF8F0` },
      { id: "tex:grid", name: "Katak", css: `repeating-linear-gradient(0deg, rgba(62,92,118,0.14) 0 1.5px, transparent 1.5px 40px), repeating-linear-gradient(90deg, rgba(62,92,118,0.14) 0 1.5px, transparent 1.5px 40px), #FBF8F0` },
      { id: "tex:dots", name: "Nuqtali", css: `radial-gradient(circle, rgba(30,38,33,0.22) 2px, transparent 2.5px) 0 0 / 36px 36px, #F7F2E7` },
      { id: "tex:vintage", name: "Vintage", css: `${NOISE_STRONG}, radial-gradient(ellipse at center, #F3E7CC 40%, #DCC59B 100%)` },
      { id: "tex:watercolor", name: "Akvarel", css: `radial-gradient(circle at 20% 25%, rgba(201,123,132,0.28), transparent 45%), radial-gradient(circle at 80% 70%, rgba(140,166,192,0.32), transparent 50%), radial-gradient(circle at 60% 15%, rgba(217,188,133,0.35), transparent 40%), ${NOISE}, #FBF6EE` },
    ],
  },
  {
    label: "Gradientlar",
    items: [
      { id: "sage", name: "Sage", css: `${NOISE}, linear-gradient(180deg, #E7EDE3, #D3DECB)` },
      { id: "slate", name: "Slate", css: `${NOISE}, linear-gradient(180deg, #E4E7E6, #CBD2D0)` },
      { id: "blush", name: "Blush", css: `${NOISE}, linear-gradient(180deg, #F3E4DD, #E6C9BC)` },
      { id: "midnight", name: "Tun", css: `${NOISE}, linear-gradient(180deg, #2A3630, #1B231F)` },
      { id: "grad:sunset", name: "Shom", css: "linear-gradient(160deg, #F7D9B9 0%, #E9A99A 55%, #B9768A 100%)" },
      { id: "grad:sea", name: "Dengiz", css: "linear-gradient(160deg, #DCEBEA 0%, #9FC2C4 60%, #5F8E95 100%)" },
      { id: "grad:lavender", name: "Lavanda", css: "linear-gradient(160deg, #EFE8F4 0%, #CDBEDD 100%)" },
      { id: "grad:gold", name: "Oltin", css: "linear-gradient(160deg, #FBF1DA 0%, #E8CC8E 100%)" },
      { id: "grad:forest", name: "O'rmon", css: "linear-gradient(160deg, #3F5A4E 0%, #22332C 100%)" },
      { id: "grad:night", name: "Yulduzli tun", css: "radial-gradient(circle at 30% 20%, #3E5C76 0%, #1F2B3A 60%, #141B24 100%)" },
    ],
  },
];

export const SOLID_COLORS = [
  "#FFFFFF", "#FBF8F0", "#F2EDE2", "#E9E1D0", "#F3E4DD", "#E7EDE3", "#E4E7E6", "#EFE8F4",
  "#D9BC85", "#C9A57A", "#E6C9BC", "#8FA89B", "#8CA6C0", "#2F4C48", "#1E2621", "#141915",
];

const BG_BY_ID = Object.fromEntries(BACKGROUND_GROUPS.flatMap((g) => g.items).map((b) => [b.id, b]));

/** Sahifa foni uchun CSS. `background_image_url` bo'lsa, u ustun turadi. */
export function backgroundCss(backgroundId, imageUrl) {
  if (imageUrl) return { backgroundImage: `url("${imageUrl}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#F2EDE2" };
  if (backgroundId && backgroundId.startsWith("solid:")) return { background: backgroundId.slice(6) };
  const bg = BG_BY_ID[backgroundId] || BG_BY_ID.paper;
  return { background: bg.css };
}

/** Fon to'q bo'lsa, matn uchun yorug' rangni tavsiya qilish uchun. */
export function isDarkBackground(backgroundId) {
  if (!backgroundId) return false;
  if (["midnight", "grad:forest", "grad:night"].includes(backgroundId)) return true;
  if (backgroundId.startsWith("solid:")) {
    const hex = backgroundId.slice(6).replace("#", "");
    if (hex.length < 6) return false;
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 110;
  }
  return false;
}

// ------------------------------------------------------------
// Ramkalar
// ------------------------------------------------------------
export const FRAMES = [
  { id: "none", name: "Ramkasiz" },
  { id: "polaroid", name: "Polaroid" },
  { id: "rounded", name: "Yumaloq" },
  { id: "circle", name: "Doira" },
  { id: "film", name: "Plyonka" },
  { id: "paper", name: "Qog'oz" },
  { id: "vintage", name: "Vintage" },
  { id: "minimal", name: "Minimal" },
  { id: "tape", name: "Lentali" },
  { id: "soft", name: "Yumshoq soya" },
];
export const FRAME_IDS = new Set(FRAMES.map((f) => f.id));

/**
 * Ramka ichidagi rasm maydoni (px, element o'lchamiga nisbatan) va ramka
 * ko'rinishi. Element o'lchami (w, h) mantiqiy birliklarda.
 */
export function frameLayout(frame, w, h) {
  const m = Math.min(w, h);
  switch (frame) {
    case "polaroid": {
      const side = Math.max(6, w * 0.055);
      return { inset: { top: side, right: side, bottom: Math.max(side * 2.6, h * 0.17), left: side }, radius: 2, innerRadius: 0, bg: "#FDFCF8", shadow: "0 10px 24px rgba(30,26,15,0.22), 0 2px 6px rgba(30,26,15,0.12)" };
    }
    case "rounded":
      return { inset: { top: 0, right: 0, bottom: 0, left: 0 }, radius: m * 0.09, innerRadius: m * 0.09, bg: "transparent", shadow: "0 8px 20px rgba(30,26,15,0.18)" };
    case "circle":
      return { inset: { top: 0, right: 0, bottom: 0, left: 0 }, radius: "50%", innerRadius: "50%", bg: "transparent", shadow: "0 8px 20px rgba(30,26,15,0.18)" };
    case "film": {
      const v = Math.max(10, h * 0.13);
      const s = Math.max(6, w * 0.035);
      return { inset: { top: v, right: s, bottom: v, left: s }, radius: 3, innerRadius: 1, bg: "#1C1B19", shadow: "0 8px 18px rgba(0,0,0,0.3)", film: true, filmBand: v };
    }
    case "paper": {
      const p = Math.max(8, m * 0.06);
      return { inset: { top: p, right: p, bottom: p, left: p }, radius: 3, innerRadius: 0, bg: `${NOISE}, #F7F1E3`, shadow: "0 6px 16px rgba(30,26,15,0.2), 0 1px 3px rgba(30,26,15,0.15)" };
    }
    case "vintage": {
      const p = Math.max(10, m * 0.075);
      return { inset: { top: p, right: p, bottom: p, left: p }, radius: 4, innerRadius: 0, bg: `${NOISE_STRONG}, #EEE2C6`, shadow: "0 8px 18px rgba(60,40,10,0.25)", vintage: true, pad: p };
    }
    case "minimal": {
      const p = Math.max(4, m * 0.025);
      return { inset: { top: p, right: p, bottom: p, left: p }, radius: 0, innerRadius: 0, bg: "#FFFFFF", shadow: "0 2px 8px rgba(30,26,15,0.14)", border: "1px solid rgba(30,26,15,0.12)" };
    }
    case "tape": {
      const p = Math.max(5, m * 0.035);
      return { inset: { top: p, right: p, bottom: p, left: p }, radius: 1, innerRadius: 0, bg: "#FFFFFF", shadow: "0 6px 16px rgba(30,26,15,0.2)", tape: true };
    }
    case "soft":
      return { inset: { top: 0, right: 0, bottom: 0, left: 0 }, radius: 8, innerRadius: 8, bg: "transparent", shadow: "0 10px 26px rgba(30,26,15,0.25)" };
    default:
      return { inset: { top: 0, right: 0, bottom: 0, left: 0 }, radius: 0, innerRadius: 0, bg: "transparent", shadow: "none" };
  }
}

// ------------------------------------------------------------
// Rasm filtrlari
// ------------------------------------------------------------
export const DEFAULT_FILTER = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hue: 0 };

export const FILTER_PRESETS = [
  { id: "original", name: "Original", values: { ...DEFAULT_FILTER } },
  { id: "vivid", name: "Yorqin", values: { ...DEFAULT_FILTER, brightness: 106, contrast: 110, saturate: 125 } },
  { id: "warm", name: "Iliq", values: { ...DEFAULT_FILTER, brightness: 104, saturate: 112, sepia: 18 } },
  { id: "cool", name: "Salqin", values: { ...DEFAULT_FILTER, saturate: 90, hue: -12, brightness: 102 } },
  { id: "soft", name: "Yumshoq", values: { ...DEFAULT_FILTER, brightness: 106, contrast: 90, saturate: 86, sepia: 8 } },
  { id: "fade", name: "Xira", values: { ...DEFAULT_FILTER, brightness: 110, contrast: 82, saturate: 80 } },
  { id: "bw", name: "Qora-oq", values: { ...DEFAULT_FILTER, brightness: 104, contrast: 114, saturate: 0, grayscale: 100 } },
  { id: "vintage", name: "Vintage", values: { ...DEFAULT_FILTER, brightness: 103, contrast: 96, saturate: 78, sepia: 42 } },
  { id: "dramatic", name: "Dramatik", values: { ...DEFAULT_FILTER, brightness: 94, contrast: 132, saturate: 108 } },
];

export function filterCss(f) {
  if (!f) return undefined;
  const v = { ...DEFAULT_FILTER, ...f };
  if (isDefaultFilter(v)) return undefined;
  return `brightness(${v.brightness / 100}) contrast(${v.contrast / 100}) saturate(${v.saturate / 100}) grayscale(${v.grayscale / 100}) sepia(${v.sepia / 100}) hue-rotate(${v.hue}deg)`;
}

export function isDefaultFilter(f) {
  const v = { ...DEFAULT_FILTER, ...(f || {}) };
  return Object.keys(DEFAULT_FILTER).every((k) => v[k] === DEFAULT_FILTER[k]);
}

export const ZOOM_LEVELS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2, 3];
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 4;
