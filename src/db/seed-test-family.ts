/**
 * Seed script for Phase 4 testing
 * Adds test family with people for family tree visualization
 */

import { sql } from "@/lib/db";

export async function seedTestFamily(): Promise<void> {
  console.log("🌱 Seeding test family with people...");

  try {
    // Get existing family (zokirov)
    const families = await sql`
      SELECT id FROM families WHERE slug = 'zokirov' LIMIT 1
    `;

    if (!families || (families as any[]).length === 0) {
      console.log("❌ Family 'zokirov' not found");
      return;
    }

    const familyId = (families as any[])[0].id;
    console.log(`✅ Found family: ${familyId}`);

    // Check if people already exist
    const existingPeople = await sql`
      SELECT COUNT(*) as count FROM people WHERE family_id = ${familyId}
    `;

    const count = (existingPeople as any[])[0]?.count || 0;
    if (count > 0) {
      console.log(`⚠️  Family already has ${count} people. Skipping seed.`);
      return;
    }

    console.log("📝 Adding grandparents...");

    // Grandparents (Generation 1)
    const gf1Id = `person_${Date.now()}_1`;
    const gm1Id = `person_${Date.now()}_2`;

    await sql`
      INSERT INTO people (id, family_id, name, birth_year, gender)
      VALUES
        (${gf1Id}, ${familyId}, 'Abdulla Zokirov', 1945, 'M'),
        (${gm1Id}, ${familyId}, 'Fatima Zokirova', 1947, 'F')
    `;

    // Spouse relationship
    await sql`
      INSERT INTO relationships (id, family_id, person_a_id, person_b_id, type)
      VALUES ('rel_' || gen_random_uuid()::text, ${familyId}, ${gf1Id}, ${gm1Id}, 'spouse')
    `;

    console.log("📝 Adding parents...");

    // Parents (Generation 2)
    const fatherId = `person_${Date.now()}_3`;
    const motherId = `person_${Date.now()}_4`;

    await sql`
      INSERT INTO people (id, family_id, name, birth_year, gender)
      VALUES
        (${fatherId}, ${familyId}, 'Dilshod Zokirov', 1970, 'M'),
        (${motherId}, ${familyId}, 'Gulnora Zokirova', 1972, 'F')
    `;

    // Parent relationships
    await sql`
      INSERT INTO relationships (id, family_id, person_a_id, person_b_id, type)
      VALUES
        ('rel_' || gen_random_uuid()::text, ${familyId}, ${gf1Id}, ${fatherId}, 'parent'),
        ('rel_' || gen_random_uuid()::text, ${familyId}, ${fatherId}, ${motherId}, 'spouse')
    `;

    console.log("📝 Adding children (current generation)...");

    // Children (Generation 3)
    const childId1 = `person_${Date.now()}_5`;
    const childId2 = `person_${Date.now()}_6`;
    const childId3 = `person_${Date.now()}_7`;

    await sql`
      INSERT INTO people (id, family_id, name, birth_year, gender)
      VALUES
        (${childId1}, ${familyId}, 'Odil Zokirov', 1995, 'M'),
        (${childId2}, ${familyId}, 'Nilufar Zokirova', 1998, 'F'),
        (${childId3}, ${familyId}, 'Aziza Zokirova', 2002, 'F')
    `;

    // Child relationships
    await sql`
      INSERT INTO relationships (id, family_id, person_a_id, person_b_id, type)
      VALUES
        ('rel_' || gen_random_uuid()::text, ${familyId}, ${fatherId}, ${childId1}, 'parent'),
        ('rel_' || gen_random_uuid()::text, ${familyId}, ${motherId}, ${childId1}, 'parent'),
        ('rel_' || gen_random_uuid()::text, ${familyId}, ${fatherId}, ${childId2}, 'parent'),
        ('rel_' || gen_random_uuid()::text, ${familyId}, ${motherId}, ${childId2}, 'parent'),
        ('rel_' || gen_random_uuid()::text, ${familyId}, ${fatherId}, ${childId3}, 'parent'),
        ('rel_' || gen_random_uuid()::text, ${familyId}, ${motherId}, ${childId3}, 'parent')
    `;

    console.log("🎉 Seed complete!");
    console.log("📊 Added 7 people in 3 generations");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedTestFamily()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
