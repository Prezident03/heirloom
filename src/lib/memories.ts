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

export async function getMemoriesForPerson(personId: string): Promise<Memory[]> {
  const result = await sql`
    SELECT * FROM memories
    WHERE person_id = ${personId}
    ORDER BY memory_date DESC NULLS LAST, created_at DESC
  `;

  return result as Memory[];
}

export async function updateMemory(
  id: string,
  title: string,
  description: string | null,
  memoryDate: string | null,
  location: string | null,
  personId: string | null
): Promise<Memory> {
  const result = await sql`
    UPDATE memories
    SET title = ${title}, description = ${description}, memory_date = ${memoryDate}, location = ${location}, person_id = ${personId}
    WHERE id = ${id}
    RETURNING *
  `;

  return result[0] as Memory;
}

export async function updateMemoryPhoto(id: string, photoUrl: string): Promise<Memory> {
  const result = await sql`
    UPDATE memories
    SET photo_url = ${photoUrl}
    WHERE id = ${id}
    RETURNING *
  `;

  return result[0] as Memory;
}

export async function deleteMemory(id: string): Promise<void> {
  await sql`
    DELETE FROM memories
    WHERE id = ${id}
  `;
}

export async function getMemoryById(id: string): Promise<Memory | null> {
  const result = await sql`
    SELECT * FROM memories
    WHERE id = ${id}
  `;

  return result.length > 0 ? (result[0] as Memory) : null;
}
