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
};

export type PageElement = {
  id: string;
  page_id: string;
  slot_index: number;
  type: "photo" | "text";
  photo_url: string | null;
  text_content: string | null;
};

// Sahifa shablonlari — bular faqat vizual joylashuv, database'da saqlanmaydi.
// Har bir slot: { type, x, y, w, h } (foiz asosida joylashuv).
export const LAYOUTS = {
  l1: { name: "Bitta katta", slots: [{ type: "photo", x: 8, y: 8, w: 84, h: 60 }, { type: "text", x: 8, y: 72, w: 84, h: 20 }] },
  l2: { name: "Ikkita yonma-yon", slots: [{ type: "photo", x: 6, y: 8, w: 41, h: 70 }, { type: "photo", x: 53, y: 8, w: 41, h: 70 }, { type: "text", x: 6, y: 82, w: 88, h: 12 }] },
  l3: { name: "Katta + ikkita kichik", slots: [{ type: "photo", x: 6, y: 6, w: 60, h: 50 }, { type: "photo", x: 68, y: 6, w: 26, h: 24 }, { type: "photo", x: 68, y: 32, w: 26, h: 24 }, { type: "text", x: 6, y: 60, w: 88, h: 32 }] },
  l4: { name: "Uchtasi qatorda", slots: [{ type: "photo", x: 5, y: 10, w: 28, h: 55 }, { type: "photo", x: 36, y: 10, w: 28, h: 55 }, { type: "photo", x: 67, y: 10, w: 28, h: 55 }, { type: "text", x: 5, y: 70, w: 90, h: 22 }] },
} as const;

export type LayoutId = keyof typeof LAYOUTS;

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

  return { id, album_id: albumId, page_order: order, layout_id: layoutId, date_label: null, location: null };
}

async function createEmptyElements(pageId: string, layoutId: LayoutId): Promise<void> {
  const layout = LAYOUTS[layoutId];
  for (let i = 0; i < layout.slots.length; i++) {
    const slot = layout.slots[i];
    await sql`
      INSERT INTO page_elements (id, page_id, slot_index, type, photo_url, text_content)
      VALUES (${randomUUID()}, ${pageId}, ${i}, ${slot.type}, ${null}, ${slot.type === "text" ? "" : null})
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
