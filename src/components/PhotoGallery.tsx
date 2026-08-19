"use client";

import { useState, useMemo } from "react";
import { Search, MapPinned, Calendar, X } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  location?: string;
  date_label?: string;
  album_title: string;
  album_id: string;
  created_at: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  locations: string[];
}

export function PhotoGallery({ photos, locations }: PhotoGalleryProps) {
  const [query, setQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

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
      <div style={{ textAlign: "center", padding: "80px 20px", color: TOKENS.ink60, fontSize: 13.5 }}>
        <p>Hali rasm yo'q</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px clamp(16px, 5vw, 48px)", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: "0 0 24px", letterSpacing: "-0.01em" }}>
          Rasmlar
        </h1>

        {/* Search & Filter */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {/* Search input */}
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
              style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}`, background: TOKENS.card, fontSize: 14, color: TOKENS.ink, cursor: "pointer", minWidth: 150 }}
            >
              <option value="">Barcha joylar ({locations.length})</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats */}
        <div style={{ fontSize: 12.5, color: TOKENS.ink60 }}>
          {filtered.length} ta rasm {selectedLocation && `"${selectedLocation}" dan`}
        </div>
      </div>

      {/* Photo Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: TOKENS.ink60, fontSize: 13.5 }}>
          Rasm topilmadi
        </div>
      ) : (
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
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = `0 8px 16px rgba(30,38,33,0.12)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
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
      )}

      {/* Detail Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(30,38,33,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 20,
            backdropFilter: "blur(4px)",
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
              border: `1px solid ${TOKENS.parchmentDeep}`,
              boxShadow: "0 25px 50px rgba(30,38,33,0.3)",
            }}
          >
            {/* Close button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo */}
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption}
              style={{ width: "100%", borderRadius: 8, marginBottom: 20, maxHeight: 400, objectFit: "contain" }}
            />

            {/* Caption */}
            {selectedPhoto.caption && (
              <p style={{ fontSize: 14, color: TOKENS.ink, marginBottom: 16, lineHeight: 1.6 }}>
                {selectedPhoto.caption}
              </p>
            )}

            {/* Metadata */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedPhoto.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TOKENS.ink60 }}>
                  <MapPinned size={14} strokeWidth={2} />
                  <span>{selectedPhoto.location}</span>
                </div>
              )}
              {selectedPhoto.date_label && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TOKENS.ink60 }}>
                  <Calendar size={14} strokeWidth={2} />
                  <span>{selectedPhoto.date_label}</span>
                </div>
              )}
              <div style={{ fontSize: 12, color: TOKENS.ink40, borderTop: `1px solid ${TOKENS.parchmentDeep}`, paddingTop: 12 }}>
                📀 <strong>{selectedPhoto.album_title}</strong> albomida
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
