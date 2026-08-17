import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;
let _schemaReady: Promise<void> | null = null;

/**
 * Neon ulanishini "dangasa" (lazy) tarzda yaratadi — build vaqtida emas,
 * faqat birinchi so'rov chaqirilganda. Shunda DATABASE_URL bo'lmasa ham
 * `next build` muvaffaqiyatli o'tadi (sahifalar dinamik render qilinadi).
 */
function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL sozlanmagan. .env.local fayliga Neon connection string'ini qo'shing (README.md ga qarang)."
      );
    }
    _sql = neon(url);
  }
  return _sql;
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getSql()(strings, ...values);
}

export async function ensureSchema(): Promise<void> {
  if (_schemaReady) return _schemaReady;

  _schemaReady = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        expires_at TEXT NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS families (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        owner_id TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS family_memberships (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        role TEXT NOT NULL CHECK (role IN ('owner','editor','member','viewer')),
        joined_at TEXT NOT NULL,
        UNIQUE(family_id, user_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        first_name TEXT NOT NULL,
        last_name TEXT,
        gender TEXT,
        birth_date TEXT,
        death_date TEXT,
        biography TEXT,
        linked_user_id TEXT REFERENCES users(id),
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        person_a_id TEXT NOT NULL REFERENCES people(id),
        person_b_id TEXT NOT NULL REFERENCES people(id),
        type TEXT NOT NULL CHECK (type IN ('parent','spouse')),
        created_at TEXT NOT NULL
      )
    `;

    // Eski (allaqachon deploy qilingan) bazalarda ham ishlashi uchun
    // yangi ustunlarni alohida, xavfsiz tarzda qo'shamiz.
    await sql`ALTER TABLE people ADD COLUMN IF NOT EXISTS profile_photo_url TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS albums (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        title TEXT NOT NULL,
        description TEXT,
        date_label TEXT,
        location TEXT,
        cover_url TEXT,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS album_pages (
        id TEXT PRIMARY KEY,
        album_id TEXT NOT NULL REFERENCES albums(id),
        page_order INTEGER NOT NULL,
        layout_id TEXT NOT NULL,
        date_label TEXT,
        location TEXT
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS page_elements (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL REFERENCES album_pages(id),
        slot_index INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('photo','text')),
        photo_url TEXT,
        text_content TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        title TEXT NOT NULL,
        description TEXT,
        event_date TEXT,
        location TEXT,
        photo_url TEXT,
        person_id TEXT REFERENCES people(id),
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        person_id TEXT REFERENCES people(id),
        title TEXT NOT NULL,
        description TEXT,
        memory_date TEXT,
        photo_url TEXT,
        location TEXT,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS family_invites (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        code TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('editor','member','viewer')),
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL,
        revoked_at TEXT,
        used_by TEXT REFERENCES users(id),
        used_at TEXT
      )
    `;
  })();

  return _schemaReady;
}
