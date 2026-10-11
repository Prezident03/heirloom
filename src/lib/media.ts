import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";

export type MediaItem = {
  id: string;
  family_id: string;
  url: string;
  kind: "photo" | "video";
  width: number | null;
  height: number | null;
  created_by: string;
  created_at: string;
};

/** Oila yuklagan barcha rasm/videolar (albomga qo'yilmaganlari ham). */
export async function getMediaForFamily(familyId: string): Promise<MediaItem[]> {
  await ensureSchema();
  return (await sql`
    SELECT * FROM family_media WHERE family_id = ${familyId} ORDER BY created_at DESC LIMIT 500
  `) as MediaItem[];
}

export async function addMedia(
  familyId: string,
  createdBy: string,
  input: { url: string; kind: "photo" | "video"; width?: number | null; height?: number | null }
): Promise<MediaItem> {
  await ensureSchema();
  const item: MediaItem = {
    id: randomUUID(),
    family_id: familyId,
    url: input.url,
    kind: input.kind,
    width: input.width ? Math.round(input.width) : null,
    height: input.height ? Math.round(input.height) : null,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
  await sql`
    INSERT INTO family_media (id, family_id, url, kind, width, height, created_by, created_at)
    VALUES (${item.id}, ${item.family_id}, ${item.url}, ${item.kind}, ${item.width}, ${item.height}, ${item.created_by}, ${item.created_at})
  `;
  return item;
}
