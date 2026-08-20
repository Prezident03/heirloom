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
  expires_at: string;
  revoked_at: string | null;
  used_by: string | null;
  used_at: string | null;
};

const INVITE_DURATION_DAYS = 7;

function makeInviteCode(): string {
  // URL-friendly, taxminan qilib bo'lmaydigan 10 belgili kod.
  return randomUUID().replace(/-/g, "").slice(0, 10);
}

export async function createInvite(familyId: string, role: FamilyInvite["role"], createdBy: string): Promise<FamilyInvite> {
  await ensureSchema();
  const id = randomUUID();
  const code = makeInviteCode();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + INVITE_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO family_invites (id, family_id, code, role, created_by, created_at, expires_at)
    VALUES (${id}, ${familyId}, ${code}, ${role}, ${createdBy}, ${createdAt}, ${expiresAt})
  `;

  return {
    id,
    family_id: familyId,
    code,
    role,
    created_by: createdBy,
    created_at: createdAt,
    expires_at: expiresAt,
    revoked_at: null,
    used_by: null,
    used_at: null,
  };
}

export async function getActiveInvitesForFamily(familyId: string): Promise<FamilyInvite[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM family_invites
    WHERE family_id = ${familyId} AND revoked_at IS NULL AND used_at IS NULL
      AND (expires_at IS NULL OR expires_at > ${new Date().toISOString()})
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
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: "Bu taklif havolasining muddati o'tgan." };
  }

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

export type FamilyStats = {
  peopleCount: number;
  albumsCount: number;
  pagesCount: number;
  photosCount: number;
  memoriesCount: number;
  storiesCount: number;
  eventsCount: number;
  placesCount: number;
  generationsCount: number;
};

function extractYear(dateLabel: string | null): number | null {
  if (!dateLabel) return null;
  const match = String(dateLabel).match(/\d{3,4}/);
  return match ? parseInt(match[0], 10) : null;
}

/** Avlodlar sonini taxminiy hisoblash: eng keksa odam bilan eng yosh o'rtasidagi farqni 25 ga bo'lish. */
function estimateGenerations(peopleRows: { birth_date: string | null; death_date: string | null }[]): number {
  const years = peopleRows
    .map((p) => extractYear(p.birth_date) ?? extractYear(p.death_date))
    .filter((y): y is number => y !== null);
  if (years.length === 0) return 0;
  const min = Math.min(...years);
  const max = Math.max(...years);
  const diff = max - min;
  return Math.max(1, Math.round(diff / 25) + 1);
}

export async function getFamilyStats(familyId: string): Promise<FamilyStats> {
  await ensureSchema();

  const [peopleRows, albumsRes, pagesRes, elementsRes, memoriesRes, storiesRes, eventsRes, placesRes] = await Promise.all([
    sql`SELECT birth_date, death_date FROM people WHERE family_id = ${familyId}`,
    sql`SELECT COUNT(*)::int AS c FROM albums WHERE family_id = ${familyId}`,
    sql`SELECT COUNT(*)::int AS c FROM album_pages ap JOIN albums a ON ap.album_id = a.id WHERE a.family_id = ${familyId}`,
    sql`SELECT COUNT(*)::int AS c FROM page_elements pe JOIN album_pages ap ON pe.page_id = ap.id JOIN albums a ON ap.album_id = a.id WHERE a.family_id = ${familyId} AND pe.type = 'photo' AND pe.photo_url IS NOT NULL`,
    sql`SELECT COUNT(*)::int AS c FROM memories WHERE family_id = ${familyId}`,
    sql`SELECT COUNT(*)::int AS c FROM stories WHERE family_id = ${familyId}`,
    sql`SELECT COUNT(*)::int AS c FROM timeline_events WHERE family_id = ${familyId}`,
    sql`SELECT COUNT(*)::int AS c FROM places WHERE family_id = ${familyId}`,
  ]);

  const people = peopleRows as { birth_date: string | null; death_date: string | null }[];

  return {
    peopleCount: people.length,
    albumsCount: (albumsRes as { c: number }[])[0]?.c ?? 0,
    pagesCount: (pagesRes as { c: number }[])[0]?.c ?? 0,
    photosCount: (elementsRes as { c: number }[])[0]?.c ?? 0,
    memoriesCount: (memoriesRes as { c: number }[])[0]?.c ?? 0,
    storiesCount: (storiesRes as { c: number }[])[0]?.c ?? 0,
    eventsCount: (eventsRes as { c: number }[])[0]?.c ?? 0,
    placesCount: (placesRes as { c: number }[])[0]?.c ?? 0,
    generationsCount: estimateGenerations(people),
  };
}
