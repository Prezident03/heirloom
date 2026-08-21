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
    const safe = async (fn: () => Promise<unknown>, label: string) => {
      try {
        await fn();
      } catch (err) {
        console.warn(`[ensureSchema] ${label} skipped:`, err instanceof Error ? err.message : err);
      }
    };

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `, "create users");

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        expires_at TEXT NOT NULL
      )
    `, "create sessions");

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS families (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        owner_id TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      )
    `, "create families");

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS family_memberships (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        role TEXT NOT NULL CHECK (role IN ('owner','editor','member','viewer')),
        joined_at TEXT NOT NULL,
        UNIQUE(family_id, user_id)
      )
    `, "create family_memberships");

    await safe(() => sql`
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
    `, "create people");

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        person_a_id TEXT NOT NULL REFERENCES people(id),
        person_b_id TEXT NOT NULL REFERENCES people(id),
        type TEXT NOT NULL CHECK (type IN ('parent','spouse')),
        created_at TEXT NOT NULL
      )
    `, "create relationships");

    await safe(() => sql`ALTER TABLE people ADD COLUMN IF NOT EXISTS profile_photo_url TEXT`, "add profile_photo_url");

    await safe(() => sql`
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
    `, "create albums");

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS album_pages (
        id TEXT PRIMARY KEY,
        album_id TEXT NOT NULL REFERENCES albums(id),
        page_order INTEGER NOT NULL,
        layout_id TEXT NOT NULL,
        date_label TEXT,
        location TEXT
      )
    `, "create album_pages");

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS page_elements (
        id TEXT PRIMARY KEY,
        page_id TEXT NOT NULL REFERENCES album_pages(id),
        slot_index INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('photo','text')),
        photo_url TEXT,
        text_content TEXT
      )
    `, "create page_elements");

    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS caption TEXT`, "add caption");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS location TEXT`, "add location");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS created_at TEXT`, "add created_at");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS position_x FLOAT`, "add position_x");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS position_y FLOAT`, "add position_y");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS position_w FLOAT`, "add position_w");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS position_h FLOAT`, "add position_h");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS rotation FLOAT DEFAULT 0`, "add rotation");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 0`, "add z_index");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS frame_style TEXT DEFAULT 'polaroid'`, "add frame_style");
    await safe(() => sql`ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS sticker_id TEXT`, "add sticker_id");
    await safe(() => sql`ALTER TABLE album_pages ADD COLUMN IF NOT EXISTS background_id TEXT DEFAULT 'paper'`, "add background_id");
    await safe(() => sql`CREATE INDEX IF NOT EXISTS idx_page_elements_positioning
               ON page_elements(page_id, z_index, position_x)`, "create positioning index");

    await safe(() => sql`
      UPDATE page_elements
      SET
        created_at = COALESCE(created_at, (
          SELECT p.created_at FROM album_pages p WHERE p.id = page_id LIMIT 1
        )),
        position_x = COALESCE(position_x, CASE
          WHEN slot_index = 0 THEN 5.0
          WHEN slot_index = 1 THEN 55.0
          WHEN slot_index = 2 THEN 5.0
          WHEN slot_index = 3 THEN 55.0
          ELSE 5.0
        END),
        position_y = COALESCE(position_y, CASE
          WHEN slot_index IN (0, 1) THEN 10.0
          WHEN slot_index IN (2, 3) THEN 50.0
          ELSE 10.0
        END),
        position_w = COALESCE(position_w, 40.0),
        position_h = COALESCE(position_h, 40.0),
        rotation = COALESCE(rotation, 0),
        z_index = COALESCE(z_index, slot_index)
      WHERE position_x IS NULL OR created_at IS NULL
    `, "backfill page_elements defaults");

    await safe(() => sql`
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
    `, "create timeline_events");

    await safe(() => sql`
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
    `, "create memories");

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS places (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        name TEXT NOT NULL,
        description TEXT,
        latitude REAL,
        longitude REAL,
        address TEXT,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL
      )
    `, "create places");

    await safe(() => sql`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL REFERENCES families(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        person_id TEXT REFERENCES people(id),
        location TEXT,
        story_date TEXT,
        photo_url TEXT,
        created_by TEXT NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `, "create stories");

    await safe(() => sql`
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
    `, "create family_invites");

    await safe(() => sql`ALTER TABLE family_invites ADD COLUMN IF NOT EXISTS expires_at TEXT`, "add invite expires_at");
    await safe(() => sql`
      UPDATE family_invites SET expires_at = created_at
      WHERE expires_at IS NULL
    `, "backfill invite expires_at (treats pre-existing invites as expired)");
  })();

  return _schemaReady;
}
