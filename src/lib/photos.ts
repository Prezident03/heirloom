import { sql } from "@/lib/db";

export interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  location?: string;
  date_label?: string;
  album_title: string;
  album_id: string;
  created_at: string;
}

/**
 * Get all photos for a family, ordered by newest first
 */
export async function getPhotosForFamily(familyId: string): Promise<Photo[]> {
  const result = await sql`
    SELECT DISTINCT
      pe.id,
      pe.photo_url,
      pe.caption,
      pe.location,
      ap.date_label,
      a.title as album_title,
      a.id as album_id,
      pe.created_at
    FROM page_elements pe
    JOIN album_pages ap ON pe.page_id = ap.id
    JOIN albums a ON ap.album_id = a.id
    WHERE a.family_id = ${familyId}
    AND pe.type = 'photo'
    AND pe.photo_url IS NOT NULL
    ORDER BY pe.created_at DESC
  ` as Photo[];
  return result;
}

/**
 * Search photos by caption, album title, or location
 */
export async function searchPhotos(
  familyId: string,
  query: string
): Promise<Photo[]> {
  const searchQuery = `%${query}%`;
  const result = await sql`
    SELECT DISTINCT
      pe.id,
      pe.photo_url,
      pe.caption,
      pe.location,
      ap.date_label,
      a.title as album_title,
      a.id as album_id,
      pe.created_at
    FROM page_elements pe
    JOIN album_pages ap ON pe.page_id = ap.id
    JOIN albums a ON ap.album_id = a.id
    WHERE a.family_id = ${familyId}
    AND pe.type = 'photo'
    AND pe.photo_url IS NOT NULL
    AND (
      pe.caption ILIKE ${searchQuery}
      OR a.title ILIKE ${searchQuery}
      OR pe.location ILIKE ${searchQuery}
    )
    ORDER BY pe.created_at DESC
  ` as Photo[];
  return result;
}

/**
 * Get unique locations in family photos
 */
export async function getPhotoLocations(familyId: string): Promise<string[]> {
  const result = await sql`
    SELECT DISTINCT pe.location
    FROM page_elements pe
    JOIN album_pages ap ON pe.page_id = ap.id
    JOIN albums a ON ap.album_id = a.id
    WHERE a.family_id = ${familyId}
    AND pe.type = 'photo'
    AND pe.photo_url IS NOT NULL
    AND pe.location IS NOT NULL AND pe.location != ''
    ORDER BY pe.location ASC
  ` as { location: string }[];
  return result.map(r => r.location);
}

/**
 * Get photos filtered by location
 */
export async function getPhotosByLocation(
  familyId: string,
  location: string
): Promise<Photo[]> {
  const result = await sql`
    SELECT DISTINCT
      pe.id,
      pe.photo_url,
      pe.caption,
      pe.location,
      ap.date_label,
      a.title as album_title,
      a.id as album_id,
      pe.created_at
    FROM page_elements pe
    JOIN album_pages ap ON pe.page_id = ap.id
    JOIN albums a ON ap.album_id = a.id
    WHERE a.family_id = ${familyId}
    AND pe.type = 'photo'
    AND pe.photo_url IS NOT NULL
    AND pe.location = ${location}
    ORDER BY pe.created_at DESC
  ` as Photo[];
  return result;
}

/**
 * Get photos filtered by album
 */
export async function getPhotosByAlbum(
  familyId: string,
  albumId: string
): Promise<Photo[]> {
  const result = await sql`
    SELECT DISTINCT
      pe.id,
      pe.photo_url,
      pe.caption,
      pe.location,
      ap.date_label,
      a.title as album_title,
      a.id as album_id,
      pe.created_at
    FROM page_elements pe
    JOIN album_pages ap ON pe.page_id = ap.id
    JOIN albums a ON ap.album_id = a.id
    WHERE a.family_id = ${familyId}
    AND a.id = ${albumId}
    AND pe.type = 'photo'
    AND pe.photo_url IS NOT NULL
    ORDER BY pe.created_at DESC
  ` as Photo[];
  return result;
}

/**
 * Get photo count for family
 */
export async function getPhotoCount(familyId: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(DISTINCT pe.id) as count
    FROM page_elements pe
    JOIN album_pages ap ON pe.page_id = ap.id
    JOIN albums a ON ap.album_id = a.id
    WHERE a.family_id = ${familyId}
    AND pe.type = 'photo'
    AND pe.photo_url IS NOT NULL
  ` as { count: number }[];
  return result[0]?.count || 0;
}
