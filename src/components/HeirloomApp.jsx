"use client";

import React, { useState, useRef, useMemo, useLayoutEffect, useCallback, useActionState } from "react";
import {
  Home, BookImage, TreePine, Clock, Heart, Users, MapPin, Search, Plus, X,
  ChevronRight, ChevronLeft, Calendar, MapPinned, Type, Sticker, LayoutGrid, Settings, LogOut, Camera,
} from "lucide-react";
import { TOKENS, FONT_IMPORT } from "@/lib/uiTokens";
import { relationLabelBetween } from "@/lib/relationshipLabels";

const VIEWS = {
  DASHBOARD: "dashboard",
  ALBUMS: "albums",
  TREE: "tree",
};

const NAV_CONFIG = [
  { id: VIEWS.DASHBOARD, icon: Home, label: "Bosh sahifa" },
  { id: VIEWS.ALBUMS, icon: BookImage, label: "Albomlar" },
  { id: VIEWS.TREE, icon: TreePine, label: "Oila daraxti" },
  { id: "timeline", icon: Clock, label: "Vaqt chizig'i", soon: true },
  { id: "memories", icon: Heart, label: "Xotiralar", soon: true },
  { id: "people", icon: Users, label: "Odamlar", soon: true },
  { id: "places", icon: MapPin, label: "Joylar", soon: true },
];

/* ---------------- shared bits ---------------- */

function GlobalStyle() {
  return (
    <style>{`
      ${FONT_IMPORT}
      * { box-sizing: border-box; }
      .fm-scroll::-webkit-scrollbar { height: 6px; }
      .fm-scroll::-webkit-scrollbar-thumb { background: ${TOKENS.goldSoft}; border-radius: 10px; }
      .fm-scroll { scrollbar-width: thin; scrollbar-color: ${TOKENS.goldSoft} transparent; }
      .fm-polaroid {
        background: ${TOKENS.card};
        padding: 8px 8px 4px;
        border-radius: 4px;
        box-shadow: 0 6px 16px rgba(30,38,33,0.12), 0 1px 2px rgba(30,38,33,0.08);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        cursor: pointer;
      }
      .fm-polaroid:hover { transform: rotate(0deg) translateY(-4px) scale(1.02) !important; box-shadow: 0 14px 28px rgba(30,38,33,0.18); }
      .fm-nav-item {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px; border-radius: 8px;
        color: rgba(242,237,226,0.72);
        font-size: 13.5px; font-weight: 500;
        cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
        white-space: nowrap; position: relative;
      }
      .fm-nav-item:hover { background: rgba(242,237,226,0.08); color: ${TOKENS.parchment}; }
      .fm-nav-item.active { background: rgba(184,134,59,0.18); color: ${TOKENS.goldSoft}; }
      .fm-nav-item.soon { opacity: 0.45; cursor: default; }
      .fm-link { background: none; border: none; cursor: pointer; font-size: 12.5px; font-weight: 600; color: ${TOKENS.teal}; display: flex; align-items: center; }
      .fm-link:hover { color: ${TOKENS.gold}; }
      .fm-album-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
      .fm-album-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(30,38,33,0.14); }
      .fm-person { display: flex; align-items: center; gap: 10px; background: ${TOKENS.card}; border-radius: 30px; padding: 5px 16px 5px 5px; cursor: pointer; box-shadow: 0 2px 6px rgba(30,38,33,0.07); transition: transform 0.18s ease, box-shadow 0.18s ease; max-width: 210px; }
      .fm-person:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(30,38,33,0.15); }
      .fm-couple { display: flex; align-items: center; gap: 8px; }
      .fm-couple-link { width: 14px; height: 1.5px; background: ${TOKENS.goldSoft}; flex-shrink: 0; }
      .fm-fade { animation: fm-fade-in 0.35s ease; }
      .fm-panel-enter { animation: fm-slide-in 0.28s ease; }
      @keyframes fm-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fm-slide-in { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .fm-polaroid, .fm-album-card, .fm-person, .fm-fade, .fm-panel-enter { transition: none !important; animation: none !important; }
      }
    `}</style>
  );
}

function Sidebar({ current, onNavigate, onLogout }) {
  return (
    <aside style={{ width: 220, background: TOKENS.ink, padding: "26px 14px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px 28px" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})` }} />
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: TOKENS.parchment, fontWeight: 600 }}>Heirloom</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_CONFIG.map((item) => (
          <div
            key={item.id}
            className={`fm-nav-item ${current === item.id ? "active" : ""} ${item.soon ? "soon" : ""}`}
            onClick={() => !item.soon && onNavigate(item.id)}
            title={item.soon ? "Tez orada" : undefined}
          >
            <item.icon size={16} strokeWidth={2} />
            {item.label}
            {item.soon && <span style={{ marginLeft: "auto", fontSize: 9.5, color: TOKENS.ink40 }}>tez orada</span>}
          </div>
        ))}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(242,237,226,0.1)" }}>
        <div className="fm-nav-item">
          <Settings size={16} /> Sozlamalar
        </div>
        <div className="fm-nav-item" onClick={onLogout}>
          <LogOut size={16} /> Chiqish
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Dashboard view ---------------- */

const albumsMock = [
  { id: 1, title: "2026 — Parij", sub: "May 2026 · 86 rasm", seed: "paris-fam", rot: -3 },
  { id: 2, title: "Yozgi ta'til", sub: "2025 · 142 rasm", seed: "summer-fam", rot: 2 },
  { id: 3, title: "Universitet", sub: "2019–2023 · 58 rasm", seed: "uni-fam", rot: -2 },
  { id: 4, title: "Bolalik", sub: "1998–2005 · 210 rasm", seed: "childhood-fam", rot: 3 },
];
const memoriesMock = [
  { id: 1, years: "3 yil oldin", caption: "Parijda", seed: "mem1" },
  { id: 2, years: "5 yil oldin", caption: "Universitetda", seed: "mem2" },
  { id: 3, years: "8 yil oldin", caption: "Oilaviy kechqurun", seed: "mem3" },
  { id: 4, years: "12 yil oldin", caption: "Bobom bilan", seed: "mem4" },
];
const timelineMock = [
  { year: "2000", label: "Tug'ilgan kun" },
  { year: "2010", label: "Maktabning birinchi kuni" },
  { year: "2015", label: "Oilaviy sayohat" },
  { year: "2020", label: "Bitiruv" },
  { year: "2023", label: "Universitet" },
];

function SectionLabel({ eyebrow, title, action, onAction }) {
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

function Polaroid({ seed, caption, sub, rot = 0 }) {
  return (
    <div className="fm-polaroid" style={{ transform: `rotate(${rot}deg)`, width: 168, flexShrink: 0 }}>
      <div style={{ width: "100%", aspectRatio: "1/1", backgroundImage: `url(https://picsum.photos/seed/${seed}/400/400)`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 3 }} />
      <div style={{ padding: "12px 6px 4px" }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 14.5, color: TOKENS.ink, fontWeight: 500 }}>{caption}</div>
        {sub && <div style={{ fontSize: 11.5, color: TOKENS.ink60, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function DashboardView({ onNavigate, onOpenAlbum, userName, familyName, peopleCount }) {
  const [query, setQuery] = useState("");
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return "Xayrli tong";
    if (h < 18) return "Xayrli kun";
    return "Xayrli kech";
  });

  return (
    <div className="fm-fade" style={{ padding: "40px 48px 64px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 38, fontWeight: 500, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{greeting}, {userName}</h1>
        <p style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 16.5, color: TOKENS.ink60, margin: "0 0 26px" }}>"Har bir oila o'z hikoyasiga ega."</p>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, padding: "11px 16px" }}>
            <Search size={16} color={TOKENS.ink40} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Xotiralar, odamlar qidirish..." style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: TOKENS.ink, fontFamily: "Inter, sans-serif" }} />
          </div>
          <button onClick={() => onNavigate(VIEWS.ALBUMS)} style={{ display: "flex", alignItems: "center", gap: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "0 20px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> Yangi
          </button>
        </div>
      </div>

      <section style={{ marginBottom: 48 }}>
        <SectionLabel eyebrow="Bugungi kun" title="Shu kunlarda xotiralar" />
        <div className="fm-scroll" style={{ display: "flex", gap: 22, overflowX: "auto", paddingBottom: 14, paddingTop: 6 }}>
          {memoriesMock.map((m) => <Polaroid key={m.id} seed={m.seed} caption={m.caption} sub={m.years} rot={m.id % 2 ? -3 : 3} />)}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <SectionLabel eyebrow="Arxiv" title="Mening albomlarim" action="Barchasi" onAction={() => onNavigate(VIEWS.ALBUMS)} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
          {albumsMock.map((a) => (
            <div key={a.id} className="fm-album-card" onClick={() => onOpenAlbum(a)} style={{ background: TOKENS.card, borderRadius: 10, padding: 14, boxShadow: "0 2px 8px rgba(30,38,33,0.06)", border: `1px solid ${TOKENS.parchmentDeep}` }}>
              <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 6, backgroundImage: `url(https://picsum.photos/seed/${a.seed}/400/300)`, backgroundSize: "cover", backgroundPosition: "center", marginBottom: 12 }} />
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 500 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: TOKENS.ink60, marginTop: 3 }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <SectionLabel eyebrow="Hayot yo'li" title="Vaqt chizig'i" />
        <div style={{ background: TOKENS.card, borderRadius: 14, padding: "28px 34px", border: `1px solid ${TOKENS.parchmentDeep}`, overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", minWidth: 620 }}>
            {timelineMock.map((t, i) => (
              <React.Fragment key={t.year}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", background: TOKENS.card, border: `2.5px solid ${TOKENS.gold}` }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 600, color: TOKENS.teal }}>{t.year}</div>
                    <div style={{ fontSize: 11.5, color: TOKENS.ink60, marginTop: 2, maxWidth: 92 }}>{t.label}</div>
                  </div>
                </div>
                {i < timelineMock.length - 1 && <div style={{ flex: 1, height: 1.5, background: TOKENS.parchmentDeep, marginBottom: 40 }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionLabel eyebrow="Avlodlar" title="Oila daraxti" action="Ochish" onAction={() => onNavigate(VIEWS.TREE)} />
        <div onClick={() => onNavigate(VIEWS.TREE)} style={{ cursor: "pointer", background: `linear-gradient(135deg, ${TOKENS.teal}, ${TOKENS.ink})`, borderRadius: 14, padding: "30px 34px", display: "flex", alignItems: "center", justifyContent: "space-between", color: TOKENS.parchment }}>
          <div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginBottom: 6 }}>{familyName}</div>
            <div style={{ fontSize: 12.5, color: "rgba(242,237,226,0.7)" }}>
              {peopleCount > 0 ? `${peopleCount} a'zo qo'shilgan` : "Hali hech kim qo'shilmagan — boshlash uchun bosing"}
            </div>
          </div>
          <TreePine size={34} color={TOKENS.goldSoft} strokeWidth={1.3} />
        </div>
      </section>
    </div>
  );
}

/* ---------------- Family Tree view ---------------- */

function personLabel(p) {
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || "Ism kiritilmagan";
}

function personYears(p) {
  if (p.birth_date && p.death_date) return `${p.birth_date}–${p.death_date}`;
  if (p.birth_date) return p.birth_date;
  if (p.death_date) return `–${p.death_date}`;
  return "";
}

/**
 * Haqiqiy `people` va `relationships` qatorlaridan avlodlar (generations)
 * ro'yxatini quradi. Har bir "unit" — bitta odam yoki er-xotin juftligi.
 * `type: "parent"` munosabati person_a → person_b (ota-ona → farzand) degani.
 */
function buildFamilyGenerations(people, relationships) {
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

function PersonNode({ person, onSelect, nodeRef, isMe }) {
  return (
    <div ref={nodeRef} onClick={() => onSelect(person)} className="fm-person" style={{ border: isMe ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}` }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: person.photoUrl ? undefined : TOKENS.parchmentDeep,
          backgroundImage: person.photoUrl ? `url(${person.photoUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          flexShrink: 0,
          display: person.photoUrl ? undefined : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Fraunces, serif",
          fontSize: 15,
          color: TOKENS.ink60,
        }}
      >
        {!person.photoUrl && (person.name?.[0]?.toUpperCase() || "?")}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 13.5, fontWeight: 500, color: TOKENS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person.name}</div>
        <div style={{ fontSize: 11, color: TOKENS.ink60, marginTop: 1 }}>{person.years}</div>
      </div>
    </div>
  );
}

function EmptyFamilyTree({ familyName, canEdit, onAddPerson }) {
  return (
    <div className="fm-fade" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <TreePine size={26} color={TOKENS.gold} strokeWidth={1.4} />
        </div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 500, margin: "0 0 8px" }}>{familyName} — oila daraxti hali bo'sh</h1>
        <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 24px" }}>
          Hech qanday tayyor namuna yo'q — hikoyangizni o'zingizdan boshlang. Birinchi odam sifatida odatda o'zingizni qo'shasiz, keyin ota-onangiz, farzandlaringiz yoki turmush o'rtog'ingizni bog'laysiz.
        </p>
        {canEdit ? (
          <button onClick={onAddPerson} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Birinchi odamni qo'shish
          </button>
        ) : (
          <div style={{ fontSize: 12.5, color: TOKENS.ink40 }}>Odam qo'shish uchun ruxsatingiz yo'q.</div>
        )}
      </div>
    </div>
  );
}

function FamilyTreeView({
  familyName,
  familySlug,
  people,
  relationships,
  canEdit,
  mePersonId,
  addPersonAction,
  linkPersonAction,
  editPersonAction,
  deletePersonAction,
  uploadPersonPhotoAction,
}) {
  const [selected, setSelected] = useState(null);
  const [paths, setPaths] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const containerRef = useRef(null);
  const unitRefs = useRef({});

  const relationToMe = useMemo(() => {
    if (!selected || !mePersonId) return null;
    return relationLabelBetween(mePersonId, selected.id, people, relationships);
  }, [selected, mePersonId, people, relationships]);

  const generations = useMemo(() => buildFamilyGenerations(people, relationships), [people, relationships]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const newPaths = [];
    generations.forEach((gen) => {
      gen.units.forEach((unit) => {
        if (!unit.parent) return;
        const parentEl = unitRefs.current[unit.parent];
        const childEl = unitRefs.current[unit.id];
        if (!parentEl || !childEl) return;
        const pRect = parentEl.getBoundingClientRect();
        const cRect2 = childEl.getBoundingClientRect();
        const x1 = pRect.left + pRect.width / 2 - cRect.left;
        const y1 = pRect.bottom - cRect.top;
        const x2 = cRect2.left + cRect2.width / 2 - cRect.left;
        const y2 = cRect2.top - cRect.top;
        const ym = y1 + (y2 - y1) / 2;
        newPaths.push(`M ${x1} ${y1} L ${x1} ${ym} L ${x2} ${ym} L ${x2} ${y2}`);
      });
    });
    setPaths(newPaths);
  }, [generations]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 200);
    return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
  }, [measure]);

  if (people.length === 0) {
    return (
      <>
        <EmptyFamilyTree familyName={familyName} canEdit={canEdit} onAddPerson={() => setShowAddModal(true)} />
        {showAddModal && (
          <AddPersonModal familySlug={familySlug} people={people} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
        )}
      </>
    );
  }

  const memberCount = people.length;
  const genCount = generations.length;

  return (
    <div className="fm-fade" style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1, padding: "36px 20px 60px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", maxWidth: 900, margin: "0 auto 30px" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Avlodlar</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>{familyName}</h1>
            <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 6 }}>{genCount} avlod · {memberCount} a'zo</div>
          </div>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={14} /> Odam qo'shish
            </button>
          )}
        </div>

        <div ref={containerRef} style={{ position: "relative", maxWidth: 900, margin: "0 auto" }}>
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {paths.map((d, i) => <path key={i} d={d} stroke={TOKENS.parchmentDeep} strokeWidth="2" fill="none" />)}
          </svg>
          {generations.map((gen) => (
            <div key={gen.genLabel} style={{ marginBottom: 56, position: "relative" }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.12em", color: TOKENS.ink40, textTransform: "uppercase", textAlign: "center", marginBottom: 18 }}>{gen.genLabel}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
                {gen.units.map((unit) => (
                  <div key={unit.id} ref={(el) => (unitRefs.current[unit.id] = el)} className="fm-couple">
                    {unit.people.map((person, i) => (
                      <React.Fragment key={person.id}>
                        {i > 0 && <div className="fm-couple-link" />}
                        <PersonNode person={person} onSelect={setSelected} isMe={person.id === mePersonId} />
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fm-panel-enter" style={{ width: 300, flexShrink: 0, background: TOKENS.card, borderLeft: `1px solid ${TOKENS.parchmentDeep}`, padding: "24px 22px", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { setSelected(null); setConfirmDelete(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 4 }}><X size={18} /></button>
          </div>

          <div style={{ position: "relative", width: 84, height: 84, margin: "6px auto 16px" }}>
            <div
              style={{
                width: 84, height: 84, borderRadius: "50%",
                background: selected.photoUrl ? undefined : TOKENS.parchmentDeep,
                backgroundImage: selected.photoUrl ? `url(${selected.photoUrl})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                border: `3px solid ${TOKENS.parchmentDeep}`,
                display: selected.photoUrl ? undefined : "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Fraunces, serif", fontSize: 28, color: TOKENS.ink60,
              }}
            >
              {!selected.photoUrl && (selected.name?.[0]?.toUpperCase() || "?")}
            </div>
            {canEdit && uploadPersonPhotoAction && (
              <PhotoUploadButton
                familySlug={familySlug}
                personId={selected.id}
                uploadPersonPhotoAction={uploadPersonPhotoAction}
              />
            )}
          </div>

          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500 }}>{selected.name}</div>
            {selected.years && <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Calendar size={12} /> {selected.years}</div>}
            {selected.id === mePersonId ? (
              <div style={{ fontSize: 11, fontWeight: 600, color: TOKENS.gold, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bu — sizsiz</div>
            ) : relationToMe ? (
              <div style={{ fontSize: 11.5, color: TOKENS.teal, marginTop: 6, fontWeight: 600 }}>Sizga: {relationToMe}</div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20, marginTop: 12 }}>
            {["Vaqt chizig'i", "Rasmlar", "Hikoyalar"].map((tab, i) => (
              <div key={tab} style={{ fontSize: 11.5, fontWeight: 600, padding: "6px 10px", borderRadius: 20, background: i === 0 ? TOKENS.ink : "transparent", color: i === 0 ? TOKENS.parchment : TOKENS.ink60, border: i === 0 ? "none" : `1px solid ${TOKENS.parchmentDeep}`, cursor: "pointer" }}>{tab}</div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: TOKENS.ink60, lineHeight: 1.6, marginBottom: 20 }}>
            {selected.biography || "Bu odam haqida hali biografiya qo'shilmagan. Uning hayoti haqidagi voqealar, rasmlar va hikoyalarni shu yerga qo'shishingiz mumkin."}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: TOKENS.ink40 }}><MapPinned size={12} /> Joylashuv qo'shilmagan</div>

          {canEdit && (
            <>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button onClick={() => setShowEditModal(true)} style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  Tahrirlash
                </button>
                <button onClick={() => setShowLinkModal(true)} style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  Bog'lash
                </button>
              </div>

              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} style={{ marginTop: 10, width: "100%", background: "transparent", color: TOKENS.danger, border: `1px solid ${TOKENS.danger}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  O'chirish
                </button>
              ) : (
                <div style={{ marginTop: 10, padding: 12, background: "rgba(168,69,58,0.08)", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: TOKENS.danger, marginBottom: 10 }}>
                    Rostdan ham o'chirasizmi? Bog'lanishlari ham o'chadi. Bu amalni ortga qaytarib bo'lmaydi.
                  </div>
                  <form action={deletePersonAction} style={{ display: "flex", gap: 8 }}>
                    <input type="hidden" name="familySlug" value={familySlug} />
                    <input type="hidden" name="personId" value={selected.id} />
                    <button type="submit" style={{ flex: 1, background: TOKENS.danger, color: "#fff", border: "none", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Ha, o'chirish
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} style={{ flex: 1, background: "transparent", color: TOKENS.ink60, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Bekor qilish
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showAddModal && (
        <AddPersonModal familySlug={familySlug} people={people} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
      )}

      {showLinkModal && selected && (
        <LinkPersonModal
          familySlug={familySlug}
          person={selected}
          people={people}
          linkPersonAction={linkPersonAction}
          onClose={() => setShowLinkModal(false)}
        />
      )}

      {showEditModal && selected && (
        <EditPersonModal
          familySlug={familySlug}
          person={selected}
          editPersonAction={editPersonAction}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

/* ---------------- Profile photo upload (small inline form + camera button) ---------------- */

function PhotoUploadButton({ familySlug, personId, uploadPersonPhotoAction }) {
  const [state, formAction, pending] = useActionState(uploadPersonPhotoAction, undefined);
  const inputRef = useRef(null);

  return (
    <form action={formAction}>
      <input type="hidden" name="familySlug" value={familySlug} />
      <input type="hidden" name="personId" value={personId} />
      <input
        ref={inputRef}
        type="file"
        name="photo"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.length) e.target.form.requestSubmit();
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        title="Rasm yuklash"
        style={{
          position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%",
          background: TOKENS.ink, border: `2px solid ${TOKENS.card}`, color: TOKENS.parchment,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        <Camera size={13} />
      </button>
      {state?.error && (
        <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 6, width: 180, fontSize: 10.5, color: TOKENS.danger, textAlign: "center" }}>
          {state.error}
        </div>
      )}
    </form>
  );
}

/* ---------------- Add Person modal ---------------- */

function AddPersonModal({ familySlug, people, addPersonAction, onClose }) {
  const [state, formAction, pending] = useActionState(addPersonAction, undefined);
  const [relationType, setRelationType] = useState("none");

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fm-panel-enter"
        style={{ width: "100%", maxWidth: 440, maxHeight: "88vh", overflow: "auto", background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi odam qo'shish</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />

          <div style={{ display: "flex", gap: 10 }}>
            <input name="firstName" placeholder="Ism" required className="fm-modal-input" style={inputStyle} />
            <input name="lastName" placeholder="Familiya" className="fm-modal-input" style={inputStyle} />
          </div>

          <select name="gender" defaultValue="" style={inputStyle}>
            <option value="">Jinsi (ixtiyoriy)</option>
            <option value="female">Ayol</option>
            <option value="male">Erkak</option>
            <option value="other">Boshqa</option>
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <input name="birthDate" placeholder="Tug'ilgan yil (masalan, 1980)" style={inputStyle} />
            <input name="deathDate" placeholder="Vafot yili (agar bo'lsa)" style={inputStyle} />
          </div>

          <textarea name="biography" placeholder="Qisqacha hikoya yoki biografiya (ixtiyoriy)" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />

          {people.length > 0 && (
            <>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60, marginTop: 4 }}>Oila daraxtiga qanday bog'lanadi?</div>
              <select name="relationType" value={relationType} onChange={(e) => setRelationType(e.target.value)} style={inputStyle}>
                <option value="none">Hozircha bog'lamayman</option>
                <option value="child_of">...ning farzandi</option>
                <option value="spouse_of">...ning turmush o'rtog'i</option>
              </select>
              {relationType !== "none" && (
                <select name="relatedPersonId" defaultValue="" required style={inputStyle}>
                  <option value="" disabled>Odamni tanlang</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{personLabel(p)}</option>
                  ))}
                </select>
              )}
            </>
          )}

          {state?.error && (
            <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
              {state.error}
            </div>
          )}

          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Saqlanmoqda..." : "Qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Edit Person modal ---------------- */

function EditPersonModal({ familySlug, person, editPersonAction, onClose }) {
  const [state, formAction, pending] = useActionState(editPersonAction, undefined);
  // `person` bu yerda daraxt uchun formatlangan obyekt (name/years), shuning
  // uchun asl ism/familiya/sana qiymatlarini uning `name`/`years`idan emas,
  // balki alohida saqlangan xom maydonlaridan olamiz (agar mavjud bo'lsa).
  const raw = person.raw || {};

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fm-panel-enter"
        style={{ width: "100%", maxWidth: 440, maxHeight: "88vh", overflow: "auto", background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Ma'lumotlarni tahrirlash</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input type="hidden" name="personId" value={person.id} />

          <div style={{ display: "flex", gap: 10 }}>
            <input name="firstName" placeholder="Ism" defaultValue={raw.first_name || ""} required className="fm-modal-input" style={inputStyle} />
            <input name="lastName" placeholder="Familiya" defaultValue={raw.last_name || ""} className="fm-modal-input" style={inputStyle} />
          </div>

          <select name="gender" defaultValue={raw.gender || ""} style={inputStyle}>
            <option value="">Jinsi (ixtiyoriy)</option>
            <option value="female">Ayol</option>
            <option value="male">Erkak</option>
            <option value="other">Boshqa</option>
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <input name="birthDate" placeholder="Tug'ilgan yil" defaultValue={raw.birth_date || ""} style={inputStyle} />
            <input name="deathDate" placeholder="Vafot yili (agar bo'lsa)" defaultValue={raw.death_date || ""} style={inputStyle} />
          </div>

          <textarea name="biography" placeholder="Qisqacha hikoya yoki biografiya" defaultValue={raw.biography || ""} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />

          {state?.error && (
            <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
              {state.error}
            </div>
          )}

          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 8,
  border: `1px solid ${TOKENS.parchmentDeep}`,
  background: "#fff",
  fontSize: 13.5,
  color: TOKENS.ink,
  outline: "none",
  fontFamily: "Inter, sans-serif",
};

/* ---------------- Link two existing people ---------------- */

function LinkPersonModal({ familySlug, person, people, linkPersonAction, onClose }) {
  const [state, formAction, pending] = useActionState(linkPersonAction, undefined);
  const otherPeople = people.filter((p) => p.id !== person.id);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fm-panel-enter"
        style={{ width: "100%", maxWidth: 420, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 500, margin: 0 }}>Bog'lash</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12.5, color: TOKENS.ink60, margin: "0 0 18px" }}>
          <strong>{person.name}</strong>ni boshqa mavjud odamga bog'lang.
        </p>

        {otherPeople.length === 0 ? (
          <div style={{ fontSize: 12.5, color: TOKENS.ink40 }}>Bog'lash uchun boshqa odam yo'q. Avval yana birortasini qo'shing.</div>
        ) : (
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="hidden" name="familySlug" value={familySlug} />
            <input type="hidden" name="personId" value={person.id} />

            <select name="otherPersonId" defaultValue="" required style={inputStyle}>
              <option value="" disabled>Odamni tanlang</option>
              {otherPeople.map((p) => (
                <option key={p.id} value={p.id}>{personLabel(p)}</option>
              ))}
            </select>

            <select name="relationType" defaultValue="" required style={inputStyle}>
              <option value="" disabled>Bog'lanish turi</option>
              <option value="other_is_parent">Tanlangan odam — {person.name}ning ota-onasi</option>
              <option value="other_is_child">Tanlangan odam — {person.name}ning farzandi</option>
              <option value="spouse">Tanlangan odam — {person.name}ning turmush o'rtog'i</option>
            </select>

            {state?.error && (
              <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
                {state.error}
              </div>
            )}

            <button type="submit" disabled={pending} style={{ marginTop: 4, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
              {pending ? "Bog'lanmoqda..." : "Bog'lash"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Albums view ---------------- */

const ALBUMS = [
  { id: 1, title: "2026 — Parij", sub: "May 2026 · 86 rasm · 12 sahifa", seed: "paris-fam" },
  { id: 2, title: "Yozgi ta'til", sub: "2025 · 142 rasm · 18 sahifa", seed: "summer-fam" },
  { id: 3, title: "Universitet", sub: "2019–2023 · 58 rasm · 9 sahifa", seed: "uni-fam" },
  { id: 4, title: "Bolalik", sub: "1998–2005 · 210 rasm · 24 sahifa", seed: "childhood-fam" },
  { id: 5, title: "To'y", sub: "2023 · 96 rasm · 14 sahifa", seed: "wedding-fam" },
  { id: 6, title: "Do'stlar", sub: "2024 · 40 rasm · 6 sahifa", seed: "friends-fam" },
];

const LAYOUTS = [
  { id: "l1", name: "Bitta katta", slots: [{ type: "photo", x: 8, y: 8, w: 84, h: 60, seed: "a" }, { type: "text", x: 8, y: 72, w: 84, h: 20 }] },
  { id: "l2", name: "Ikkita yonma-yon", slots: [{ type: "photo", x: 6, y: 8, w: 41, h: 70, seed: "b" }, { type: "photo", x: 53, y: 8, w: 41, h: 70, seed: "c" }, { type: "text", x: 6, y: 82, w: 88, h: 12 }] },
  { id: "l3", name: "Katta + ikkita kichik", slots: [{ type: "photo", x: 6, y: 6, w: 60, h: 50, seed: "d" }, { type: "photo", x: 68, y: 6, w: 26, h: 24, seed: "e" }, { type: "photo", x: 68, y: 32, w: 26, h: 24, seed: "f" }, { type: "text", x: 6, y: 60, w: 88, h: 32 }] },
  { id: "l4", name: "Uchtasi qatorda", slots: [{ type: "photo", x: 5, y: 10, w: 28, h: 55, seed: "g" }, { type: "photo", x: 36, y: 10, w: 28, h: 55, seed: "h" }, { type: "photo", x: 67, y: 10, w: 28, h: 55, seed: "i" }, { type: "text", x: 5, y: 70, w: 90, h: 22 }] },
];

const INITIAL_PAGES = [
  { id: 1, layoutId: "l1", texts: { t0: "Eiffel minorasi ostida — birinchi kunimiz." }, dateLabel: "12 May 2026", location: "Parij, Fransiya" },
  { id: 2, layoutId: "l2", texts: { t0: "Sena bo'ylab sayr qilib, kechqurun mahalliy kafeda ovqatlandik." }, dateLabel: "13 May 2026", location: "Parij, Fransiya" },
  { id: 3, layoutId: "l3", texts: { t0: "Lувр muzeyi — Mona Liza oldida navbatda kutdik, lekin arziydi." }, dateLabel: "14 May 2026", location: "Parij, Fransiya" },
];

function ChipButton({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 20, border: active ? "none" : `1px solid ${TOKENS.parchmentDeep}`, background: active ? TOKENS.ink : "transparent", color: active ? TOKENS.parchment : TOKENS.ink60, cursor: "pointer", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

function AlbumGrid({ onOpen }) {
  return (
    <div style={{ padding: "36px 48px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Arxiv</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>Mening albomlarim</h1>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Yangi albom
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
        {ALBUMS.map((a) => (
          <div key={a.id} onClick={() => onOpen(a)} className="fm-album-card" style={{ background: TOKENS.card, borderRadius: 12, padding: 14, border: `1px solid ${TOKENS.parchmentDeep}` }}>
            <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 7, backgroundImage: `url(https://picsum.photos/seed/${a.seed}/420/320)`, backgroundSize: "cover", backgroundPosition: "center", marginBottom: 13 }} />
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 16.5, fontWeight: 500 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: TOKENS.ink60, marginTop: 3 }}>{a.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageCanvas({ page, layout }) {
  let textIndex = 0;
  return (
    <div style={{ width: "100%", aspectRatio: "4/3", background: "#FFFFFF", borderRadius: 4, position: "relative", boxShadow: "0 12px 34px rgba(30,38,33,0.16), 0 2px 6px rgba(30,38,33,0.08)" }}>
      {layout.slots.map((slot, i) => {
        if (slot.type === "photo") {
          return <div key={i} style={{ position: "absolute", left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%`, backgroundImage: `url(https://picsum.photos/seed/${page.id}-${slot.seed}/500/400)`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: 3, boxShadow: "0 3px 10px rgba(0,0,0,0.12)" }} />;
        }
        const key = `t${textIndex++}`;
        return <div key={i} style={{ position: "absolute", left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%`, fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 13.5, lineHeight: 1.5, color: TOKENS.ink, overflow: "hidden" }}>{page.texts[key]}</div>;
      })}
      <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, color: TOKENS.ink40, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} /> {page.dateLabel}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPinned size={10} /> {page.location}</span>
      </div>
    </div>
  );
}

function AlbumEditor({ album, onBack }) {
  const [pages, setPages] = useState(INITIAL_PAGES);
  const [pageIndex, setPageIndex] = useState(0);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const currentPage = pages[pageIndex];
  const currentLayout = LAYOUTS.find((l) => l.id === currentPage.layoutId);

  const addPage = () => {
    const newPage = { id: pages.length + 1, layoutId: "l1", texts: { t0: "" }, dateLabel: "Sana qo'shilmagan", location: "Joy qo'shilmagan" };
    setPages([...pages, newPage]);
    setPageIndex(pages.length);
  };
  const applyLayout = (layoutId) => {
    const updated = [...pages];
    updated[pageIndex] = { ...updated[pageIndex], layoutId };
    setPages(updated);
    setShowLayoutPicker(false);
  };

  return (
    <div style={{ padding: "26px 40px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TOKENS.ink60, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <ChevronLeft size={16} /> Albomlarga qaytish
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.ink, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Ulashish</button>
          <button style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.parchment, background: TOKENS.ink, border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>Saqlash</button>
        </div>
      </div>
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 27, fontWeight: 500, margin: 0 }}>{album.title}</h1>
        <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 4 }}>{album.sub}</div>
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <ChipButton active={showLayoutPicker} onClick={() => setShowLayoutPicker(!showLayoutPicker)}><span style={{ display: "flex", alignItems: "center", gap: 5 }}><LayoutGrid size={13} /> Layout</span></ChipButton>
            <ChipButton><span style={{ display: "flex", alignItems: "center", gap: 5 }}><Type size={13} /> Matn</span></ChipButton>
            <ChipButton><span style={{ display: "flex", alignItems: "center", gap: 5 }}><Sticker size={13} /> Stiker</span></ChipButton>
          </div>
          {showLayoutPicker && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18, background: TOKENS.card, padding: 14, borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}` }}>
              {LAYOUTS.map((l) => (
                <div key={l.id} onClick={() => applyLayout(l.id)} style={{ cursor: "pointer", border: currentLayout.id === l.id ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: 8, background: "#fff" }}>
                  <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: TOKENS.parchment, borderRadius: 3, marginBottom: 6 }}>
                    {l.slots.map((s, i) => <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`, background: s.type === "photo" ? TOKENS.goldSoft : TOKENS.tealSoft, borderRadius: 2, opacity: 0.7 }} />)}
                  </div>
                  <div style={{ fontSize: 10, color: TOKENS.ink60, textAlign: "center" }}>{l.name}</div>
                </div>
              ))}
            </div>
          )}
          <PageCanvas page={currentPage} layout={currentLayout} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20 }}>
            <button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0} style={{ background: "none", border: "none", cursor: pageIndex === 0 ? "default" : "pointer", color: pageIndex === 0 ? TOKENS.ink40 : TOKENS.ink, opacity: pageIndex === 0 ? 0.4 : 1 }}><ChevronLeft size={20} /></button>
            <span style={{ fontSize: 12.5, color: TOKENS.ink60, fontWeight: 500 }}>Sahifa {pageIndex + 1} / {pages.length}</span>
            <button onClick={() => setPageIndex(Math.min(pages.length - 1, pageIndex + 1))} disabled={pageIndex === pages.length - 1} style={{ background: "none", border: "none", cursor: pageIndex === pages.length - 1 ? "default" : "pointer", color: pageIndex === pages.length - 1 ? TOKENS.ink40 : TOKENS.ink, opacity: pageIndex === pages.length - 1 ? 0.4 : 1 }}><ChevronRight size={20} /></button>
          </div>
        </div>
        <div style={{ width: 128, flexShrink: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", color: TOKENS.ink40, textTransform: "uppercase", marginBottom: 12 }}>Sahifalar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 480, overflowY: "auto" }}>
            {pages.map((p, i) => (
              <div key={p.id} onClick={() => setPageIndex(i)} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 4, background: "#fff", border: i === pageIndex ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, cursor: "pointer", position: "relative", overflow: "hidden" }}>
                {LAYOUTS.find((l) => l.id === p.layoutId).slots.filter((s) => s.type === "photo").slice(0, 1).map((s, si) => (
                  <div key={si} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`, backgroundImage: `url(https://picsum.photos/seed/${p.id}-${s.seed}/120/100)`, backgroundSize: "cover", borderRadius: 2 }} />
                ))}
              </div>
            ))}
            <button onClick={addPage} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 4, border: `1.5px dashed ${TOKENS.parchmentDeep}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.ink40, cursor: "pointer" }}><Plus size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlbumsView({ openAlbum, setOpenAlbum }) {
  return (
    <div className="fm-fade" style={{ height: "100%", overflow: "auto" }}>
      {openAlbum ? <AlbumEditor album={openAlbum} onBack={() => setOpenAlbum(null)} /> : <AlbumGrid onOpen={setOpenAlbum} />}
    </div>
  );
}

/* ---------------- Root app ---------------- */

/**
 * @param {{
 *   userName?: string,
 *   familyName?: string,
 *   familySlug?: string,
 *   people?: any[],
 *   relationships?: any[],
 *   canEdit?: boolean,
 *   mePersonId?: string | null,
 *   initialView?: string,
 *   onLogout?: any,
 *   addPersonAction?: any,
 *   linkPersonAction?: any,
 *   editPersonAction?: any,
 *   deletePersonAction?: any,
 *   uploadPersonPhotoAction?: any,
 * }} props
 */
export default function HeirloomApp({
  userName = "Foydalanuvchi",
  familyName = "Mening oilam",
  familySlug = "",
  people = /** @type {any[]} */ ([]),
  relationships = /** @type {any[]} */ ([]),
  canEdit = true,
  mePersonId = null,
  initialView = "dashboard",
  onLogout,
  addPersonAction,
  linkPersonAction,
  editPersonAction,
  deletePersonAction,
  uploadPersonPhotoAction,
}) {
  const [view, setView] = useState(initialView === "tree" ? VIEWS.TREE : initialView === "albums" ? VIEWS.ALBUMS : VIEWS.DASHBOARD);
  const [openAlbum, setOpenAlbum] = useState(null);

  const navigate = (target) => {
    if (target === VIEWS.ALBUMS) setOpenAlbum(null);
    setView(target);
  };

  const openAlbumFromDashboard = (album) => {
    setOpenAlbum(album.title ? { ...album, sub: album.sub } : album);
    setView(VIEWS.ALBUMS);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: TOKENS.parchment, height: "100%", color: TOKENS.ink }}>
      <GlobalStyle />
      <div style={{ display: "flex", height: "100%" }}>
        <Sidebar current={view} onNavigate={navigate} onLogout={onLogout} />
        <main style={{ flex: 1, overflow: "auto" }}>
          {view === VIEWS.DASHBOARD && (
            <DashboardView onNavigate={navigate} onOpenAlbum={openAlbumFromDashboard} userName={userName} familyName={familyName} peopleCount={people.length} />
          )}
          {view === VIEWS.TREE && (
            <FamilyTreeView
              familyName={familyName}
              familySlug={familySlug}
              people={people}
              relationships={relationships}
              canEdit={canEdit}
              mePersonId={mePersonId}
              addPersonAction={addPersonAction}
              linkPersonAction={linkPersonAction}
              editPersonAction={editPersonAction}
              deletePersonAction={deletePersonAction}
              uploadPersonPhotoAction={uploadPersonPhotoAction}
            />
          )}
          {view === VIEWS.ALBUMS && <AlbumsView openAlbum={openAlbum} setOpenAlbum={setOpenAlbum} />}
        </main>
      </div>
    </div>
  );
}
