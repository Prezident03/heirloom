import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";

const SESSION_COOKIE = "heirloom_session";
const SESSION_DURATION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export async function createSession(userId: string) {
  await ensureSchema();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expiresAt})`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await ensureSchema();

  const rows = (await sql`
    SELECT u.id, u.email, u.name, s.expires_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
  `) as { id: string; email: string; name: string; expires_at: string }[];

  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
    return null;
  }

  return { id: row.id, email: row.email, name: row.name };
}

export async function destroySession() {
  await ensureSchema();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
  }
  cookieStore.delete(SESSION_COOKIE);
}
