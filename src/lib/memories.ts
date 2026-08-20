import { sql } from "@/lib/db";

export interface Memory {
  id: string;
  family_id: string;
  person_id: string | null;
  title: string;
  description: string | null;
  memory_date: string | null;
  photo_url: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
}

export type OnThisDayMemory = Memory & { years_ago: number };

export async function createMemory(
  familyId: string,
  title: string,
  description: string | null,
  memoryDate: string | null,
  photoUrl: string | null,
  location: string | null,
  personId: string | null,
  createdBy: string
): Promise<Memory> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const result = await sql`
    INSERT INTO memories (id, family_id, person_id, title, description, memory_date, photo_url, location, created_by, created_at)
    VALUES (${id}, ${familyId}, ${personId}, ${title}, ${description}, ${memoryDate}, ${photoUrl}, ${location}, ${createdBy}, ${now})
    RETURNING *
  `;

  return result[0] as Memory;
}

export async function getMemoriesForFamily(familyId: string): Promise<Memory[]> {
  const result = await sql`
    SELECT * FROM memories
    WHERE family_id = ${familyId}
    ORDER BY memory_date DESC NULLS LAST, created_at DESC
  `;

  return result as Memory[];
}

export async function getMemoriesForPerson(personId: string, familyId: string): Promise<Memory[]> {
  const result = await sql`
    SELECT * FROM memories
    WHERE person_id = ${personId} AND family_id = ${familyId}
    ORDER BY memory_date DESC NULLS LAST, created_at DESC
  `;

  return result as Memory[];
}

/**
 * Bugungi oy/kunga to'g'ri keladigan xotiralar — "shu kunda N yil oldin".
 * memory_date ustuni erkin matn (TEXT) sifatida saqlanadi, lekin
 * HTML5 <input type="date"> orqali "yyyy-mm-dd" formatida kiritiladi,
 * shuning uchun TO_DATE bilan xavfsiz cast qilinadi. Format mos kelmasa
 * (masalan bo'sh yoki eski qo'lda kiritilgan matn) shu qator sukut
 * bo'yicha chetlab o'tiladi — butun so'rov yiqilmasligi uchun.
 */
export async function getOnThisDayMemories(familyId: string): Promise<OnThisDayMemory[]> {
  const result = await sql`
    SELECT *,
      (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM d.parsed))::int AS years_ago
    FROM (
      SELECT *,
        CASE
          WHEN memory_date ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN TO_DATE(memory_date, 'YYYY-MM-DD')
          ELSE NULL
        END AS parsed
      FROM memories
      WHERE family_id = ${familyId}
    ) d
    WHERE d.parsed IS NOT NULL
      AND EXTRACT(MONTH FROM d.parsed) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM d.parsed) = EXTRACT(DAY FROM CURRENT_DATE)
    ORDER BY d.parsed ASC
  `;

  // Aynan bugun qo'shilgan xotira (0 yil oldin) "shu kunda eslash" feed'ida
  // ma'nosiz — u endigina yaratildi, hali "xotira"ga aylanmagan.
  return (result as (Memory & { parsed: string; years_ago: number })[])
    .filter((r) => r.years_ago > 0)
    .map(({ parsed: _parsed, ...rest }) => rest);
}

export async function updateMemory(
  id: string,
  familyId: string,
  title: string,
  description: string | null,
  memoryDate: string | null,
  location: string | null,
  personId: string | null
): Promise<Memory | null> {
  const result = await sql`
    UPDATE memories
    SET title = ${title}, description = ${description}, memory_date = ${memoryDate}, location = ${location}, person_id = ${personId}
    WHERE id = ${id} AND family_id = ${familyId}
    RETURNING *
  `;

  return result.length > 0 ? (result[0] as Memory) : null;
}

export async function updateMemoryPhoto(id: string, familyId: string, photoUrl: string): Promise<Memory | null> {
  const result = await sql`
    UPDATE memories
    SET photo_url = ${photoUrl}
    WHERE id = ${id} AND family_id = ${familyId}
    RETURNING *
  `;

  return result.length > 0 ? (result[0] as Memory) : null;
}

export async function deleteMemory(id: string, familyId: string): Promise<void> {
  await sql`
    DELETE FROM memories
    WHERE id = ${id} AND family_id = ${familyId}
  `;
}

export async function getMemoryById(id: string, familyId: string): Promise<Memory | null> {
  const result = await sql`
    SELECT * FROM memories
    WHERE id = ${id} AND family_id = ${familyId}
  `;

  return result.length > 0 ? (result[0] as Memory) : null;
}
