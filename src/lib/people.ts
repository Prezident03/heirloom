import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";

export type Person = {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  profile_photo_url: string | null;
  linked_user_id: string | null;
  created_by: string;
  created_at: string;
};

export type RelationshipType = "parent" | "spouse";

export type Relationship = {
  id: string;
  family_id: string;
  person_a_id: string;
  person_b_id: string;
  // "parent" => person_a is a parent of person_b
  // "spouse" => person_a and person_b are partners (order doesn't matter)
  type: RelationshipType;
  created_at: string;
};

export type NewPersonInput = {
  firstName: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  deathDate?: string;
  biography?: string;
};

export async function getPeopleForFamily(familyId: string): Promise<Person[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM people WHERE family_id = ${familyId} ORDER BY created_at ASC
  `) as Person[];
  return rows;
}

export async function getPersonById(personId: string, familyId: string): Promise<Person | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM people WHERE id = ${personId} AND family_id = ${familyId}
  `) as Person[];
  return rows[0] ?? null;
}

/** Joriy foydalanuvchining shu oiladagi shaxsiy "Men" yozuvini topadi (agar bo'lsa). */
export async function getPersonForUser(familyId: string, userId: string): Promise<Person | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM people WHERE family_id = ${familyId} AND linked_user_id = ${userId}
  `) as Person[];
  return rows[0] ?? null;
}

export async function getRelationshipsForFamily(familyId: string): Promise<Relationship[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM relationships WHERE family_id = ${familyId} ORDER BY created_at ASC
  `) as Relationship[];
  return rows;
}

export async function createPerson(
  familyId: string,
  input: NewPersonInput,
  createdBy: string,
  linkedUserId: string | null = null
): Promise<Person> {
  await ensureSchema();

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const firstName = input.firstName.trim();
  const lastName = input.lastName?.trim() || null;
  const gender = input.gender?.trim() || null;
  const birthDate = input.birthDate?.trim() || null;
  const deathDate = input.deathDate?.trim() || null;
  const biography = input.biography?.trim() || null;

  await sql`
    INSERT INTO people (id, family_id, first_name, last_name, gender, birth_date, death_date, biography, linked_user_id, created_by, created_at)
    VALUES (${id}, ${familyId}, ${firstName}, ${lastName}, ${gender}, ${birthDate}, ${deathDate}, ${biography}, ${linkedUserId}, ${createdBy}, ${createdAt})
  `;

  return {
    id,
    family_id: familyId,
    first_name: firstName,
    last_name: lastName,
    gender,
    birth_date: birthDate,
    death_date: deathDate,
    biography,
    profile_photo_url: null,
    linked_user_id: linkedUserId,
    created_by: createdBy,
    created_at: createdAt,
  };
}

export async function updatePerson(
  personId: string,
  familyId: string,
  input: NewPersonInput
): Promise<void> {
  await ensureSchema();
  const firstName = input.firstName.trim();
  const lastName = input.lastName?.trim() || null;
  const gender = input.gender?.trim() || null;
  const birthDate = input.birthDate?.trim() || null;
  const deathDate = input.deathDate?.trim() || null;
  const biography = input.biography?.trim() || null;

  await sql`
    UPDATE people SET
      first_name = ${firstName},
      last_name = ${lastName},
      gender = ${gender},
      birth_date = ${birthDate},
      death_date = ${deathDate},
      biography = ${biography}
    WHERE id = ${personId} AND family_id = ${familyId}
  `;
}

export async function updatePersonPhoto(personId: string, familyId: string, photoUrl: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE people SET profile_photo_url = ${photoUrl}
    WHERE id = ${personId} AND family_id = ${familyId}
  `;
}

export async function deletePerson(personId: string, familyId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM relationships WHERE family_id = ${familyId} AND (person_a_id = ${personId} OR person_b_id = ${personId})`;
  // timeline_events.person_id, memories.person_id va stories.person_id —
  // odamga ixtiyoriy bog'lanish (FK). O'chirishdan oldin bog'lanishni
  // bo'shatamiz, shunda voqea/xotira/hikoyaning o'zi saqlanib qoladi va
  // FK cheklovi buzilib, o'chirish amali xatoga uchramaydi.
  await sql`UPDATE timeline_events SET person_id = NULL WHERE family_id = ${familyId} AND person_id = ${personId}`;
  await sql`UPDATE memories SET person_id = NULL WHERE family_id = ${familyId} AND person_id = ${personId}`;
  await sql`UPDATE stories SET person_id = NULL WHERE family_id = ${familyId} AND person_id = ${personId}`;
  await sql`DELETE FROM people WHERE id = ${personId} AND family_id = ${familyId}`;
}

export async function createRelationship(
  familyId: string,
  personAId: string,
  personBId: string,
  type: RelationshipType
): Promise<Relationship> {
  await ensureSchema();

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await sql`
    INSERT INTO relationships (id, family_id, person_a_id, person_b_id, type, created_at)
    VALUES (${id}, ${familyId}, ${personAId}, ${personBId}, ${type}, ${createdAt})
  `;

  return { id, family_id: familyId, person_a_id: personAId, person_b_id: personBId, type, created_at: createdAt };
}
