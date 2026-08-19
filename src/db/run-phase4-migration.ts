import { sql } from "@/lib/db";

/**
 * Run Phase 4 migration: Album Editor positioning
 * This adds drag-drop positioning columns to page_elements table
 */
export async function runPhase4Migration(): Promise<void> {
  console.log("🔄 Running Phase 4 migration: Album Editor positioning...");

  try {
    // Add new positioning columns
    console.log("📝 Adding positioning columns...");
    await sql`
      ALTER TABLE page_elements
      ADD COLUMN IF NOT EXISTS position_x FLOAT,
      ADD COLUMN IF NOT EXISTS position_y FLOAT,
      ADD COLUMN IF NOT EXISTS position_w FLOAT,
      ADD COLUMN IF NOT EXISTS position_h FLOAT,
      ADD COLUMN IF NOT EXISTS rotation FLOAT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS z_index INTEGER DEFAULT 0
    `;
    console.log("✅ Columns added");

    // Migrate existing slot-based data to new positioning
    console.log("🔄 Migrating existing slot-based data...");
    await sql`
      UPDATE page_elements
      SET
        position_x = CASE
          WHEN slot_index = 0 THEN 5.0
          WHEN slot_index = 1 THEN 55.0
          WHEN slot_index = 2 THEN 5.0
          WHEN slot_index = 3 THEN 55.0
          ELSE 5.0
        END,
        position_y = CASE
          WHEN slot_index IN (0, 1) THEN 10.0
          WHEN slot_index IN (2, 3) THEN 50.0
          ELSE 10.0
        END,
        position_w = 40.0,
        position_h = 40.0,
        z_index = slot_index
      WHERE position_x IS NULL AND slot_index IS NOT NULL
    `;
    console.log("✅ Data migrated");

    // Create index for faster queries
    console.log("📊 Creating index...");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_page_elements_positioning
      ON page_elements(page_id, z_index, position_x)
    `;
    console.log("✅ Index created");

    console.log("🎉 Phase 4 migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  runPhase4Migration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
