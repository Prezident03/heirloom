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
  createdBy: string
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
    INSERT INTO people (id, family_id, first_name, last_name, gender, birth_date, death_date, biography, created_by, created_at)
    VALUES (${id}, ${familyId}, ${firstName}, ${lastName}, ${gender}, ${birthDate}, ${deathDate}, ${biography}, ${createdBy}, ${createdAt})
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
    linked_user_id: null,
    created_by: createdBy,
    created_at: createdAt,
  };
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
