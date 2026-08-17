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

export type FamilyMember = {
  user_id: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "member" | "viewer";
  joined_at: string;
};

export async function getMembersForFamily(familyId: string): Promise<FamilyMember[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT u.id AS user_id, u.name, u.email, m.role, m.joined_at
    FROM family_memberships m
    JOIN users u ON u.id = m.user_id
    WHERE m.family_id = ${familyId}
    ORDER BY (m.role = 'owner') DESC, m.joined_at ASC
  `) as FamilyMember[];
  return rows;
}

export async function updateFamilyName(familyId: string, name: string): Promise<void> {
  await ensureSchema();
  await sql`UPDATE families SET name = ${name} WHERE id = ${familyId}`;
}

export async function updateMemberRole(familyId: string, userId: string, role: "editor" | "member" | "viewer"): Promise<void> {
  await ensureSchema();
  // Owner roli shu yerdan o'zgartirilmaydi — oila egasi har doim 'owner' bo'lib qoladi.
  await sql`
    UPDATE family_memberships SET role = ${role}
    WHERE family_id = ${familyId} AND user_id = ${userId} AND role != 'owner'
  `;
}

export async function removeMember(familyId: string, userId: string): Promise<void> {
  await ensureSchema();
  // Owner shu yo'l bilan chiqarib yuborilmaydi.
  await sql`
    DELETE FROM family_memberships
    WHERE family_id = ${familyId} AND user_id = ${userId} AND role != 'owner'
  `;
}

export type FamilyInvite = {
  id: string;
  family_id: string;
  code: string;
  role: "editor" | "member" | "viewer";
  created_by: string;
  created_at: string;
  revoked_at: string | null;
  used_by: string | null;
  used_at: string | null;
};

function makeInviteCode(): string {
  // URL-friendly, taxminan qilib bo'lmaydigan 10 belgili kod.
  return randomUUID().replace(/-/g, "").slice(0, 10);
}

export async function createInvite(familyId: string, role: FamilyInvite["role"], createdBy: string): Promise<FamilyInvite> {
  await ensureSchema();
  const id = randomUUID();
  const code = makeInviteCode();
  const createdAt = new Date().toISOString();

  await sql`
    INSERT INTO family_invites (id, family_id, code, role, created_by, created_at)
    VALUES (${id}, ${familyId}, ${code}, ${role}, ${createdBy}, ${createdAt})
  `;

  return { id, family_id: familyId, code, role, created_by: createdBy, created_at: createdAt, revoked_at: null, used_by: null, used_at: null };
}

export async function getActiveInvitesForFamily(familyId: string): Promise<FamilyInvite[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM family_invites
    WHERE family_id = ${familyId} AND revoked_at IS NULL AND used_at IS NULL
    ORDER BY created_at DESC
  `) as FamilyInvite[];
  return rows;
}

export async function getInviteByCode(code: string): Promise<FamilyInvite | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM family_invites WHERE code = ${code}`) as FamilyInvite[];
  return rows[0] ?? null;
}

export async function revokeInvite(inviteId: string, familyId: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE family_invites SET revoked_at = ${new Date().toISOString()}
    WHERE id = ${inviteId} AND family_id = ${familyId}
  `;
}

export async function acceptInvite(code: string, userId: string): Promise<{ error: string } | { family: Family }> {
  await ensureSchema();
  const invite = await getInviteByCode(code);
  if (!invite) return { error: "Taklif havolasi topilmadi." };
  if (invite.revoked_at) return { error: "Bu taklif havolasi bekor qilingan." };
  if (invite.used_at) return { error: "Bu taklif havolasi allaqachon ishlatilgan." };

  const family = (await sql`SELECT * FROM families WHERE id = ${invite.family_id}`) as Family[];
  if (!family[0]) return { error: "Oila topilmadi." };

  const existing = await getMembership(invite.family_id, userId);
  if (existing) {
    return { family: family[0] };
  }

  await sql`
    INSERT INTO family_memberships (id, family_id, user_id, role, joined_at)
    VALUES (${randomUUID()}, ${invite.family_id}, ${userId}, ${invite.role}, ${new Date().toISOString()})
  `;
  await sql`
    UPDATE family_invites SET used_by = ${userId}, used_at = ${new Date().toISOString()}
    WHERE id = ${invite.id}
  `;

  return { family: family[0] };
}
