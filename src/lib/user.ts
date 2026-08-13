import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";
import { hashPassword } from "./password";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
};

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`) as UserRow[];
  return rows[0] ?? null;
}

export async function createUser(email: string, password: string, name: string): Promise<UserRow> {
  await ensureSchema();
  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const createdAt = new Date().toISOString();
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedName = name.trim();

  await sql`
    INSERT INTO users (id, email, password_hash, name, created_at)
    VALUES (${id}, ${normalizedEmail}, ${passwordHash}, ${trimmedName}, ${createdAt})
  `;

  return { id, email: normalizedEmail, password_hash: passwordHash, name: trimmedName, created_at: createdAt };
}
