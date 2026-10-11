import { randomUUID, randomBytes } from "node:crypto";
import { sql, sqlTransaction, ensureSchema } from "./db";

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
  cover_custom?: boolean | null;
  share_token?: string | null;
  page_format?: string | null;
};

export const PAGE_FORMAT_IDS = ["16:9", "3:2", "4:3", "1:1"];

export type AlbumPage = {
  id: string;
  album_id: string;
  page_order: number;
  layout_id: string;
  date_label: string | null;
  location: string | null;
  background_id: string;
  background_image_url: string | null;
};

export type ElementType = "photo" | "text" | "sticker" | "video";

export type PageElement = {
  id: string;
  page_id: string;
  slot_index: number;
  type: ElementType;
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
  frame_style: string | null;
  sticker_id: string | null;
  sticker_color: string | null;
  text_size: number | null;
  text_color: string | null;
  text_align: "left" | "center" | "right" | null;
  text_font: string | null;
  group_id: string | null;
  crop_scale: number | null;
  crop_dx: number | null;
  crop_dy: number | null;
  flip_h: boolean | null;
  flip_v: boolean | null;
  photo_filter: string | null;
  extra: string | null;
};

// ============================================================
// Albomlar
// ============================================================

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
    INSERT INTO albums (id, family_id, title, description, date_label, location, created_by, created_at, page_format)
    VALUES (${id}, ${familyId}, ${title}, ${input.description?.trim() || null}, ${input.dateLabel?.trim() || null}, ${input.location?.trim() || null}, ${createdBy}, ${createdAt}, '16:9')
  `;

  await createAlbumPage(id);

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
  // Avval albom shu oilaga tegishli ekanini tekshiramiz — aks holda boshqa
  // oilaning sahifa/elementlari o'chib ketishi mumkin edi.
  const album = await getAlbumById(albumId, familyId);
  if (!album) return;
  await sqlTransaction((tx) => [
    tx`DELETE FROM page_elements WHERE page_id IN (SELECT id FROM album_pages WHERE album_id = ${albumId})`,
    tx`DELETE FROM album_pages WHERE album_id = ${albumId}`,
    tx`DELETE FROM albums WHERE id = ${albumId} AND family_id = ${familyId}`,
  ]);
}

export async function updateAlbumTitle(albumId: string, familyId: string, title: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE albums SET title = ${title.trim()} WHERE id = ${albumId} AND family_id = ${familyId}`;
}

export async function setAlbumCover(albumId: string, coverUrl: string | null): Promise<void> {
  await ensureSchema();
  await sql`UPDATE albums SET cover_url = ${coverUrl} WHERE id = ${albumId}`;
}

/** Foydalanuvchi qo'lda tanlagan muqova — keyingi saqlashlarda avtomatik almashtirilmaydi. */
export async function setCustomAlbumCover(albumId: string, familyId: string, coverUrl: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE albums SET cover_url = ${coverUrl}, cover_custom = TRUE WHERE id = ${albumId} AND family_id = ${familyId}`;
}

/** Muqovani avtomatik holatga qaytaradi: albomdagi birinchi rasm. */
export async function resetAlbumCover(albumId: string, familyId: string): Promise<void> {
  await ensureSchema();
  const rows = (await sql`
    SELECT pe.photo_url FROM page_elements pe
    JOIN album_pages ap ON ap.id = pe.page_id
    WHERE ap.album_id = ${albumId} AND pe.type = 'photo' AND pe.photo_url IS NOT NULL
    ORDER BY ap.page_order ASC, pe.z_index ASC
    LIMIT 1
  `) as { photo_url: string }[];
  await sql`UPDATE albums SET cover_url = ${rows[0]?.photo_url ?? null}, cover_custom = FALSE WHERE id = ${albumId} AND family_id = ${familyId}`;
}

// ============================================================
// Sahifalar va elementlar
// ============================================================

export async function getPagesForAlbum(albumId: string): Promise<AlbumPage[]> {
  await ensureSchema();
  return (await sql`SELECT * FROM album_pages WHERE album_id = ${albumId} ORDER BY page_order ASC`) as AlbumPage[];
}

export async function getElementsForPages(pageIds: string[]): Promise<PageElement[]> {
  await ensureSchema();
  if (pageIds.length === 0) return [];
  return (await sql`SELECT * FROM page_elements WHERE page_id = ANY(${pageIds})`) as PageElement[];
}

async function nextPageOrder(albumId: string): Promise<number> {
  const rows = (await sql`SELECT COALESCE(MAX(page_order), -1)::int AS m FROM album_pages WHERE album_id = ${albumId}`) as { m: number }[];
  return (rows[0]?.m ?? -1) + 1;
}

/** Bo'sh (elementlarsiz) sahifa yaratadi. */
export async function createAlbumPage(albumId: string): Promise<AlbumPage> {
  await ensureSchema();
  const order = await nextPageOrder(albumId);
  const id = randomUUID();
  await sql`INSERT INTO album_pages (id, album_id, page_order, layout_id, background_id) VALUES (${id}, ${albumId}, ${order}, 'free', 'paper')`;
  return { id, album_id: albumId, page_order: order, layout_id: "free", date_label: null, location: null, background_id: "paper", background_image_url: null };
}

/** Bitta katta rasmli sahifa yaratadi (ommaviy yuklash uchun). */
export async function createPhotoPage(albumId: string, photoUrl: string): Promise<string> {
  await ensureSchema();
  const order = await nextPageOrder(albumId);
  const pageId = randomUUID();
  const now = new Date().toISOString();
  await sqlTransaction((tx) => [
    tx`INSERT INTO album_pages (id, album_id, page_order, layout_id, background_id) VALUES (${pageId}, ${albumId}, ${order}, 'free', 'paper')`,
    tx`
      INSERT INTO page_elements (id, page_id, slot_index, type, photo_url, created_at, position_x, position_y, position_w, position_h, rotation, z_index, frame_style)
      VALUES (${randomUUID()}, ${pageId}, 0, 'photo', ${photoUrl}, ${now}, 12, 8, 76, 84, -1.5, 0, 'polaroid')
    `,
  ]);
  return pageId;
}

// ============================================================
// Editor holatini saqlash (sinxronlash)
// ============================================================

export type SaveElementInput = {
  id: string;
  type: ElementType;
  photo_url?: string | null;
  text_content?: string | null;
  caption?: string | null;
  location?: string | null;
  created_at?: string | null;
  position_x: number;
  position_y: number;
  position_w: number;
  position_h: number;
  rotation?: number;
  frame_style?: string | null;
  sticker_id?: string | null;
  sticker_color?: string | null;
  text_size?: number | null;
  text_color?: string | null;
  text_align?: string | null;
  text_font?: string | null;
  group_id?: string | null;
  crop_scale?: number | null;
  flip_h?: boolean | null;
  flip_v?: boolean | null;
  photo_filter?: string | null;
  extra?: string | null;
};

export type SavePageInput = {
  id: string;
  background_id?: string | null;
  background_image_url?: string | null;
  date_label?: string | null;
  location?: string | null;
  elements: SaveElementInput[];
};

export type SaveAlbumInput = {
  /** Albomdagi BARCHA sahifalarning yangi tartibi. Bu ro'yxatda yo'q sahifalar o'chiriladi. */
  pageOrder: string[];
  /** Faqat o'zgargan sahifalar — ularning elementlari to'liq almashtiriladi. */
  pages: SavePageInput[];
  coverUrl?: string | null;
  pageFormat?: string;
};

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const TOKEN_RE = /^[A-Za-z0-9:#_.-]{1,64}$/;
const ELEMENT_TYPES = new Set<ElementType>(["photo", "text", "sticker", "video"]);
const MAX_PAGES = 200;
const MAX_ELEMENTS_PER_PAGE = 150;

function num(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function str(v: unknown, maxLen: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function httpsUrl(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  if (v.length > 2048) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function token(v: unknown): string | null {
  return typeof v === "string" && TOKEN_RE.test(v) ? v : null;
}

function color(v: unknown): string | null {
  return typeof v === "string" && COLOR_RE.test(v) ? v : null;
}

function jsonText(v: unknown, maxLen: number): string | null {
  if (typeof v !== "string" || !v) return null;
  if (v.length > maxLen) return null;
  try {
    const parsed = JSON.parse(v);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? JSON.stringify(parsed) : null;
  } catch {
    return null;
  }
}

function sanitizeElement(el: SaveElementInput) {
  if (!el || typeof el !== "object" || !ID_RE.test(String(el.id))) throw new Error("Element ID noto'g'ri.");
  if (!ELEMENT_TYPES.has(el.type)) throw new Error("Element turi noto'g'ri.");
  const align = el.text_align === "center" || el.text_align === "right" || el.text_align === "left" ? el.text_align : null;
  return {
    id: String(el.id),
    type: el.type,
    photo_url: httpsUrl(el.photo_url),
    text_content: str(el.text_content, 5000),
    caption: str(el.caption, 500),
    location: str(el.location, 300),
    created_at: str(el.created_at, 40) || new Date().toISOString(),
    position_x: num(el.position_x, -500, 600, 0),
    position_y: num(el.position_y, -500, 600, 0),
    position_w: num(el.position_w, 0.1, 1000, 20),
    position_h: num(el.position_h, 0.1, 1000, 20),
    rotation: num(el.rotation, -3600, 3600, 0),
    frame_style: token(el.frame_style),
    sticker_id: token(el.sticker_id),
    sticker_color: color(el.sticker_color),
    text_size: el.text_size == null ? null : Math.round(num(el.text_size, 1, 1000, 24)),
    text_color: color(el.text_color),
    text_align: align,
    text_font: token(el.text_font),
    group_id: el.group_id && ID_RE.test(String(el.group_id)) ? String(el.group_id) : null,
    crop_scale: el.crop_scale == null ? null : num(el.crop_scale, 1, 20, 1),
    flip_h: !!el.flip_h,
    flip_v: !!el.flip_v,
    photo_filter: jsonText(el.photo_filter, 1000),
    extra: jsonText(el.extra, 4000),
  };
}

function sanitizePage(p: SavePageInput) {
  if (!p || typeof p !== "object" || !ID_RE.test(String(p.id))) throw new Error("Sahifa ID noto'g'ri.");
  const elements = Array.isArray(p.elements) ? p.elements : [];
  if (elements.length > MAX_ELEMENTS_PER_PAGE) throw new Error("Sahifada elementlar juda ko'p.");
  return {
    id: String(p.id),
    background_id: token(p.background_id) || "paper",
    background_image_url: httpsUrl(p.background_image_url),
    date_label: str(p.date_label, 120),
    location: str(p.location, 200),
    elements: elements.map(sanitizeElement),
  };
}

/**
 * Editordagi albom holatini bazaga yozadi. Barcha tekshiruvlar albom
 * aynan shu oilaga tegishli ekaniga va sahifa/element ID'lari boshqa
 * albomlarnikiga to'qnash kelmasligiga asoslanadi.
 */
export async function saveAlbumState(albumId: string, familyId: string, input: SaveAlbumInput): Promise<void> {
  await ensureSchema();
  const album = await getAlbumById(albumId, familyId);
  if (!album) throw new Error("Albom topilmadi.");

  const pageOrder = Array.isArray(input?.pageOrder) ? input.pageOrder.map(String) : [];
  if (pageOrder.length === 0) throw new Error("Albomda kamida bitta sahifa bo'lishi kerak.");
  if (pageOrder.length > MAX_PAGES) throw new Error("Sahifalar juda ko'p.");
  if (new Set(pageOrder).size !== pageOrder.length || pageOrder.some((id) => !ID_RE.test(id))) {
    throw new Error("Sahifa tartibi noto'g'ri.");
  }

  const pages = (Array.isArray(input?.pages) ? input.pages : []).map(sanitizePage);
  const orderSet = new Set(pageOrder);
  if (pages.some((p) => !orderSet.has(p.id))) throw new Error("Saqlanayotgan sahifa tartibda yo'q.");

  const existingRows = (await sql`SELECT id FROM album_pages WHERE album_id = ${albumId}`) as { id: string }[];
  const existing = new Set(existingRows.map((r) => r.id));
  const dirty = new Map(pages.map((p) => [p.id, p]));

  // Yangi sahifa bo'lishi kerak bo'lgan ID'lar boshqa albomda band emasligini tekshiramiz.
  const newIds = pageOrder.filter((id) => !existing.has(id));
  if (newIds.some((id) => !dirty.has(id))) throw new Error("Yangi sahifa ma'lumoti yetishmayapti.");
  if (newIds.length > 0) {
    const taken = (await sql`SELECT id FROM album_pages WHERE id = ANY(${newIds})`) as { id: string }[];
    if (taken.length > 0) throw new Error("Sahifa ID band.");
  }

  // Elementlar ID'si boshqa albomdagi elementga tegishli bo'lmasligi kerak.
  const elementIds = pages.flatMap((p) => p.elements.map((e) => e.id));
  if (new Set(elementIds).size !== elementIds.length) throw new Error("Element ID'lari takrorlangan.");
  if (elementIds.length > 0) {
    const foreign = (await sql`
      SELECT pe.id FROM page_elements pe
      LEFT JOIN album_pages ap ON ap.id = pe.page_id
      WHERE pe.id = ANY(${elementIds}) AND (ap.album_id IS NULL OR ap.album_id <> ${albumId})
    `) as { id: string }[];
    if (foreign.length > 0) throw new Error("Element ID band.");
  }

  const removedPages = [...existing].filter((id) => !orderSet.has(id));
  const dirtyIds = pages.map((p) => p.id);
  const coverUrl = input.coverUrl === undefined ? undefined : httpsUrl(input.coverUrl);

  await sqlTransaction((tx) => {
    const q = [];
    if (removedPages.length > 0) {
      q.push(tx`DELETE FROM page_elements WHERE page_id = ANY(${removedPages})`);
      q.push(tx`DELETE FROM album_pages WHERE album_id = ${albumId} AND id = ANY(${removedPages})`);
    }
    if (dirtyIds.length > 0) {
      q.push(tx`DELETE FROM page_elements WHERE page_id = ANY(${dirtyIds})`);
    }
    pageOrder.forEach((pageId, order) => {
      const p = dirty.get(pageId);
      if (!p) {
        q.push(tx`UPDATE album_pages SET page_order = ${order} WHERE id = ${pageId} AND album_id = ${albumId}`);
        return;
      }
      if (existing.has(pageId)) {
        q.push(tx`
          UPDATE album_pages
          SET page_order = ${order}, background_id = ${p.background_id}, background_image_url = ${p.background_image_url},
              date_label = ${p.date_label}, location = ${p.location}
          WHERE id = ${pageId} AND album_id = ${albumId}
        `);
      } else {
        q.push(tx`
          INSERT INTO album_pages (id, album_id, page_order, layout_id, date_label, location, background_id, background_image_url)
          VALUES (${pageId}, ${albumId}, ${order}, 'free', ${p.date_label}, ${p.location}, ${p.background_id}, ${p.background_image_url})
        `);
      }
      p.elements.forEach((el, index) => {
        q.push(tx`
          INSERT INTO page_elements (
            id, page_id, slot_index, type, photo_url, text_content, caption, location, created_at,
            position_x, position_y, position_w, position_h, rotation, z_index,
            frame_style, sticker_id, sticker_color, text_size, text_color, text_align, text_font,
            group_id, crop_scale, crop_dx, crop_dy, flip_h, flip_v, photo_filter, extra
          ) VALUES (
            ${el.id}, ${pageId}, ${index}, ${el.type}, ${el.photo_url}, ${el.text_content}, ${el.caption}, ${el.location}, ${el.created_at},
            ${el.position_x}, ${el.position_y}, ${el.position_w}, ${el.position_h}, ${el.rotation}, ${index},
            ${el.frame_style}, ${el.sticker_id}, ${el.sticker_color}, ${el.text_size}, ${el.text_color}, ${el.text_align}, ${el.text_font},
            ${el.group_id}, ${el.crop_scale}, 0, 0, ${el.flip_h}, ${el.flip_v}, ${el.photo_filter}, ${el.extra}
          )
        `);
      });
    });
    if (input.pageFormat && PAGE_FORMAT_IDS.includes(input.pageFormat)) {
      q.push(tx`UPDATE albums SET page_format = ${input.pageFormat} WHERE id = ${albumId} AND family_id = ${familyId}`);
    }
    if (coverUrl !== undefined) {
      q.push(tx`UPDATE albums SET cover_url = ${coverUrl} WHERE id = ${albumId} AND family_id = ${familyId} AND COALESCE(cover_custom, FALSE) = FALSE`);
    }
    return q;
  });
}

// ============================================================
// Ulashish (faqat ko'rish uchun havola)
// ============================================================

/** Ulashish havolasini yoqadi (mavjud bo'lsa, o'shani qaytaradi) yoki o'chiradi. */
export async function setAlbumSharing(albumId: string, familyId: string, enabled: boolean): Promise<string | null> {
  await ensureSchema();
  if (!enabled) {
    await sql`UPDATE albums SET share_token = NULL WHERE id = ${albumId} AND family_id = ${familyId}`;
    return null;
  }
  const rows = (await sql`SELECT share_token FROM albums WHERE id = ${albumId} AND family_id = ${familyId}`) as { share_token: string | null }[];
  if (!rows[0]) throw new Error("Albom topilmadi.");
  if (rows[0].share_token) return rows[0].share_token;
  const token = randomBytes(18).toString("base64url");
  await sql`UPDATE albums SET share_token = ${token} WHERE id = ${albumId} AND family_id = ${familyId}`;
  return token;
}

export type SharedAlbum = {
  id: string;
  title: string;
  description: string | null;
  date_label: string | null;
  location: string | null;
  cover_url: string | null;
  page_format: string | null;
  family_name: string;
  pages: (AlbumPage & { elements: PageElement[] })[];
};

/** Havola orqali ochilgan albom — faqat ko'rish uchun kerakli ma'lumotlar. */
export async function getSharedAlbum(token: string): Promise<SharedAlbum | null> {
  await ensureSchema();
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const rows = (await sql`
    SELECT a.id, a.title, a.description, a.date_label, a.location, a.cover_url, a.page_format, f.name AS family_name
    FROM albums a JOIN families f ON f.id = a.family_id
    WHERE a.share_token = ${token}
  `) as Omit<SharedAlbum, "pages">[];
  const album = rows[0];
  if (!album) return null;
  const pages = await getPagesForAlbum(album.id);
  const elements = await getElementsForPages(pages.map((p) => p.id));
  return {
    ...album,
    pages: pages.map((p) => ({ ...p, elements: elements.filter((e) => e.page_id === p.id) })),
  };
}
