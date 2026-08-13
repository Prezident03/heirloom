import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";

export type Family = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
};

export type Membership = {
  family_id: string;
  role: "owner" | "editor" | "member" | "viewer";
};

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "family"
  );
}

export async function createFamily(name: string, ownerId: string): Promise<Family> {
  await ensureSchema();

  const base = slugify(name);
  let slug = base;
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = (await sql`SELECT 1 FROM families WHERE slug = ${slug}`) as unknown[];
    if (existing.length === 0) break;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await sql`
    INSERT INTO families (id, name, slug, owner_id, created_at)
    VALUES (${id}, ${name}, ${slug}, ${ownerId}, ${createdAt})
  `;

  await sql`
    INSERT INTO family_memberships (id, family_id, user_id, role, joined_at)
    VALUES (${randomUUID()}, ${id}, ${ownerId}, 'owner', ${createdAt})
  `;

  return { id, name, slug, owner_id: ownerId, created_at: createdAt };
}

export async function getFamiliesForUser(userId: string): Promise<Family[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT f.* FROM families f
    JOIN family_memberships m ON m.family_id = f.id
    WHERE m.user_id = ${userId}
    ORDER BY f.created_at ASC
  `) as Family[];
  return rows;
}

export async function getFamilyBySlug(slug: string): Promise<Family | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM families WHERE slug = ${slug}`) as Family[];
  return rows[0] ?? null;
}

export async function getMembership(familyId: string, userId: string): Promise<Membership | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT family_id, role FROM family_memberships
    WHERE family_id = ${familyId} AND user_id = ${userId}
  `) as Membership[];
  return rows[0] ?? null;
}
