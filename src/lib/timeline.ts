import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "./db";

export type TimelineEvent = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  // Erkin matn sifatida saqlanadi (masalan: "1998", "1998-05-12", "1990-lar") —
  // people.birth_date bilan bir xil yondashuv: aniq sana majburiy emas.
  event_date: string | null;
  location: string | null;
  photo_url: string | null;
  person_id: string | null;
  created_by: string;
  created_at: string;
};

export type NewTimelineEventInput = {
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  personId?: string;
};

/** event_date matnidan boshlang'ich yilni ajratib oladi (tartiblash uchun). */
export function extractYear(dateLabel: string | null): number | null {
  if (!dateLabel) return null;
  const match = String(dateLabel).match(/\d{3,4}/);
  return match ? parseInt(match[0], 10) : null;
}

/** Oilaning barcha voqealarini xronologik tartibda (eskisidan yangisiga) qaytaradi.
 * Yili aniqlanmagan voqealar ro'yxat oxirida, yaratilgan vaqti bo'yicha. */
export async function getTimelineEventsForFamily(familyId: string): Promise<TimelineEvent[]> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM timeline_events WHERE family_id = ${familyId} ORDER BY created_at ASC
  `) as TimelineEvent[];

  return rows.sort((a, b) => {
    const ya = extractYear(a.event_date);
    const yb = extractYear(b.event_date);
    if (ya !== null && yb !== null) return ya - yb;
    if (ya !== null) return -1;
    if (yb !== null) return 1;
    return a.created_at.localeCompare(b.created_at);
  });
}

export async function getTimelineEventById(eventId: string, familyId: string): Promise<TimelineEvent | null> {
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM timeline_events WHERE id = ${eventId} AND family_id = ${familyId}
  `) as TimelineEvent[];
  return rows[0] ?? null;
}

export async function createTimelineEvent(
  familyId: string,
  createdBy: string,
  input: NewTimelineEventInput
): Promise<TimelineEvent> {
  await ensureSchema();

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const title = input.title.trim();
  const description = input.description?.trim() || null;
  const eventDate = input.eventDate?.trim() || null;
  const location = input.location?.trim() || null;
  const personId = input.personId?.trim() || null;

  await sql`
    INSERT INTO timeline_events (id, family_id, title, description, event_date, location, person_id, created_by, created_at)
    VALUES (${id}, ${familyId}, ${title}, ${description}, ${eventDate}, ${location}, ${personId}, ${createdBy}, ${createdAt})
  `;

  return {
    id,
    family_id: familyId,
    title,
    description,
    event_date: eventDate,
    location,
    photo_url: null,
    person_id: personId,
    created_by: createdBy,
    created_at: createdAt,
  };
}

export async function updateTimelineEvent(
  eventId: string,
  familyId: string,
  input: NewTimelineEventInput
): Promise<void> {
  await ensureSchema();
  const title = input.title.trim();
  const description = input.description?.trim() || null;
  const eventDate = input.eventDate?.trim() || null;
  const location = input.location?.trim() || null;
  const personId = input.personId?.trim() || null;

  await sql`
    UPDATE timeline_events SET
      title = ${title},
      description = ${description},
      event_date = ${eventDate},
      location = ${location},
      person_id = ${personId}
    WHERE id = ${eventId} AND family_id = ${familyId}
  `;
}

export async function updateTimelineEventPhoto(eventId: string, familyId: string, photoUrl: string): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE timeline_events SET photo_url = ${photoUrl}
    WHERE id = ${eventId} AND family_id = ${familyId}
  `;
}

export async function deleteTimelineEvent(eventId: string, familyId: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM timeline_events WHERE id = ${eventId} AND family_id = ${familyId}`;
}
