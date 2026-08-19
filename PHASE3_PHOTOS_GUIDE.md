# PHASE 3 IMPLEMENTATION GUIDE: Photo Gallery

## 🎯 Goal
Create an independent photo gallery view where users can:
- See all family photos in a grid
- Filter by album, person, location, date
- Search by caption
- View photo details
- Edit metadata

---

## 📊 Current State

Photos currently exist **only within albums**:
- Stored in `page_elements` table
- Linked to `album_pages`
- No independent photo view
- No photo metadata (caption, location, tags)

---

## 🔧 Implementation Steps

### Step 1: Database Schema Updates (Optional but Recommended)

Add photo metadata table:

```sql
CREATE TABLE IF NOT EXISTS photo_metadata (
  id TEXT PRIMARY KEY,
  photo_url TEXT UNIQUE NOT NULL,
  caption TEXT,
  location TEXT,
  date_taken TEXT,
  exif_data JSONB,
  created_at TEXT NOT NULL
);

-- Add to page_elements to link photos
ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS metadata_id TEXT REFERENCES photo_metadata(id);
```

**Alternative (simpler)**: Store metadata directly in `page_elements`:
```sql
ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE page_elements ADD COLUMN IF NOT EXISTS location TEXT;
```

---

### Step 2: Create Photos Data Access Layer

File: `src/lib/photos.ts`

```typescript
import { sql } from "@/lib/db";

export async function getPhotosForFamily(familyId: string) {
  return await sql`
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
  `;
}

export async function searchPhotos(familyId: string, query: string) {
  return await sql`
    SELECT DISTINCT
      pe.id,
      pe.photo_url,
      pe.caption,
      pe.location,
      ap.date_label,
      a.title as album_title
    FROM page_elements pe
    JOIN album_pages ap ON pe.page_id = ap.id
    JOIN albums a ON ap.album_id = a.id
    WHERE a.family_id = ${familyId}
    AND pe.type = 'photo'
    AND pe.photo_url IS NOT NULL
    AND (pe.caption ILIKE ${`%${query}%`} 
         OR a.title ILIKE ${`%${query}%`}
         OR pe.location ILIKE ${`%${query}%`})
    ORDER BY pe.created_at DESC
  `;
}

export async function filterPhotosByLocation(familyId: string, location: string) {
  return await sql`
    SELECT DISTINCT
      pe.id,
      pe.photo_url,
      pe.caption,
      pe.location,
      ap.date_label,
      a.title as album_title
    FROM page_elements pe
    JOIN album_pages ap ON pe.page_id = ap.id
    JOIN albums a ON ap.album_id = a.id
    WHERE a.family_id = ${familyId}
    AND pe.type = 'photo'
    AND pe.photo_url IS NOT NULL
    AND pe.location = ${location}
    ORDER BY pe.created_at DESC
  `;
}
```

---

### Step 3: Create Gallery Component

File: `src/components/PhotoGallery.tsx`

```typescript
"use client";

import { useState, useMemo } from "react";
import { Search, MapPinned, Calendar } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  location?: string;
  date_label?: string;
  album_title: string;
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [query, setQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Get unique locations for filter
  const locations = useMemo(() => {
    return Array.from(new Set(photos.map(p => p.location).filter(Boolean)));
  }, [photos]);

  // Filter photos
  const filtered = useMemo(() => {
    return photos.filter(p => {
      const matchesQuery = !query || 
        p.caption?.toLowerCase().includes(query.toLowerCase()) ||
        p.album_title.toLowerCase().includes(query.toLowerCase()) ||
        p.location?.toLowerCase().includes(query.toLowerCase());
      
      const matchesLocation = !selectedLocation || p.location === selectedLocation;
      
      return matchesQuery && matchesLocation;
    });
  }, [photos, query, selectedLocation]);

  if (photos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: TOKENS.ink60 }}>
        <p style={{ fontSize: 13.5 }}>Hali rasm yo'q</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px clamp(16px, 5vw, 48px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: "0 0 24px" }}>
          Rasmlar
        </h1>
        
        {/* Search */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 10, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, padding: "0 16px", height: 44 }}>
            <Search size={16} color={TOKENS.ink40} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rasm, albom yoki joy bo'yicha qidirish..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: TOKENS.ink, fontFamily: "Inter, sans-serif" }}
            />
          </div>
          
          {/* Location filter */}
          {locations.length > 0 && (
            <select
              value={selectedLocation || ""}
              onChange={(e) => setSelectedLocation(e.target.value || null)}
              style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}`, background: TOKENS.card, fontSize: 14, color: TOKENS.ink, cursor: "pointer" }}
            >
              <option value="">Barcha joylar</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          )}
        </div>

        <div style={{ fontSize: 12.5, color: TOKENS.ink60 }}>
          {filtered.length} ta rasm
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {filtered.map(photo => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            style={{
              cursor: "pointer",
              borderRadius: 8,
              overflow: "hidden",
              aspectRatio: "1",
              background: TOKENS.parchment,
              border: `1px solid ${TOKENS.parchmentDeep}`,
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${photo.photo_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(30,38,33,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 600,
              maxHeight: "90vh",
              background: TOKENS.card,
              borderRadius: 16,
              overflow: "auto",
              padding: 24,
            }}
          >
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption}
              style={{ width: "100%", borderRadius: 8, marginBottom: 16 }}
            />
            {selectedPhoto.caption && (
              <p style={{ fontSize: 14, color: TOKENS.ink, marginBottom: 12 }}>
                {selectedPhoto.caption}
              </p>
            )}
            {selectedPhoto.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TOKENS.ink60, marginBottom: 8 }}>
                <MapPinned size={14} /> {selectedPhoto.location}
              </div>
            )}
            {selectedPhoto.date_label && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TOKENS.ink60, marginBottom: 8 }}>
                <Calendar size={14} /> {selectedPhoto.date_label}
              </div>
            )}
            <div style={{ fontSize: 12, color: TOKENS.ink60 }}>
              {selectedPhoto.album_title} albomida
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Step 4: Add Photos View to Dashboard

Update `HeirloomApp.jsx` VIEWS:

```javascript
const VIEWS = {
  DASHBOARD: "dashboard",
  ALBUMS: "albums",
  TREE: "tree",
  PEOPLE: "people",
  PHOTOS: "photos",  // ADD THIS
  TIMELINE: "timeline",
  MEMORIES: "memories",
  STORIES: "stories",
  SETTINGS: "settings",
};
```

Add to navigation:
```javascript
const NAV_CONFIG = [
  // ... existing items ...
  { id: VIEWS.PHOTOS, icon: ImagePlus, label: "Rasmlar" },
  // ...
];
```

---

### Step 5: Server Actions

File: `src/lib/actions.ts` — add:

```typescript
export async function updatePhotoMetadataAction(
  familySlug: string,
  photoId: string,
  caption: string,
  location: string
) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const family = await getFamilyBySlug(familySlug);
  if (!family) throw new Error("Family not found");

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role === "viewer") {
    throw new Error("Not authorized");
  }

  await sql`
    UPDATE page_elements
    SET caption = ${caption}, location = ${location}
    WHERE id = ${photoId}
  `;

  revalidateTag("photos");
}
```

---

### Step 6: Add Photos Page

Create: `src/app/[family]/photos/page.tsx`

```typescript
export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamilyBySlug, getMembership } from "@/lib/family";
import { getPhotosForFamily } from "@/lib/photos";
import { PhotoGallery } from "@/components/PhotoGallery";

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ family: string }>;
}) {
  const { family: familySlug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const family = await getFamilyBySlug(familySlug);
  if (!family) notFound();

  const membership = await getMembership(family.id, session.id);
  if (!membership) notFound();

  const photos = await getPhotosForFamily(family.id);

  return <PhotoGallery photos={photos} />;
}
```

---

## ✅ Testing Checklist

- [ ] Photos load from all albums
- [ ] Search works (caption, album, location)
- [ ] Location filter works
- [ ] Detail modal displays correctly
- [ ] Responsive on mobile
- [ ] Build passes

---

## 📈 Next: Phase 4

After photos gallery is done:
1. **Album Editor Refactor** — Replace slot-based with drag-drop
2. **Stories Editor** — Add rich text
3. **Places UI** — Create places feature
4. **Mobile Polish** — Touch optimization

---

## 💡 Tips

- Start with simple: just display photos grid
- Add filtering second
- Detail modal last
- Test with real data before polish

**Estimated time**: 4-6 hours
