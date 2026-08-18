import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";

export type Story = {
  id: string;
  family_id: string;
  title: string;
  content: string;
  person_id: string | null;
  location: string | null;
  story_date: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export async function createStory(
  familyId: string,
  createdBy: string,
  input: {
    title: string;
    content: string;
    personId?: string;
    location?: string;
    storyDate?: string;
    photoUrl?: string;
  }
): Promise<Story> {
  await ensureSchema();
  const id = randomUUID();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO stories (id, family_id, title, content, person_id, location, story_date, photo_url, created_by, created_at, updated_at)
    VALUES (${id}, ${familyId}, ${input.title.trim()}, ${input.content.trim()}, ${input.personId || null}, ${input.location?.trim() || null}, ${input.storyDate?.trim() || null}, ${input.photoUrl || null}, ${createdBy}, ${now}, ${now})
  `;

  return {
    id,
    family_id: familyId,
    title: input.title.trim(),
    content: input.content.trim(),
    person_id: input.personId || null,
    location: input.location?.trim() || null,
    story_date: input.storyDate?.trim() || null,
    photo_url: input.photoUrl || null,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };
}

export async function getStoriesForFamily(familyId: string): Promise<Story[]> {
  await ensureSchema();
  return (await sql`SELECT * FROM stories WHERE family_id = ${familyId} ORDER BY created_at DESC`) as Story[];
}

export async function getStoryById(storyId: string, familyId: string): Promise<Story | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM stories WHERE id = ${storyId} AND family_id = ${familyId}`) as Story[];
  return rows[0] ?? null;
}

export async function updateStory(
  storyId: string,
  familyId: string,
  input: {
    title?: string;
    content?: string;
    personId?: string | null;
    location?: string;
    storyDate?: string;
    photoUrl?: string;
  }
): Promise<void> {
  await ensureSchema();
  const now = new Date().toISOString();

  if (input.title !== undefined) {
    await sql`UPDATE stories SET title = ${input.title.trim()}, updated_at = ${now} WHERE id = ${storyId} AND family_id = ${familyId}`;
  }
  if (input.content !== undefined) {
    await sql`UPDATE stories SET content = ${input.content.trim()}, updated_at = ${now} WHERE id = ${storyId} AND family_id = ${familyId}`;
  }
  if (input.personId !== undefined) {
    await sql`UPDATE stories SET person_id = ${input.personId}, updated_at = ${now} WHERE id = ${storyId} AND family_id = ${familyId}`;
  }
  if (input.location !== undefined) {
    await sql`UPDATE stories SET location = ${input.location?.trim() || null}, updated_at = ${now} WHERE id = ${storyId} AND family_id = ${familyId}`;
  }
  if (input.storyDate !== undefined) {
    await sql`UPDATE stories SET story_date = ${input.storyDate?.trim() || null}, updated_at = ${now} WHERE id = ${storyId} AND family_id = ${familyId}`;
  }
  if (input.photoUrl !== undefined) {
    await sql`UPDATE stories SET photo_url = ${input.photoUrl}, updated_at = ${now} WHERE id = ${storyId} AND family_id = ${familyId}`;
  }
}

export async function deleteStory(storyId: string, familyId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM stories WHERE id = ${storyId} AND family_id = ${familyId}`;
}

export async function updateStoryPhoto(storyId: string, photoUrl: string): Promise<void> {
  await ensureSchema();
  const now = new Date().toISOString();
  await sql`UPDATE stories SET photo_url = ${photoUrl}, updated_at = ${now} WHERE id = ${storyId}`;
}
