import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";

export type Place = {
  id: string;
  family_id: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  created_by: string;
  created_at: string;
};

export async function createPlace(
  familyId: string,
  createdBy: string,
  input: { name: string; description?: string; latitude?: number; longitude?: number; address?: string }
): Promise<Place> {
  await ensureSchema();
  const id = randomUUID();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO places (id, family_id, name, description, latitude, longitude, address, created_by, created_at)
    VALUES (${id}, ${familyId}, ${input.name.trim()}, ${input.description?.trim() || null}, ${input.latitude || null}, ${input.longitude || null}, ${input.address?.trim() || null}, ${createdBy}, ${now})
  `;

  return { id, family_id: familyId, name: input.name.trim(), description: input.description?.trim() || null, latitude: input.latitude || null, longitude: input.longitude || null, address: input.address?.trim() || null, created_by: createdBy, created_at: now };
}

export async function getPlacesForFamily(familyId: string): Promise<Place[]> {
  await ensureSchema();
  return (await sql`SELECT * FROM places WHERE family_id = ${familyId} ORDER BY name ASC`) as Place[];
}

export async function deletePlace(placeId: string, familyId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM places WHERE id = ${placeId} AND family_id = ${familyId}`;
}

export async function updatePlace(
  placeId: string,
  familyId: string,
  input: { name?: string; description?: string; latitude?: number; longitude?: number; address?: string }
): Promise<void> {
  await ensureSchema();
  if (input.name !== undefined) await sql`UPDATE places SET name = ${input.name.trim()} WHERE id = ${placeId} AND family_id = ${familyId}`;
  if (input.description !== undefined) await sql`UPDATE places SET description = ${input.description?.trim() || null} WHERE id = ${placeId} AND family_id = ${familyId}`;
  if (input.latitude !== undefined) await sql`UPDATE places SET latitude = ${input.latitude} WHERE id = ${placeId} AND family_id = ${familyId}`;
  if (input.longitude !== undefined) await sql`UPDATE places SET longitude = ${input.longitude} WHERE id = ${placeId} AND family_id = ${familyId}`;
  if (input.address !== undefined) await sql`UPDATE places SET address = ${input.address?.trim() || null} WHERE id = ${placeId} AND family_id = ${familyId}`;
}
