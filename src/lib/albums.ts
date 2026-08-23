import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";

export type Album = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  date_label: string | null;
  location: string | null;
  cover_url: string | null;
  created_by: string;
  created_at: string;
};

export type AlbumPage = {
  id: string;
  album_id: string;
  page_order: number;
  layout_id: string;
  date_label: string | null;
  location: string | null;
  background_id: string;
};

export type PageElement = {
  id: string;
  page_id: string;
  slot_index: number;
  type: "photo" | "text" | "sticker";
  photo_url: string | null;
  text_content: string | null;
  caption: string | null;
  location: string | null;
  created_at: string | null;
  position_x: number | null;
  position_y: number | null;
  position_w: number | null;
  position_h: number | null;
  rotation: number;
  z_index: number;
  frame_style: "polaroid" | "soft" | "none";
  sticker_id: string | null;
  sticker_color: string | null;
  text_size: number | null;
  text_color: string | null;
  text_align: "left" | "center" | "right" | null;
  text_font: "handwriting" | "serif" | "sans" | null;
};

// Fon (page background) tanlovlari — id + gradient ranglar.
export const BACKGROUNDS = {
  paper: { name: "Qog'oz", from: "#F4EDDD", to: "#ECE2C8" },
  sage: { name: "Sage", from: "#E7EDE3", to: "#D3DECB" },
  slate: { name: "Slate", from: "#E4E7E6", to: "#CBD2D0" },
  blush: { name: "Blush", from: "#F3E4DD", to: "#E6C9BC" },
  midnight: { name: "Midnight", from: "#2A3630", to: "#1B231F" },
} as const;
export type BackgroundId = keyof typeof BACKGROUNDS;

// Ramka (photo frame) uslublari.
export const FRAMES = {
  polaroid: { name: "Polaroid" },
  soft: { name: "Yumshoq soya" },
  none: { name: "Ramkasiz" },
} as const;
export type FrameStyle = keyof typeof FRAMES;

// Stikerlar — dekorativ elementlar, PageEditor'da chizib qo'yiladi.
// kind: "icon" — lucide ikonka (rang bilan bo'yaladi); "tape" — washi-lenta
// (rangli chiziq); "shape" — oddiy geometrik shakl (rangli to'ldiriladi).
export const STICKERS = {
  leaf: { name: "Barg", kind: "icon", defaultColor: "#2F4C48" },
  flower: { name: "Gul", kind: "icon", defaultColor: "#2F4C48" },
  heart: { name: "Yurak", kind: "icon", defaultColor: "#A8453A" },
  star: { name: "Yulduz", kind: "icon", defaultColor: "#B8863B" },
  sun: { name: "Quyosh", kind: "icon", defaultColor: "#B8863B" },
  sparkles: { name: "Yulduzcha", kind: "icon", defaultColor: "#B8863B" },
  moon: { name: "Oy", kind: "icon", defaultColor: "#2F4C48" },
  cloud: { name: "Bulut", kind: "icon", defaultColor: "#5C7A73" },
  gift: { name: "Sovg'a", kind: "icon", defaultColor: "#A8453A" },
  cake: { name: "Tort", kind: "icon", defaultColor: "#A8453A" },
  party: { name: "Bayram", kind: "icon", defaultColor: "#B8863B" },
  camera: { name: "Kamera", kind: "icon", defaultColor: "#1E2621" },
  music: { name: "Musiqa", kind: "icon", defaultColor: "#2F4C48" },
  crown: { name: "Toj", kind: "icon", defaultColor: "#B8863B" },
  umbrella: { name: "Soyabon", kind: "icon", defaultColor: "#5C7A73" },
  snowflake: { name: "Qor kristali", kind: "icon", defaultColor: "#5C7A73" },
  smile: { name: "Kulgi", kind: "icon", defaultColor: "#B8863B" },
  feather: { name: "Pat", kind: "icon", defaultColor: "#5C7A73" },
  "circle-shape": { name: "Doira", kind: "shape", defaultColor: "#D9BC85" },
  "square-shape": { name: "Kvadrat", kind: "shape", defaultColor: "#5C7A73" },
  "triangle-shape": { name: "Uchburchak", kind: "shape", defaultColor: "#A8453A" },
  "tape-gold": { name: "Washi-lenta (oltin)", kind: "tape", defaultColor: "#D9BC85" },
  "tape-teal": { name: "Washi-lenta (teal)", kind: "tape", defaultColor: "#5C7A73" },
  "tape-blush": { name: "Washi-lenta (blush)", kind: "tape", defaultColor: "#E6C9BC" },
  "tape-stripe": { name: "Washi-lenta (chiziqli)", kind: "tape", defaultColor: "#B8863B" },
} as const;
export type StickerId = keyof typeof STICKERS;

// Sahifa shablonlari — bular faqat vizual joylashuv, database'da saqlanmaydi.
// Har bir slot: { type, x, y, w, h } (foiz asosida joylashuv).
export const LAYOUTS = {
  l1: { name: "Bitta katta", slots: [{ type: "photo", x: 8, y: 8, w: 84, h: 60 }, { type: "text", x: 8, y: 72, w: 84, h: 20 }] },
  l2: { name: "Ikkita yonma-yon", slots: [{ type: "photo", x: 6, y: 8, w: 41, h: 70 }, { type: "photo", x: 53, y: 8, w: 41, h: 70 }, { type: "text", x: 6, y: 82, w: 88, h: 12 }] },
  l3: { name: "Katta + ikkita kichik", slots: [{ type: "photo", x: 6, y: 6, w: 60, h: 50 }, { type: "photo", x: 68, y: 6, w: 26, h: 24 }, { type: "photo", x: 68, y: 32, w: 26, h: 24 }, { type: "text", x: 6, y: 60, w: 88, h: 32 }] },
  l4: { name: "Uchtasi qatorda", slots: [{ type: "photo", x: 5, y: 10, w: 28, h: 55 }, { type: "photo", x: 36, y: 10, w: 28, h: 55 }, { type: "photo", x: 67, y: 10, w: 28, h: 55 }, { type: "text", x: 5, y: 70, w: 90, h: 22 }] },
} as const;

export type LayoutId = keyof typeof LAYOUTS;

// Tayyor shablonlar — bir bosishda butun sahifani (fon + rasm/matn slotlari +
// dekorativ stikerlar) tayyor kompozitsiya bilan to'ldiradi. Faqat JSON
// konfiguratsiya sifatida saqlanadi, database'da alohida jadval yo'q —
// qo'llanganda oddiy page_elements qatorlariga aylantiriladi.
export type TemplateSlot = {
  type: "photo" | "text";
  x: number;
  y: number;
  w: number;
  h: number;
  frame?: FrameStyle;
  textStyle?: { size?: number; color?: string; align?: TextAlign; font?: TextFont };
};

export type TemplateSticker = {
  stickerId: StickerId;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  rotation?: number;
};

export type Template = {
  name: string;
  category: string;
  backgroundId: BackgroundId;
  slots: TemplateSlot[];
  stickers: TemplateSticker[];
};

const GOLD_SOFT = "#D9BC85";
const PARCHMENT = "#F2EDE2";
const GOLD = "#B8863B";
const TEAL = "#2F4C48";
const TEAL_SOFT = "#5C7A73";
const DANGER = "#A8453A";

export const TEMPLATES = {
  "classic-cream": {
    name: "Klassik",
    category: "Oddiy",
    backgroundId: "paper",
    slots: [
      { type: "photo", x: 8, y: 8, w: 84, h: 58, frame: "polaroid" },
      { type: "text", x: 8, y: 70, w: 84, h: 22, textStyle: { font: "serif", align: "center" } },
    ],
    stickers: [{ stickerId: "tape-gold", x: 38, y: 3, w: 24, h: 7, rotation: -3 }],
  },
  "ikki-esdalik": {
    name: "Ikki xotira",
    category: "Oddiy",
    backgroundId: "sage",
    slots: [
      { type: "photo", x: 6, y: 8, w: 41, h: 68 },
      { type: "photo", x: 53, y: 8, w: 41, h: 68 },
      { type: "text", x: 6, y: 80, w: 88, h: 14, textStyle: { align: "center" } },
    ],
    stickers: [
      { stickerId: "heart", x: 46, y: 4, w: 10, h: 10, color: DANGER },
      { stickerId: "leaf", x: 2, y: 2, w: 9, h: 9, color: TEAL, rotation: -10 },
    ],
  },
  "uch-lavha": {
    name: "Uch lavha",
    category: "Oddiy",
    backgroundId: "slate",
    slots: [
      { type: "photo", x: 5, y: 10, w: 28, h: 55 },
      { type: "photo", x: 36, y: 10, w: 28, h: 55 },
      { type: "photo", x: 67, y: 10, w: 28, h: 55 },
      { type: "text", x: 5, y: 70, w: 90, h: 22, textStyle: { align: "center" } },
    ],
    stickers: [
      { stickerId: "cloud", x: 2, y: 2, w: 10, h: 10, color: TEAL_SOFT },
      { stickerId: "umbrella", x: 88, y: 2, w: 10, h: 10, color: TEAL_SOFT },
    ],
  },
  "minimal-oq": {
    name: "Minimal",
    category: "Oddiy",
    backgroundId: "paper",
    slots: [
      { type: "photo", x: 12, y: 10, w: 76, h: 62, frame: "none" },
      { type: "text", x: 12, y: 76, w: 76, h: 16, textStyle: { align: "center", font: "sans", size: 16 } },
    ],
    stickers: [{ stickerId: "square-shape", x: 4, y: 4, w: 7, h: 7, color: GOLD_SOFT }],
  },
  sayohat: {
    name: "Sayohat kundaligi",
    category: "Sayohat",
    backgroundId: "blush",
    slots: [
      { type: "photo", x: 6, y: 6, w: 60, h: 50, frame: "soft" },
      { type: "photo", x: 68, y: 6, w: 26, h: 24 },
      { type: "photo", x: 68, y: 32, w: 26, h: 24 },
      { type: "text", x: 6, y: 60, w: 88, h: 32, textStyle: { font: "sans" } },
    ],
    stickers: [
      { stickerId: "camera", x: 4, y: 58, w: 10, h: 10, color: "#1E2621" },
      { stickerId: "sun", x: 84, y: 4, w: 10, h: 10, color: GOLD },
      { stickerId: "tape-blush", x: 60, y: 2, w: 22, h: 7, rotation: 4 },
    ],
  },
  "tabiat-sayri": {
    name: "Tabiat sayri",
    category: "Sayohat",
    backgroundId: "sage",
    slots: [
      { type: "photo", x: 6, y: 6, w: 60, h: 50 },
      { type: "photo", x: 68, y: 6, w: 26, h: 24 },
      { type: "photo", x: 68, y: 32, w: 26, h: 24 },
      { type: "text", x: 6, y: 60, w: 88, h: 32, textStyle: { font: "sans" } },
    ],
    stickers: [
      { stickerId: "leaf", x: 2, y: 2, w: 10, h: 10, color: TEAL, rotation: -20 },
      { stickerId: "feather", x: 90, y: 2, w: 8, h: 8, color: TEAL_SOFT, rotation: 15 },
      { stickerId: "cloud", x: 2, y: 90, w: 9, h: 9, color: TEAL_SOFT },
    ],
  },
  "tugilgan-kun": {
    name: "Tug'ilgan kun",
    category: "Bayram",
    backgroundId: "paper",
    slots: [
      { type: "photo", x: 10, y: 10, w: 80, h: 55, frame: "polaroid" },
      { type: "text", x: 10, y: 68, w: 80, h: 24, textStyle: { font: "handwriting", align: "center", size: 26, color: DANGER } },
    ],
    stickers: [
      { stickerId: "cake", x: 4, y: 4, w: 12, h: 12, color: DANGER },
      { stickerId: "party", x: 84, y: 4, w: 12, h: 12, color: GOLD },
      { stickerId: "gift", x: 4, y: 84, w: 10, h: 10, color: TEAL },
      { stickerId: "sparkles", x: 86, y: 84, w: 10, h: 10, color: GOLD },
    ],
  },
  yubiley: {
    name: "Yubiley",
    category: "Bayram",
    backgroundId: "paper",
    slots: [
      { type: "photo", x: 10, y: 8, w: 80, h: 52, frame: "polaroid" },
      { type: "text", x: 10, y: 64, w: 80, h: 26, textStyle: { font: "serif", align: "center", size: 24 } },
    ],
    stickers: [
      { stickerId: "crown", x: 4, y: 4, w: 10, h: 10, color: GOLD },
      { stickerId: "star", x: 88, y: 4, w: 9, h: 9, color: GOLD },
      { stickerId: "tape-gold", x: 38, y: 2, w: 24, h: 6, rotation: 3 },
      { stickerId: "tape-gold", x: 38, y: 60, w: 24, h: 6, rotation: -3 },
    ],
  },
  "bayram-kechasi": {
    name: "Bayram kechasi",
    category: "Bayram",
    backgroundId: "midnight",
    slots: [
      { type: "photo", x: 5, y: 8, w: 28, h: 50 },
      { type: "photo", x: 36, y: 8, w: 28, h: 50 },
      { type: "photo", x: 67, y: 8, w: 28, h: 50 },
      { type: "text", x: 5, y: 64, w: 90, h: 26, textStyle: { align: "center", color: PARCHMENT } },
    ],
    stickers: [
      { stickerId: "party", x: 2, y: 2, w: 9, h: 9, color: GOLD_SOFT },
      { stickerId: "music", x: 90, y: 2, w: 8, h: 8, color: GOLD_SOFT },
      { stickerId: "sparkles", x: 2, y: 92, w: 8, h: 8, color: GOLD_SOFT },
      { stickerId: "sparkles", x: 90, y: 92, w: 8, h: 8, color: GOLD_SOFT },
    ],
  },
  bahor: {
    name: "Bahor kayfiyati",
    category: "Fasllar",
    backgroundId: "sage",
    slots: [
      { type: "photo", x: 8, y: 10, w: 84, h: 56 },
      { type: "text", x: 8, y: 70, w: 84, h: 20, textStyle: { align: "center", font: "serif", color: TEAL } },
    ],
    stickers: [
      { stickerId: "flower", x: 4, y: 4, w: 10, h: 10, color: DANGER },
      { stickerId: "leaf", x: 88, y: 4, w: 9, h: 9, color: TEAL, rotation: 15 },
      { stickerId: "sun", x: 4, y: 88, w: 9, h: 9, color: GOLD },
    ],
  },
  "qish-ertagi": {
    name: "Qish ertagi",
    category: "Fasllar",
    backgroundId: "midnight",
    slots: [
      { type: "photo", x: 8, y: 10, w: 84, h: 54, frame: "soft" },
      { type: "text", x: 8, y: 68, w: 84, h: 24, textStyle: { align: "center", color: PARCHMENT, font: "serif" } },
    ],
    stickers: [
      { stickerId: "snowflake", x: 4, y: 4, w: 9, h: 9, color: GOLD_SOFT },
      { stickerId: "moon", x: 86, y: 4, w: 9, h: 9, color: GOLD_SOFT },
      { stickerId: "star", x: 4, y: 86, w: 8, h: 8, color: GOLD_SOFT },
      { stickerId: "sparkles", x: 88, y: 86, w: 8, h: 8, color: GOLD_SOFT },
    ],
  },
  "romantik-kech": {
    name: "Romantik kech",
    category: "Romantik",
    backgroundId: "midnight",
    slots: [
      { type: "photo", x: 15, y: 8, w: 70, h: 58, frame: "polaroid" },
      { type: "text", x: 15, y: 70, w: 70, h: 20, textStyle: { align: "center", font: "handwriting", color: GOLD_SOFT } },
    ],
    stickers: [
      { stickerId: "heart", x: 4, y: 4, w: 9, h: 9, color: DANGER },
      { stickerId: "moon", x: 88, y: 4, w: 9, h: 9, color: GOLD_SOFT },
      { stickerId: "sparkles", x: 4, y: 88, w: 8, h: 8, color: GOLD_SOFT },
    ],
  },
  "bolalik-lahzalari": {
    name: "Bolalik lahzalari",
    category: "Oila",
    backgroundId: "blush",
    slots: [
      { type: "photo", x: 6, y: 8, w: 41, h: 66 },
      { type: "photo", x: 53, y: 8, w: 41, h: 66 },
      { type: "text", x: 6, y: 78, w: 88, h: 16, textStyle: { align: "center", font: "handwriting" } },
    ],
    stickers: [
      { stickerId: "smile", x: 46, y: 3, w: 9, h: 9, color: GOLD },
      { stickerId: "crown", x: 2, y: 2, w: 9, h: 9, color: GOLD, rotation: -8 },
      { stickerId: "star", x: 90, y: 2, w: 8, h: 8, color: GOLD },
    ],
  },
} as const satisfies Record<string, Template>;
export type TemplateId = keyof typeof TEMPLATES;

/** Sahifaga tayyor shablonni qo'llaydi — eski elementlar o'chib, shablon
 * bo'yicha fon, rasm/matn slotlari va dekorativ stikerlar yaratiladi. */
export async function applyPageTemplate(pageId: string, templateId: TemplateId): Promise<void> {
  await ensureSchema();
  const tpl = TEMPLATES[templateId];
  if (!tpl) return;

  await sql`UPDATE album_pages SET background_id = ${tpl.backgroundId} WHERE id = ${pageId}`;
  await sql`DELETE FROM page_elements WHERE page_id = ${pageId}`;

  const now = new Date().toISOString();
  let slotIndex = 0;

  for (const slot of tpl.slots) {
    const id = randomUUID();
    if (slot.type === "photo") {
      await sql`
        INSERT INTO page_elements (id, page_id, slot_index, type, created_at, position_x, position_y, position_w, position_h, rotation, z_index, frame_style)
        VALUES (${id}, ${pageId}, ${slotIndex}, 'photo', ${now}, ${slot.x}, ${slot.y}, ${slot.w}, ${slot.h}, 0, ${slotIndex}, ${slot.frame || "polaroid"})
      `;
    } else {
      const ts = slot.textStyle;
      await sql`
        INSERT INTO page_elements (id, page_id, slot_index, type, text_content, created_at, position_x, position_y, position_w, position_h, rotation, z_index, text_size, text_color, text_align, text_font)
        VALUES (${id}, ${pageId}, ${slotIndex}, 'text', '', ${now}, ${slot.x}, ${slot.y}, ${slot.w}, ${slot.h}, 0, ${slotIndex}, ${ts?.size ?? null}, ${ts?.color ?? null}, ${ts?.align ?? null}, ${ts?.font ?? null})
      `;
    }
    slotIndex++;
  }

  for (const st of tpl.stickers) {
    const id = randomUUID();
    const color = st.color || STICKERS[st.stickerId]?.defaultColor || null;
    await sql`
      INSERT INTO page_elements (id, page_id, slot_index, type, sticker_id, sticker_color, created_at, position_x, position_y, position_w, position_h, rotation, z_index)
      VALUES (${id}, ${pageId}, ${slotIndex}, 'sticker', ${st.stickerId}, ${color}, ${now}, ${st.x}, ${st.y}, ${st.w}, ${st.h}, ${st.rotation ?? 0}, ${slotIndex})
    `;
    slotIndex++;
  }
}

export async function createAlbum(
  familyId: string,
  createdBy: string,
  input: { title: string; description?: string; dateLabel?: string; location?: string }
): Promise<Album> {
  await ensureSchema();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const title = input.title.trim();

  await sql`
    INSERT INTO albums (id, family_id, title, description, date_label, location, created_by, created_at)
    VALUES (${id}, ${familyId}, ${title}, ${input.description?.trim() || null}, ${input.dateLabel?.trim() || null}, ${input.location?.trim() || null}, ${createdBy}, ${createdAt})
  `;

  // Har bir yangi albom bo'sh birinchi sahifa bilan boshlanadi.
  await createAlbumPage(id, "l1");

  return {
    id,
    family_id: familyId,
    title,
    description: input.description?.trim() || null,
    date_label: input.dateLabel?.trim() || null,
    location: input.location?.trim() || null,
    cover_url: null,
    created_by: createdBy,
    created_at: createdAt,
  };
}

export async function getAlbumsForFamily(familyId: string): Promise<Album[]> {
  await ensureSchema();
  return (await sql`SELECT * FROM albums WHERE family_id = ${familyId} ORDER BY created_at DESC`) as Album[];
}

export async function getAlbumById(albumId: string, familyId: string): Promise<Album | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM albums WHERE id = ${albumId} AND family_id = ${familyId}`) as Album[];
  return rows[0] ?? null;
}

export async function deleteAlbum(albumId: string, familyId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM page_elements WHERE page_id IN (SELECT id FROM album_pages WHERE album_id = ${albumId})`;
  await sql`DELETE FROM album_pages WHERE album_id = ${albumId}`;
  await sql`DELETE FROM albums WHERE id = ${albumId} AND family_id = ${familyId}`;
}

export async function getPagesForAlbum(albumId: string): Promise<AlbumPage[]> {
  await ensureSchema();
  return (await sql`SELECT * FROM album_pages WHERE album_id = ${albumId} ORDER BY page_order ASC`) as AlbumPage[];
}

export async function getElementsForPages(pageIds: string[]): Promise<PageElement[]> {
  await ensureSchema();
  if (pageIds.length === 0) return [];
  return (await sql`SELECT * FROM page_elements WHERE page_id = ANY(${pageIds})`) as PageElement[];
}

/** Berilgan layout bo'yicha bo'sh slotlar bilan yangi sahifa yaratadi. */
export async function createAlbumPage(albumId: string, layoutId: LayoutId): Promise<AlbumPage> {
  await ensureSchema();
  const existing = (await sql`SELECT COUNT(*)::int AS c FROM album_pages WHERE album_id = ${albumId}`) as { c: number }[];
  const order = existing[0]?.c ?? 0;

  const id = randomUUID();
  await sql`INSERT INTO album_pages (id, album_id, page_order, layout_id) VALUES (${id}, ${albumId}, ${order}, ${layoutId})`;
  await createEmptyElements(id, layoutId);

  return { id, album_id: albumId, page_order: order, layout_id: layoutId, date_label: null, location: null, background_id: "paper" };
}

async function createEmptyElements(pageId: string, layoutId: LayoutId): Promise<void> {
  const layout = LAYOUTS[layoutId];
  const now = new Date().toISOString();
  for (let i = 0; i < layout.slots.length; i++) {
    const slot = layout.slots[i];
    await sql`
      INSERT INTO page_elements (id, page_id, slot_index, type, photo_url, text_content, created_at, position_x, position_y, position_w, position_h, rotation, z_index)
      VALUES (${randomUUID()}, ${pageId}, ${i}, ${slot.type}, ${null}, ${slot.type === "text" ? "" : null}, ${now}, ${slot.x}, ${slot.y}, ${slot.w}, ${slot.h}, 0, ${i})
    `;
  }
}

/** Sahifaning layoutini o'zgartiradi — eski elementlar o'chib, yangi bo'sh slotlar yaratiladi. */
export async function changePageLayout(pageId: string, layoutId: LayoutId): Promise<void> {
  await ensureSchema();
  await sql`UPDATE album_pages SET layout_id = ${layoutId} WHERE id = ${pageId}`;
  await sql`DELETE FROM page_elements WHERE page_id = ${pageId}`;
  await createEmptyElements(pageId, layoutId);
}

export async function updateElementPhoto(elementId: string, photoUrl: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE page_elements SET photo_url = ${photoUrl} WHERE id = ${elementId}`;
}

export async function updateElementText(elementId: string, text: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE page_elements SET text_content = ${text} WHERE id = ${elementId}`;
}

export async function updatePageMeta(pageId: string, dateLabel: string, location: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE album_pages SET date_label = ${dateLabel || null}, location = ${location || null} WHERE id = ${pageId}`;
}

export async function setAlbumCover(albumId: string, coverUrl: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE albums SET cover_url = ${coverUrl} WHERE id = ${albumId}`;
}

export async function deletePage(pageId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM page_elements WHERE page_id = ${pageId}`;
  await sql`DELETE FROM album_pages WHERE id = ${pageId}`;
}

export async function deleteElement(elementId: string, pageId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM page_elements WHERE id = ${elementId} AND page_id = ${pageId}`;
}

export async function reorderPageElements(pageId: string, elementIds: string[]): Promise<void> {
  await ensureSchema();
  for (let i = 0; i < elementIds.length; i++) {
    await sql`UPDATE page_elements SET slot_index = ${i} WHERE id = ${elementIds[i]} AND page_id = ${pageId}`;
  }
}

export async function moveElementUp(elementId: string, pageId: string): Promise<void> {
  await ensureSchema();
  const element = (await sql`SELECT slot_index FROM page_elements WHERE id = ${elementId} AND page_id = ${pageId}`) as { slot_index: number }[];
  if (!element[0] || element[0].slot_index === 0) return;
  const currentIndex = element[0].slot_index;
  const prevElement = (await sql`SELECT id FROM page_elements WHERE page_id = ${pageId} AND slot_index = ${currentIndex - 1}`) as { id: string }[];
  if (prevElement[0]) {
    await sql`UPDATE page_elements SET slot_index = ${currentIndex} WHERE id = ${prevElement[0].id}`;
    await sql`UPDATE page_elements SET slot_index = ${currentIndex - 1} WHERE id = ${elementId}`;
  }
}

export async function moveElementDown(elementId: string, pageId: string): Promise<void> {
  await ensureSchema();
  const element = (await sql`SELECT slot_index FROM page_elements WHERE id = ${elementId} AND page_id = ${pageId}`) as { slot_index: number }[];
  if (!element[0]) return;
  const currentIndex = element[0].slot_index;
  const nextElement = (await sql`SELECT id FROM page_elements WHERE page_id = ${pageId} AND slot_index = ${currentIndex + 1}`) as { id: string }[];
  if (nextElement[0]) {
    await sql`UPDATE page_elements SET slot_index = ${currentIndex} WHERE id = ${nextElement[0].id}`;
    await sql`UPDATE page_elements SET slot_index = ${currentIndex + 1} WHERE id = ${elementId}`;
  }
}

export async function updateElementPosition(
  elementId: string,
  pageId: string,
  pos: { x: number; y: number; w: number; h: number; zIndex?: number; rotation?: number }
): Promise<void> {
  await ensureSchema();
  if (pos.x !== undefined) {
    await sql`UPDATE page_elements SET position_x = ${pos.x} WHERE id = ${elementId} AND page_id = ${pageId}`;
  }
  if (pos.y !== undefined) {
    await sql`UPDATE page_elements SET position_y = ${pos.y} WHERE id = ${elementId} AND page_id = ${pageId}`;
  }
  if (pos.w !== undefined) {
    await sql`UPDATE page_elements SET position_w = ${pos.w} WHERE id = ${elementId} AND page_id = ${pageId}`;
  }
  if (pos.h !== undefined) {
    await sql`UPDATE page_elements SET position_h = ${pos.h} WHERE id = ${elementId} AND page_id = ${pageId}`;
  }
  if (pos.zIndex !== undefined) {
    await sql`UPDATE page_elements SET z_index = ${pos.zIndex} WHERE id = ${elementId} AND page_id = ${pageId}`;
  }
  if (pos.rotation !== undefined) {
    await sql`UPDATE page_elements SET rotation = ${pos.rotation} WHERE id = ${elementId} AND page_id = ${pageId}`;
  }
}

export async function updateElementCaption(elementId: string, caption: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE page_elements SET caption = ${caption.trim() || null} WHERE id = ${elementId}`;
}

export async function updateElementLocation(elementId: string, location: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE page_elements SET location = ${location.trim() || null} WHERE id = ${elementId}`;
}

export async function updatePageBackground(pageId: string, backgroundId: BackgroundId): Promise<void> {
  await ensureSchema();
  await sql`UPDATE album_pages SET background_id = ${backgroundId} WHERE id = ${pageId}`;
}

export async function updateElementFrame(elementId: string, frameStyle: FrameStyle): Promise<void> {
  await ensureSchema();
  await sql`UPDATE page_elements SET frame_style = ${frameStyle} WHERE id = ${elementId}`;
}

export type TextAlign = "left" | "center" | "right";
export type TextFont = "handwriting" | "serif" | "sans";

/** Matn elementining shrift o'lchami, rangi, tekislash va shrift oilasini yangilaydi. */
export async function updateElementTextStyle(
  elementId: string,
  style: { size: number; color: string; align: TextAlign; font: TextFont }
): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE page_elements
    SET text_size = ${style.size}, text_color = ${style.color}, text_align = ${style.align}, text_font = ${style.font}
    WHERE id = ${elementId}
  `;
}

/** Sahifaga yangi dekorativ stiker elementi qo'shadi (erkin joylashuv bilan). */
export async function addStickerElement(
  pageId: string,
  stickerId: StickerId,
  pos: { x: number; y: number; w: number; h: number },
  color?: string
): Promise<string> {
  await ensureSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  const maxSlotRows = (await sql`SELECT COALESCE(MAX(slot_index), -1)::int AS m FROM page_elements WHERE page_id = ${pageId}`) as { m: number }[];
  const maxZRows = (await sql`SELECT COALESCE(MAX(z_index), 0)::int AS m FROM page_elements WHERE page_id = ${pageId}`) as { m: number }[];
  const stickerColor = color || STICKERS[stickerId]?.defaultColor || null;
  await sql`
    INSERT INTO page_elements (id, page_id, slot_index, type, sticker_id, sticker_color, created_at, position_x, position_y, position_w, position_h, rotation, z_index)
    VALUES (${id}, ${pageId}, ${maxSlotRows[0].m + 1}, 'sticker', ${stickerId}, ${stickerColor}, ${now}, ${pos.x}, ${pos.y}, ${pos.w}, ${pos.h}, 0, ${maxZRows[0].m + 1})
  `;
  return id;
}

/** Stiker elementining rangini yangilaydi. */
export async function updateElementStickerColor(elementId: string, color: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE page_elements SET sticker_color = ${color} WHERE id = ${elementId}`;
}

/** Sahifaga yangi bo'sh matn elementi qo'shadi (erkin joylashuv bilan). */
export async function addTextElement(
  pageId: string,
  pos: { x: number; y: number; w: number; h: number }
): Promise<string> {
  await ensureSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  const maxSlotRows = (await sql`SELECT COALESCE(MAX(slot_index), -1)::int AS m FROM page_elements WHERE page_id = ${pageId}`) as { m: number }[];
  const maxZRows = (await sql`SELECT COALESCE(MAX(z_index), 0)::int AS m FROM page_elements WHERE page_id = ${pageId}`) as { m: number }[];
  await sql`
    INSERT INTO page_elements (id, page_id, slot_index, type, text_content, created_at, position_x, position_y, position_w, position_h, rotation, z_index)
    VALUES (${id}, ${pageId}, ${maxSlotRows[0].m + 1}, 'text', '', ${now}, ${pos.x}, ${pos.y}, ${pos.w}, ${pos.h}, 0, ${maxZRows[0].m + 1})
  `;
  return id;
}

/** Sahifaga yangi bo'sh rasm elementi qo'shadi (erkin joylashuv bilan). */
export async function addPhotoElement(
  pageId: string,
  pos: { x: number; y: number; w: number; h: number }
): Promise<string> {
  await ensureSchema();
  const id = randomUUID();
  const now = new Date().toISOString();
  const maxSlotRows = (await sql`SELECT COALESCE(MAX(slot_index), -1)::int AS m FROM page_elements WHERE page_id = ${pageId}`) as { m: number }[];
  const maxZRows = (await sql`SELECT COALESCE(MAX(z_index), 0)::int AS m FROM page_elements WHERE page_id = ${pageId}`) as { m: number }[];
  await sql`
    INSERT INTO page_elements (id, page_id, slot_index, type, created_at, position_x, position_y, position_w, position_h, rotation, z_index, frame_style)
    VALUES (${id}, ${pageId}, ${maxSlotRows[0].m + 1}, 'photo', ${now}, ${pos.x}, ${pos.y}, ${pos.w}, ${pos.h}, 0, ${maxZRows[0].m + 1}, 'polaroid')
  `;
  return id;
}

export async function changeZIndex(elementId: string, pageId: string, direction: "up" | "down"): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, z_index FROM page_elements
    WHERE page_id = ${pageId}
    ORDER BY z_index ASC, slot_index ASC
  `) as { id: string; z_index: number }[];
  const idx = rows.findIndex((r) => r.id === elementId);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx + 1 : idx - 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx];
  const b = rows[swapIdx];
  await sql`UPDATE page_elements SET z_index = ${b.z_index} WHERE id = ${a.id} AND page_id = ${pageId}`;
  await sql`UPDATE page_elements SET z_index = ${a.z_index} WHERE id = ${b.id} AND page_id = ${pageId}`;
}

export async function duplicateElement(elementId: string, pageId: string): Promise<string | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM page_elements WHERE id = ${elementId} AND page_id = ${pageId}`) as (PageElement & { slot_index: number })[];
  const src = rows[0];
  if (!src) return null;
  const newId = randomUUID();
  const maxSlotRows = (await sql`SELECT COALESCE(MAX(slot_index), -1)::int AS m FROM page_elements WHERE page_id = ${pageId}`) as { m: number }[];
  const maxZRows = (await sql`SELECT COALESCE(MAX(z_index), 0)::int AS m FROM page_elements WHERE page_id = ${pageId}`) as { m: number }[];
  const now = new Date().toISOString();
  await sql`
    INSERT INTO page_elements (id, page_id, slot_index, type, photo_url, text_content, caption, location, created_at, position_x, position_y, position_w, position_h, rotation, z_index, frame_style, sticker_id, sticker_color, text_size, text_color, text_align, text_font)
    VALUES (
      ${newId},
      ${pageId},
      ${maxSlotRows[0].m + 1},
      ${src.type},
      ${src.photo_url},
      ${src.text_content},
      ${src.caption},
      ${src.location},
      ${now},
      ${(src.position_x ?? 8) + 3},
      ${(src.position_y ?? 8) + 3},
      ${src.position_w ?? 40},
      ${src.position_h ?? 40},
      ${src.rotation ?? 0},
      ${maxZRows[0].m + 1},
      ${src.frame_style ?? "polaroid"},
      ${src.sticker_id ?? null},
      ${src.sticker_color ?? null},
      ${src.text_size ?? 22},
      ${src.text_color ?? "#2E362F"},
      ${src.text_align ?? "left"},
      ${src.text_font ?? "handwriting"}
    )
  `;
  return newId;
}
