/**
 * Seed script for Phase 4 testing
 * Adds test family with people for family tree visualization
 */

import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "@/lib/db";

type PersonRow = {
  id: string;
  family_id: string;
  first_name: string;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  linked_user_id: string | null;
  created_by: string;
  created_at: string;
};

export async function seedTestFamily(): Promise<void> {
  console.log("🌱 Seeding test family with people...");

  await ensureSchema();

  try {
    // Get existing family (zokirov)
    const families = await sql`
      SELECT id, owner_id FROM families WHERE slug = 'zokirov' LIMIT 1
    `;

    if (!families || (families as any[]).length === 0) {
      console.log("❌ Family 'zokirov' not found");
      return;
    }

    const familyId = (families as any[])[0].id;
    const ownerId = (families as any[])[0].owner_id ?? (families as any[])[0].created_by;
    console.log(`✅ Found family: ${familyId}`);

    // Check if people already exist
    const existingPeople = await sql`
      SELECT COUNT(*)::int as count FROM people WHERE family_id = ${familyId}
    `;

    const count = (existingPeople as any[])[0]?.count || 0;
    if (count > 0) {
      console.log(`⚠️  Family already has ${count} people. Skipping seed.`);
      return;
    }

    const now = new Date().toISOString();
    const make = (first: string, last: string, gender: "M" | "F", birthYear: number, suffix: string) => ({
      id: `person_seed_zokirov_${suffix}`,
      family_id: familyId,
      first_name: first,
      last_name: last || null,
      gender,
      birth_date: `${birthYear}-01-01`,
      death_date: null,
      biography: null,
      linked_user_id: gender === "M" && suffix === "3_3" ? ownerId : null,
      created_by: ownerId,
      created_at: now,
    });

    console.log("📝 Adding grandparents (1-avlod)...");

    // Grandparents (Generation 1)
    const gf1 = make("Abdulla", "Zokirov", "M", 1945, "1_1") as PersonRow;
    const gm1 = make("Fatima", "Zokirova", "F", 1947, "1_2") as PersonRow;

    // Parents (Generation 2)
    const father = make("Dilshod", "Zokirov", "M", 1970, "2_1") as PersonRow;
    const mother = make("Gulnora", "Zokirova", "F", 1972, "2_2") as PersonRow;

    // Children (Generation 3)
    const child1 = make("Odil", "Zokirov", "M", 1995, "3_1") as PersonRow;
    const child2 = make("Nilufar", "Zokirova", "F", 1998, "3_2") as PersonRow;
    const child3 = make("Aziza", "Zokirova", "F", 2002, "3_3") as PersonRow;

    const allPeople: PersonRow[] = [gf1, gm1, father, mother, child1, child2, child3];

    for (const p of allPeople) {
      await sql`
        INSERT INTO people (id, family_id, first_name, last_name, gender, birth_date, death_date, biography, linked_user_id, created_by, created_at)
        VALUES (
          ${p.id}, ${p.family_id}, ${p.first_name}, ${p.last_name}, ${p.gender},
          ${p.birth_date}, ${null}, ${null}, ${p.linked_user_id}, ${p.created_by}, ${p.created_at}
        )
        ON CONFLICT DO NOTHING
      `;
    }

    console.log("📝 Adding relationships...");

    const rels = [
      [gf1.id, gm1.id, "spouse"],
      [gf1.id, father.id, "parent"],
      [father.id, mother.id, "spouse"],
      [father.id, child1.id, "parent"],
      [mother.id, child1.id, "parent"],
      [father.id, child2.id, "parent"],
      [mother.id, child2.id, "parent"],
      [father.id, child3.id, "parent"],
      [mother.id, child3.id, "parent"],
    ];

    for (const [a, b, type] of rels) {
      await sql`
        INSERT INTO relationships (id, family_id, person_a_id, person_b_id, type, created_at)
        VALUES (${randomUUID()}, ${familyId}, ${a}, ${b}, ${type as any}, ${now})
        ON CONFLICT DO NOTHING
      `;
    }

    console.log("🎉 Seed complete!");
    console.log("📊 Added 7 people in 3 generations:");
    console.log("   1-Avlod: Abdulla Zokirov (1945) & Fatima Zokirova (1947)");
    console.log("   2-Avlod: Dilshod Zokirov (1970) & Gulnora Zokirova (1972)");
    console.log("   3-Avlod: Odil (1995), Nilufar (1998), Aziza (2002) — oila egasiga bog'langan");
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
