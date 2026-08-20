import React, { useState, useRef, useEffect } from "react";
import {
  BookImage, Plus, ChevronRight, ChevronDown, ImagePlus, UserPlus, CalendarPlus,
  Camera, Link2, MapPinned,
} from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";
import { personLabel, personYears } from "@/lib/relationshipLabels";

export const VIEWS = {
  DASHBOARD: "dashboard",
  ALBUMS: "albums",
  TREE: "tree",
  PEOPLE: "people",
  TIMELINE: "timeline",
  MEMORIES: "memories",
  STORIES: "stories",
  PLACES: "places",
  SETTINGS: "settings",
};

export function SectionLabel({ eyebrow, title, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{eyebrow}</div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 500, color: TOKENS.ink, margin: 0 }}>{title}</h2>
      </div>
      {action && (
        <button className="fm-link" onClick={onAction}>
          {action} <ChevronRight size={14} style={{ marginLeft: 2, verticalAlign: -2 }} />
        </button>
      )}
    </div>
  );
}

/**
 * Bo'sh holat (empty state) uchun umumiy komponent — ikonka, sarlavha, tavsif
 * va ixtiyoriy amal tugmasi bilan. Dashboard, albomlar, vaqt chizig'i va
 * oila daraxti bo'limlarida ishlatiladi.
 */
export function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 14 }}>
      {icon && <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>{icon}</div>}
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 500, color: TOKENS.ink, marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 12.5, color: TOKENS.ink60, lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>{description}</div>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Universal "+ Yangi" tugmasi. Faqat haqiqatan mavjud bo'lgan yaratish
 * amallarini ko'rsatadi (odam qo'shish, albom yaratish, rasmlar yuklash,
 * voqea, xotira, hikoya, joy qo'shish). Hali qurilmagan feature
 * qo'shilganda shu ro'yxatga qo'shiladi — hali yo'q narsani va'da qilib
 * chalg'itmaymiz.
 */
export function CreateMenu({ onCreateAlbum, onAddPerson, onUploadPhotos, onAddEvent, onAddMemory, onAddStory, onAddPlace }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = [
    onUploadPhotos && { icon: ImagePlus, label: "Rasmlar yuklash", onClick: onUploadPhotos },
    onCreateAlbum && { icon: BookImage, label: "Albom yaratish", onClick: onCreateAlbum },
    onAddPerson && { icon: UserPlus, label: "Odam qo'shish", onClick: onAddPerson },
    onAddEvent && { icon: CalendarPlus, label: "Voqea qo'shish", onClick: onAddEvent },
    onAddMemory && { icon: Camera, label: "Xotira qo'shish", onClick: onAddMemory },
    onAddStory && { icon: Link2, label: "Hikoya qo'shish", onClick: onAddStory },
    onAddPlace && { icon: MapPinned, label: "Joy qo'shish", onClick: onAddPlace },
  ].filter(Boolean);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "0 18px", height: 44, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
      >
        <Plus size={15} /> Yangi <ChevronDown size={13} style={{ opacity: 0.7, marginLeft: -2 }} />
      </button>
      {open && (
        <div className="fm-panel-enter" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 210, background: TOKENS.card, borderRadius: 12, border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 18px 40px rgba(30,38,33,0.18)", padding: 6, zIndex: 40 }}>
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => { setOpen(false); it.onClick(); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none", border: "none", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontWeight: 500, color: TOKENS.ink, cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.parchment)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <it.icon size={15} color={TOKENS.gold} /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatItem({ value, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: TOKENS.parchment }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "rgba(242,237,226,0.62)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{label}</div>
    </div>
  );
}

const COVER_GRADIENTS = [
  [TOKENS.gold, TOKENS.teal],
  [TOKENS.teal, TOKENS.ink],
  [TOKENS.goldSoft, TOKENS.gold],
  [TOKENS.ink, TOKENS.tealSoft],
];

export function coverGradientFor(id) {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [a, b] = COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function AlbumCard({ album: a, onClick, compact }) {
  const photoCount = a.pages.reduce((sum, p) => sum + p.elements.filter((e) => e.type === "photo" && e.photo_url).length, 0);
  return (
    <div onClick={onClick} className="fm-album-card" style={{ background: TOKENS.card, borderRadius: compact ? 10 : 12, padding: 14, boxShadow: compact ? "0 2px 8px rgba(30,38,33,0.06)" : undefined, border: `1px solid ${TOKENS.parchmentDeep}` }}>
      <div
        style={{
          width: "100%", aspectRatio: "4/3", borderRadius: 7, marginBottom: 12,
          background: a.cover_url ? undefined : coverGradientFor(a.id || a.title),
          backgroundImage: a.cover_url ? `url(${a.cover_url})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: a.cover_url ? 0 : 12,
        }}
      >
        {!a.cover_url && (
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.2 }}>
            {a.title}
          </div>
        )}
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: compact ? 16 : 16.5, fontWeight: 500 }}>{a.title}</div>
      <div style={{ fontSize: 12, color: TOKENS.ink60, marginTop: 3 }}>
        {[a.date_label, a.location, `${a.pages.length} sahifa`, `${photoCount} rasm`].filter(Boolean).join(" · ")}
      </div>
    </div>
  );
}

/**
 * Haqiqiy `people` va `relationships` qatorlaridan avlodlar (generations)
 * ro'yxatini quradi. Har bir "unit" — bitta odam yoki er-xotin juftligi.
 * `type: "parent"` munosabati person_a → person_b (ota-ona → farzand) degani.
 */
export function buildFamilyGenerations(people, relationships) {
  if (!people || people.length === 0) return [];

  const byId = {};
  people.forEach((p) => (byId[p.id] = p));

  const parentsOf = {};
  const spouseOf = {};
  relationships.forEach((r) => {
    if (r.type === "parent") {
      if (!byId[r.person_a_id] || !byId[r.person_b_id]) return;
      (parentsOf[r.person_b_id] ||= []).push(r.person_a_id);
    } else if (r.type === "spouse") {
      if (!byId[r.person_a_id] || !byId[r.person_b_id]) return;
      spouseOf[r.person_a_id] = r.person_b_id;
      spouseOf[r.person_b_id] = r.person_a_id;
    }
  });

  const personUnit = {};
  const units = {};
  let counter = 0;
  people.forEach((p) => {
    if (personUnit[p.id]) return;
    const spouseId = spouseOf[p.id];
    const unitId = `u${counter++}`;
    const memberIds = spouseId && byId[spouseId] && !personUnit[spouseId] ? [p.id, spouseId] : [p.id];
    memberIds.forEach((id) => (personUnit[id] = unitId));
    units[unitId] = { id: unitId, personIds: memberIds, parent: null, level: null };
  });

  Object.values(units).forEach((unit) => {
    for (const pid of unit.personIds) {
      const parents = parentsOf[pid];
      if (parents && parents.length) {
        const parentUnitId = personUnit[parents[0]];
        if (parentUnitId && parentUnitId !== unit.id) {
          unit.parent = parentUnitId;
          break;
        }
      }
    }
  });

  function levelOf(unitId, seen) {
    const unit = units[unitId];
    if (unit.level != null) return unit.level;
    if (!unit.parent || seen.has(unitId)) {
      unit.level = 0;
      return 0;
    }
    seen.add(unitId);
    unit.level = levelOf(unit.parent, seen) + 1;
    return unit.level;
  }
  Object.keys(units).forEach((id) => levelOf(id, new Set()));

  const maxLevel = Math.max(0, ...Object.values(units).map((u) => u.level));
  const gens = Array.from({ length: maxLevel + 1 }, (_, i) => ({ genLabel: `${i + 1}-avlod`, units: [] }));

  Object.values(units)
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((unit) => {
      gens[unit.level].units.push({
        id: unit.id,
        parent: unit.parent,
        people: unit.personIds.map((pid) => ({
          id: byId[pid].id,
          name: personLabel(byId[pid]),
          years: personYears(byId[pid]),
          seed: byId[pid].id,
          biography: byId[pid].biography,
          photoUrl: byId[pid].profile_photo_url,
          gender: byId[pid].gender,
          raw: byId[pid],
        })),
      });
    });

  return gens;
}
