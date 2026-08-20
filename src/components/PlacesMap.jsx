"use client";

import { useEffect, useRef, useState } from "react";
import { TOKENS } from "@/lib/uiTokens";

const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletLoadPromise = null;

/**
 * Leaflet'ni CDN'dan (unpkg) dinamik yuklaydi. npm paketi sifatida
 * o'rnatilmagan — chunki bu loyihaning build muhitida paket
 * registry'ga kirish cheklangan bo'lishi mumkin. Brauzerda ishlaganda
 * (foydalanuvchi tomonida) internetga oddiy tashqi so'rov sifatida
 * yuklanadi, npm bilan bog'liq emas.
 */
function loadLeaflet() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS_URL;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(`script[src="${LEAFLET_JS_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L));
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

/** Rasm fayliga bog'liq bo'lmagan, TOKENS ranglariga mos oddiy pin ikonkasi. */
function makePinIcon(L, { active, picker } = {}) {
  const color = picker ? TOKENS.gold : active ? TOKENS.gold : TOKENS.teal;
  const size = active || picker ? 30 : 24;
  const html = `
    <div style="
      width:${size}px; height:${size}px;
      display:flex; align-items:center; justify-content:center;
      transform: translate(-50%, -100%);
    ">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 6.5 9 15 9 15s9-8.5 9-15c0-4.97-4.03-9-9-9z" fill="${color}" stroke="${TOKENS.card}" stroke-width="1"/>
        <circle cx="12" cy="9" r="3.4" fill="${TOKENS.card}"/>
      </svg>
    </div>
  `;
  return L.divIcon({ html, className: "fm-place-pin", iconSize: [size, size], iconAnchor: [size / 2, size] });
}

/**
 * Joylar xaritasi. `places`dagi lat/lng'ga ega elementlarni marker
 * sifatida ko'rsatadi. `pickMode` yoqilganda xaritani bosish orqali
 * koordinata tanlash mumkin (yangi joy qo'shish/tahrirlash formasi
 * uchun) — natija `onPick(lat, lng)` orqali qaytadi.
 */
export function PlacesMap({ places = [], selectedId, onSelectPlace, pickMode = false, pickedLocation, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const pickerMarkerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const withCoords = places.filter((p) => p.latitude != null && p.longitude != null);

  // Xaritani bir marta ishga tushirish
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !L || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, {
          center: [41.3, 69.2], // O'zbekiston atrofi — koordinatasiz holatdagi standart markaz
          zoom: 4,
          scrollWheelZoom: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => !cancelled && setLoadError(true));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // pickMode yoqilganda xaritani bosish -> koordinata tanlash
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!pickMode) {
      map.off("click");
      return;
    }
    const handler = (e) => onPick?.(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => map.off("click", handler);
  }, [pickMode, ready, onPick]);

  // Markerlarni har safar places/selectedId o'zgarganda qayta chizish
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !window.L) return;
    const L = window.L;

    const seenIds = new Set();
    withCoords.forEach((p) => {
      seenIds.add(p.id);
      const isActive = p.id === selectedId;
      const icon = makePinIcon(L, { active: isActive });
      let marker = markersRef.current.get(p.id);
      if (!marker) {
        marker = L.marker([p.latitude, p.longitude], { icon }).addTo(map);
        marker.on("click", () => onSelectPlace?.(p));
        markersRef.current.set(p.id, marker);
      } else {
        marker.setLatLng([p.latitude, p.longitude]);
        marker.setIcon(icon);
      }
      marker.bindTooltip(p.name, { direction: "top", offset: [0, -size(isActive)] });
    });

    // Endi ro'yxatda yo'q markerlarni tozalash
    for (const [id, marker] of markersRef.current.entries()) {
      if (!seenIds.has(id)) {
        map.removeLayer(marker);
        markersRef.current.delete(id);
      }
    }

    function size(active) {
      return active ? 30 : 24;
    }
  }, [withCoords, selectedId, ready, onSelectPlace]);

  // Bounds'ni moslashtirish (faqat markerlar birinchi marta paydo bo'lganda / soni o'zgarganda)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !window.L || withCoords.length === 0) return;
    const L = window.L;
    const bounds = L.latLngBounds(withCoords.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, withCoords.length]);

  // Tanlangan joyga markazlashtirish
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const p = withCoords.find((pl) => pl.id === selectedId);
    if (p) map.panTo([p.latitude, p.longitude]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, ready]);

  // Pick-marker (tanlanayotgan yangi koordinata)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !window.L) return;
    const L = window.L;

    if (pickedLocation) {
      const icon = makePinIcon(L, { picker: true });
      if (!pickerMarkerRef.current) {
        pickerMarkerRef.current = L.marker([pickedLocation.lat, pickedLocation.lng], { icon, draggable: true }).addTo(map);
        pickerMarkerRef.current.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng();
          onPick?.(lat, lng);
        });
      } else {
        pickerMarkerRef.current.setLatLng([pickedLocation.lat, pickedLocation.lng]);
      }
    } else if (pickerMarkerRef.current) {
      map.removeLayer(pickerMarkerRef.current);
      pickerMarkerRef.current = null;
    }
  }, [pickedLocation, ready, onPick]);

  if (loadError) {
    return (
      <div style={mapShellStyle}>
        <div style={emptyOverlayStyle}>
          <div style={{ fontSize: 13, color: TOKENS.ink60 }}>Xarita yuklanmadi — internet aloqasini tekshiring.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={mapShellStyle}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {!ready && (
        <div style={emptyOverlayStyle}>
          <div style={{ fontSize: 13, color: TOKENS.ink60 }}>Xarita yuklanmoqda...</div>
        </div>
      )}
      {ready && withCoords.length === 0 && !pickMode && (
        <div style={{ ...emptyOverlayStyle, pointerEvents: "none" }}>
          <div style={{ fontSize: 13, color: TOKENS.ink60, background: TOKENS.card, padding: "10px 16px", borderRadius: 8, boxShadow: "0 2px 8px rgba(30,38,33,0.12)" }}>
            Hali koordinatali joy yo'q
          </div>
        </div>
      )}
      {pickMode && (
        <div style={{ position: "absolute", top: 10, left: 10, background: TOKENS.card, padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 600, color: TOKENS.teal, boxShadow: "0 2px 8px rgba(30,38,33,0.12)", zIndex: 500 }}>
          📍 Joylashuvni belgilash uchun xaritani bosing
        </div>
      )}
    </div>
  );
}

const mapShellStyle = {
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 260,
  borderRadius: 12,
  overflow: "hidden",
  border: `1px solid ${TOKENS.parchmentDeep}`,
  background: TOKENS.parchmentDeep,
};

const emptyOverlayStyle = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 400,
};
