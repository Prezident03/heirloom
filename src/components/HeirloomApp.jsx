"use client";

import React, { useState, useRef, useMemo, useEffect, useLayoutEffect, useCallback, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Home, BookImage, TreePine, Search, Plus, X,
  ChevronRight, ChevronLeft, ChevronDown, Calendar, MapPinned, LayoutGrid, Settings, LogOut, Camera, UserPlus, Users,
  ImagePlus, History, CalendarPlus, Link2, Trash2,
} from "lucide-react";
import { TOKENS, FONT_IMPORT } from "@/lib/uiTokens";
import { relationLabelBetween } from "@/lib/relationshipLabels";

const VIEWS = {
  DASHBOARD: "dashboard",
  ALBUMS: "albums",
  TREE: "tree",
  PEOPLE: "people",
  TIMELINE: "timeline",
  SETTINGS: "settings",
};

// Faqat haqiqatan ishlaydigan bo'limlar sidebar'da ko'rsatiladi. Memories,
// Places kabi hali qurilmagan bo'limlar "tez orada" degan yozuv bilan
// chalg'itish o'rniga, tayyor bo'lgandagina shu ro'yxatga qo'shiladi.
const NAV_CONFIG = [
  { id: VIEWS.DASHBOARD, icon: Home, label: "Bosh sahifa" },
  { id: VIEWS.ALBUMS, icon: BookImage, label: "Albomlar" },
  { id: VIEWS.TREE, icon: TreePine, label: "Oila daraxti" },
  { id: VIEWS.PEOPLE, icon: Users, label: "Odamlar" },
  { id: VIEWS.TIMELINE, icon: History, label: "Vaqt chizig'i" },
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
      .fm-relation-option { transition: background 0.15s ease, border-color 0.15s ease; }
      .fm-relation-option:hover { background: ${TOKENS.parchment}; border-color: ${TOKENS.gold}; }
      .fm-person-grid-card { transition: opacity 0.15s ease; }
      .fm-person-grid-card:hover { opacity: 0.8; }
      .fm-person { display: flex; align-items: center; gap: 10px; background: ${TOKENS.card}; border-radius: 30px; padding: 5px 16px 5px 5px; cursor: pointer; box-shadow: 0 2px 6px rgba(30,38,33,0.07); transition: transform 0.18s ease, box-shadow 0.18s ease; max-width: 210px; }
      .fm-person.fm-person-highlight { animation: fm-highlight-pulse 1.4s ease-out 1; }
      @keyframes fm-highlight-pulse {
        0% { box-shadow: 0 0 0 0 rgba(184,134,59,0.55); }
        70% { box-shadow: 0 0 0 12px rgba(184,134,59,0); }
        100% { box-shadow: 0 2px 6px rgba(30,38,33,0.07); }
      }
      .fm-tree-viewport {
        background-image: radial-gradient(circle, ${TOKENS.parchmentDeep} 1px, transparent 1px);
        background-size: 22px 22px;
        cursor: grab;
      }
      .fm-tree-viewport.dragging { cursor: grabbing; }
      .fm-tree-zoom-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: ${TOKENS.card}; border: 1px solid ${TOKENS.parchmentDeep}; border-radius: 7px; cursor: pointer; color: ${TOKENS.ink}; font-size: 14px; font-weight: 600; user-select: none; }
      .fm-tree-zoom-btn:hover { background: ${TOKENS.parchment}; }
      .fm-tree-toolbar-btn { display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; background: ${TOKENS.card}; border: 1px solid ${TOKENS.parchmentDeep}; border-radius: 8px; cursor: pointer; color: ${TOKENS.ink}; font-size: 12.5px; font-weight: 600; }
      .fm-tree-toolbar-btn:hover { background: ${TOKENS.parchment}; }
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

      /* ---- Mobile: app-like bottom nav + top bar (360px'dan boshlab) ---- */
      .fm-mobile-topbar {
        display: none;
        align-items: center; justify-content: space-between;
        padding: 12px 16px;
        background: ${TOKENS.card};
        border-bottom: 1px solid ${TOKENS.parchmentDeep};
        position: sticky; top: 0; z-index: 20;
      }
      .fm-mobile-bottomnav {
        display: none;
        position: fixed; left: 0; right: 0; bottom: 0;
        background: ${TOKENS.ink};
        padding: 7px 4px calc(6px + env(safe-area-inset-bottom));
        z-index: 30;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 -6px 20px rgba(0,0,0,0.18);
      }
      .fm-mobile-nav-item {
        display: flex; flex-direction: column; align-items: center; gap: 3px;
        background: none; border: none; color: rgba(242,237,226,0.55);
        font-size: 9.5px; font-weight: 600; cursor: pointer; padding: 5px 12px;
      }
      .fm-mobile-nav-item.active { color: ${TOKENS.goldSoft}; }
      @media (max-width: 768px) {
        .fm-desktop-sidebar { display: none !important; }
        .fm-mobile-topbar { display: flex; }
        .fm-mobile-bottomnav { display: flex; }
        .fm-main { padding-bottom: 76px; }
      }
    `}</style>
  );
}

function Sidebar({ current, onNavigate, onLogout }) {
  return (
    <aside className="fm-desktop-sidebar" style={{ width: 220, background: TOKENS.ink, padding: "26px 14px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px 28px" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})` }} />
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: TOKENS.parchment, fontWeight: 600 }}>Heirloom</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_CONFIG.map((item) => (
          <div
            key={item.id}
            className={`fm-nav-item ${current === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={16} strokeWidth={2} />
            {item.label}
          </div>
        ))}
      </nav>
      <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(242,237,226,0.1)" }}>
        <div
          className={`fm-nav-item ${current === VIEWS.SETTINGS ? "active" : ""}`}
          onClick={() => onNavigate(VIEWS.SETTINGS)}
        >
          <Settings size={16} /> Sozlamalar
        </div>
        <div className="fm-nav-item" onClick={onLogout}>
          <LogOut size={16} /> Chiqish
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Mobile top bar + bottom nav ---------------- */

function MobileTopBar({ familyName, onLogout }) {
  return (
    <div className="fm-mobile-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})`, flexShrink: 0 }} />
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 600, color: TOKENS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{familyName}</span>
      </div>
      <button onClick={onLogout} title="Chiqish" style={{ background: "none", border: "none", color: TOKENS.ink60, cursor: "pointer", padding: 6, flexShrink: 0 }}>
        <LogOut size={17} />
      </button>
    </div>
  );
}

const MOBILE_NAV_ITEMS = [
  { id: VIEWS.DASHBOARD, icon: Home, label: "Bosh sahifa" },
  { id: VIEWS.ALBUMS, icon: BookImage, label: "Albomlar" },
  { id: VIEWS.TREE, icon: TreePine, label: "Oila" },
  { id: VIEWS.PEOPLE, icon: Users, label: "Odamlar" },
  { id: VIEWS.TIMELINE, icon: History, label: "Tarix" },
];

function MobileBottomNav({ current, onNavigate }) {
  return (
    <nav className="fm-mobile-bottomnav">
      {MOBILE_NAV_ITEMS.map((it) => (
        <button key={it.id} onClick={() => onNavigate(it.id)} className={`fm-mobile-nav-item ${current === it.id ? "active" : ""}`}>
          <it.icon size={20} strokeWidth={current === it.id ? 2.3 : 1.8} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ---------------- Dashboard view ---------------- */

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

/**
 * Universal "+ Yangi" tugmasi. Faqat haqiqatan mavjud bo'lgan yaratish
 * amallarini ko'rsatadi (hozircha: odam qo'shish, albom yaratish, rasmlar
 * yuklash, voqea qo'shish). Hali qurilmagan feature (hikoya, xotira)
 * qo'shilganda shu ro'yxatga qo'shiladi — hali yo'q narsani va'da qilib
 * chalg'itmaymiz.
 */
function CreateMenu({ onCreateAlbum, onAddPerson, onUploadPhotos, onAddEvent }) {
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

function StatItem({ value, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 600, color: TOKENS.parchment }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "rgba(242,237,226,0.62)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{label}</div>
    </div>
  );
}

/** Family Space'ning "shaxsiyati" — daraxt statistikasi asosida, hech qanday demo son yo'q. */
function FamilyIdentityBar({ familyName, familySince, genCount, memberCount, albumCount, photoCount, onNavigate }) {
  return (
    <div
      onClick={() => onNavigate(VIEWS.TREE)}
      style={{
        cursor: "pointer", background: `linear-gradient(120deg, ${TOKENS.ink} 0%, ${TOKENS.teal} 130%)`,
        borderRadius: 16, padding: "24px 30px", display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 24, flexWrap: "wrap", marginBottom: 40,
      }}
    >
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", color: TOKENS.goldSoft, fontWeight: 700, textTransform: "uppercase" }}>
          {familyName}{familySince ? ` · ${familySince} yildan beri` : ""}
        </div>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: TOKENS.parchment, marginTop: 4 }}>
          Oilangizning raqamli uyi
        </div>
      </div>
      <div style={{ display: "flex", gap: 30 }}>
        <StatItem value={genCount} label="avlod" />
        <StatItem value={memberCount} label="a'zo" />
        <StatItem value={albumCount} label="albom" />
        <StatItem value={photoCount} label="rasm" />
      </div>
    </div>
  );
}

/** Family Space mutlaqo bo'sh bo'lganda (hali odam ham, albom ham yo'q) ko'rinadigan katta welcome ekrani. */
function DashboardWelcome({ familyName, onAddPerson, onCreateAlbum }) {
  return (
    <div className="fm-fade" style={{ maxWidth: 560, margin: "60px auto 0", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})`, margin: "0 auto 22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TreePine size={26} color="#fff" />
      </div>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 500, margin: "0 0 10px" }}>{familyName}ga xush kelibsiz</h1>
      <p style={{ fontSize: 14, color: TOKENS.ink60, lineHeight: 1.7, margin: "0 0 30px" }}>
        Bu — sizning oilangiz uchun bo'sh sahifa. Tayyor namuna yo'q, chunki hikoya faqat sizga tegishli. Odatda avval o'zingizni qo'shasiz, keyin oila a'zolaringizni va birinchi albomingizni yaratasiz.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={onAddPerson} style={{ display: "flex", alignItems: "center", gap: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <UserPlus size={15} /> O'zingizni qo'shing
        </button>
        <button onClick={onCreateAlbum} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", color: TOKENS.ink, border: `1.5px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, padding: "12px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          <BookImage size={15} /> Albom yarating
        </button>
      </div>
    </div>
  );
}

function DashboardView({ onNavigate, onOpenAlbum, onAddPerson, onCreateAlbum, onUploadPhotos, onAddEvent, userName, familyName, familySince, people, relationships, albums, timelineEvents }) {
  const [query, setQuery] = useState("");
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return "Xayrli tong";
    if (h < 18) return "Xayrli kun";
    return "Xayrli kech";
  });

  const genCount = useMemo(() => buildFamilyGenerations(people, relationships).length, [people, relationships]);
  const photoCount = useMemo(
    () => albums.reduce((sum, a) => sum + a.pages.reduce((s, p) => s + p.elements.filter((e) => e.type === "photo" && e.photo_url).length, 0), 0),
    [albums]
  );
  const isEmpty = people.length === 0 && albums.length === 0 && timelineEvents.length === 0;

  return (
    <div className="fm-fade" style={{ padding: "32px clamp(16px, 5vw, 48px) 64px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, fontWeight: 500, margin: "0 0 6px", letterSpacing: "-0.01em" }}>{greeting}, {userName} 👋</h1>
          <p style={{ fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 15.5, color: TOKENS.ink60, margin: 0 }}>"Har bir oila o'z hikoyasiga ega."</p>
        </div>
        <div style={{ display: "flex", gap: 12, flex: "1 1 320px", maxWidth: 520 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, padding: "0 16px", height: 44 }}>
            <Search size={16} color={TOKENS.ink40} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Odamlar, albomlar qidirish..." style={{ border: "none", outline: "none", background: "transparent", fontSize: 14, width: "100%", color: TOKENS.ink, fontFamily: "Inter, sans-serif" }} />
          </div>
          {(onCreateAlbum || onAddPerson || onUploadPhotos || onAddEvent) && <CreateMenu onCreateAlbum={onCreateAlbum} onAddPerson={onAddPerson} onUploadPhotos={onUploadPhotos} onAddEvent={onAddEvent} />}
        </div>
      </div>

      {isEmpty ? (
        onAddPerson || onCreateAlbum ? (
          <DashboardWelcome familyName={familyName} onAddPerson={onAddPerson} onCreateAlbum={onCreateAlbum} />
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: TOKENS.ink60, fontSize: 13.5 }}>
            Bu oila hali bo'sh.
          </div>
        )
      ) : (
        <>
          <FamilyIdentityBar
            familyName={familyName}
            familySince={familySince}
            genCount={genCount}
            memberCount={people.length}
            albumCount={albums.length}
            photoCount={photoCount}
            onNavigate={onNavigate}
          />

          <section style={{ marginBottom: 48 }}>
            <SectionLabel eyebrow="Arxiv" title="So'nggi albomlar" action="Barchasi" onAction={() => onNavigate(VIEWS.ALBUMS)} />
            {albums.length === 0 ? (
              <div
                onClick={onCreateAlbum}
                style={{ cursor: "pointer", textAlign: "center", padding: "34px 20px", border: `1.5px dashed ${TOKENS.parchmentDeep}`, borderRadius: 12, color: TOKENS.ink60, fontSize: 13 }}
              >
                Hali albom yo'q — birinchisini yaratish uchun bosing
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
                {albums.slice(0, 4).map((a) => (
                  <AlbumCard key={a.id} album={a} onClick={() => onOpenAlbum(a)} compact />
                ))}
              </div>
            )}
          </section>

          <section style={{ marginBottom: 48 }}>
            <SectionLabel eyebrow="Xotira" title="So'nggi voqealar" action="Barchasi" onAction={() => onNavigate(VIEWS.TIMELINE)} />
            {timelineEvents.length === 0 ? (
              <div
                onClick={onAddEvent}
                style={{ cursor: "pointer", textAlign: "center", padding: "34px 20px", border: `1.5px dashed ${TOKENS.parchmentDeep}`, borderRadius: 12, color: TOKENS.ink60, fontSize: 13 }}
              >
                Hali voqea yo'q — birinchisini qo'shish uchun bosing
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {timelineEvents.slice(-3).reverse().map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onNavigate(VIEWS.TIMELINE)}
                    className="fm-album-card"
                    style={{ display: "flex", alignItems: "center", gap: 14, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 12, padding: "12px 16px" }}
                  >
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                        background: ev.photo_url ? undefined : TOKENS.parchment,
                        backgroundImage: ev.photo_url ? `url(${ev.photo_url})` : undefined,
                        backgroundSize: "cover", backgroundPosition: "center",
                        display: ev.photo_url ? undefined : "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {!ev.photo_url && <History size={16} color={TOKENS.goldSoft} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: TOKENS.gold }}>{ev.event_date || "Sana ko'rsatilmagan"}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionLabel eyebrow="Avlodlar" title="Oila daraxti" action="Ochish" onAction={() => onNavigate(VIEWS.TREE)} />
            <div onClick={() => onNavigate(VIEWS.TREE)} style={{ cursor: "pointer", background: `linear-gradient(135deg, ${TOKENS.teal}, ${TOKENS.ink})`, borderRadius: 14, padding: "30px 34px", display: "flex", alignItems: "center", justifyContent: "space-between", color: TOKENS.parchment }}>
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginBottom: 6 }}>{familyName}</div>
                <div style={{ fontSize: 12.5, color: "rgba(242,237,226,0.7)" }}>{genCount} avlod · {people.length} a'zo</div>
              </div>
              <TreePine size={34} color={TOKENS.goldSoft} strokeWidth={1.3} />
            </div>
          </section>
        </>
      )}
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

function PersonNode({ person, onSelect, nodeRef, isMe, highlighted }) {
  return (
    <div ref={nodeRef} data-tree-node="1" onClick={() => onSelect(person)} className={`fm-person ${highlighted ? "fm-person-highlight" : ""}`} style={{ border: isMe ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}` }}>
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

/**
 * O'ng tomondagi odam profili paneli — Family Tree va People (Odamlar)
 * ko'rinishlarida bir xil ishlatiladi, shuning uchun alohida komponent.
 */
function PersonDetailPanel({
  selected,
  mePersonId,
  relationToMe,
  canEdit,
  familySlug,
  uploadPersonPhotoAction,
  photoError,
  setPhotoError,
  onClose,
  onEdit,
  onLink,
  confirmDelete,
  setConfirmDelete,
  deletePersonAction,
}) {
  const [activeTab, setActiveTab] = useState("about");

  const tabs = [
    { id: "about", label: "Ma'lumot" },
    { id: "timeline", label: "Vaqt chizig'i" },
    { id: "photos", label: "Rasmlar" },
  ];

  return (
    <div className="fm-panel-enter" style={{ width: "min(320px, 100%)", flex: "1 1 320px", flexShrink: 0, background: TOKENS.card, borderLeft: `1px solid ${TOKENS.parchmentDeep}`, padding: "24px 22px", overflow: "auto", maxHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 4 }}><X size={18} /></button>
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
            onError={setPhotoError}
          />
        )}
      </div>

      {photoError && (
        <div style={{ fontSize: 11, color: TOKENS.danger, textAlign: "center", marginBottom: 10, padding: "6px 10px", background: "rgba(168,69,58,0.08)", borderRadius: 6 }}>
          {photoError}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500 }}>{selected.name}</div>
        {selected.years && <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Calendar size={12} /> {selected.years}</div>}
        {selected.id === mePersonId ? (
          <div style={{ fontSize: 11, fontWeight: 600, color: TOKENS.gold, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bu — sizsiz</div>
        ) : relationToMe ? (
          <div style={{ fontSize: 11.5, color: TOKENS.teal, marginTop: 6, fontWeight: 600 }}>Sizga: {relationToMe}</div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, marginTop: 12, borderBottom: `1px solid ${TOKENS.parchmentDeep}` }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "8px 12px",
              borderRadius: "8px 8px 0 0",
              background: activeTab === tab.id ? TOKENS.ink : "transparent",
              color: activeTab === tab.id ? TOKENS.parchment : TOKENS.ink60,
              border: "none",
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "none" : `2px solid transparent`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "about" && (
        <div>
          <div style={{ fontSize: 12.5, color: TOKENS.ink60, lineHeight: 1.6, marginBottom: 14 }}>
            {selected.biography || "Bu odam haqida hali biografiya qo'shilmagan."}
          </div>
          {selected.raw?.birth_place && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: TOKENS.ink60, marginBottom: 8 }}>
              <MapPinned size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>Tug'ilgan joy: {selected.raw.birth_place}</div>
            </div>
          )}
          {selected.raw?.gender && (
            <div style={{ fontSize: 12, color: TOKENS.ink60 }}>
              Jinsi: {selected.raw.gender === "male" ? "Erkak" : selected.raw.gender === "female" ? "Ayol" : "Boshqa"}
            </div>
          )}
        </div>
      )}

      {activeTab === "timeline" && (
        <div style={{ fontSize: 12.5, color: TOKENS.ink60 }}>
          Bu odam bilan bog'langan voqealar hali ko'rsatilmadi. Keyingi update'da bo'ladi.
        </div>
      )}

      {activeTab === "photos" && (
        <div style={{ fontSize: 12.5, color: TOKENS.ink60 }}>
          Bu odam bilan bog'langan rasmlar hali ko'rsatilmadi. Keyingi update'da bo'ladi.
        </div>
      )}

      {canEdit && (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={onEdit} style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              Tahrirlash
            </button>
            <button onClick={onLink} style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              Bog'lash
            </button>
          </div>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ marginTop: 10, width: "100%", background: "transparent", color: TOKENS.danger, border: `1px solid ${TOKENS.danger}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              O'chirish
            </button>
          ) : (
            <DeletePersonConfirm
              familySlug={familySlug}
              personId={selected.id}
              deletePersonAction={deletePersonAction}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </>
      )}
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
  const [photoError, setPhotoError] = useState(null);
  const containerRef = useRef(null);
  const unitRefs = useRef({});
  const personRefs = useRef({});

  // --- Zoom / pan (Family Tree Canvas) ---
  const viewportRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef(null);
  const touchState = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const clampZoom = (z) => Math.min(2, Math.max(0.4, z));

  const zoomBy = useCallback((factor) => {
    setZoom((z) => clampZoom(Math.round(z * factor * 100) / 100));
  }, []);

  const resetView = useCallback(() => {
    if (mePersonId && personRefs.current[mePersonId]) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      centerOnPerson(mePersonId, 1);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mePersonId]);

  // Sichqoncha g'ildiragi bilan zoom qilish, kursor ostidagi nuqta joyida qoladi.
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setZoom((z) => {
      const newZoom = clampZoom(z * (e.deltaY > 0 ? 0.9 : 1.1));
      setPan((p) => ({
        x: cx - (newZoom / z) * (cx - p.x),
        y: cy - (newZoom / z) * (cy - p.y),
      }));
      return newZoom;
    });
  }, []);

  const onPointerDown = useCallback((e) => {
    // Odam kartochkasi bosilganda pan boshlanmasin.
    if (e.target.closest && e.target.closest("[data-tree-node]")) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    setIsDragging(true);
  }, [pan]);

  const onPointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy });
  }, []);

  const endDrag = useCallback(() => {
    dragState.current = null;
    setIsDragging(false);
  }, []);

  // --- Mobil: bitta barmoq bilan pan, ikki barmoq bilan pinch-zoom ---
  const touchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const touchMid = (touches, rect) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
    y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
  });

  const onTouchStart = useCallback((e) => {
    // Odam kartochkasi bosilganda pan/zoom boshlanmasin — tap odatdagidek ishlasin.
    if (e.target.closest && e.target.closest("[data-tree-node]")) return;
    const touches = e.touches;
    if (touches.length === 1) {
      touchState.current = { mode: "pan", startX: touches[0].clientX, startY: touches[0].clientY, panX: pan.x, panY: pan.y };
      setIsDragging(true);
    } else if (touches.length === 2) {
      const rect = viewportRef.current?.getBoundingClientRect();
      touchState.current = {
        mode: "pinch",
        startDist: touchDist(touches),
        startZoom: zoom,
        mid: rect ? touchMid(touches, rect) : { x: 0, y: 0 },
        panX: pan.x,
        panY: pan.y,
      };
    }
  }, [pan, zoom]);

  const onTouchMove = useCallback((e) => {
    if (!touchState.current) return;
    e.preventDefault();
    const touches = e.touches;
    const state = touchState.current;
    if (state.mode === "pan" && touches.length === 1) {
      const dx = touches[0].clientX - state.startX;
      const dy = touches[0].clientY - state.startY;
      setPan({ x: state.panX + dx, y: state.panY + dy });
    } else if (state.mode === "pinch" && touches.length === 2) {
      const newZoom = clampZoom(state.startZoom * (touchDist(touches) / state.startDist));
      setZoom(newZoom);
      setPan({
        x: state.mid.x - (newZoom / state.startZoom) * (state.mid.x - state.panX),
        y: state.mid.y - (newZoom / state.startZoom) * (state.mid.y - state.panY),
      });
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (e.touches.length === 0) {
      touchState.current = null;
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      // Ikki barmoqdan bittasi ko'tarilsa — sakrashsiz, qolgan barmoq bilan pan davom etadi.
      touchState.current = { mode: "pan", startX: e.touches[0].clientX, startY: e.touches[0].clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  const centerOnPerson = useCallback((personId, targetZoom) => {
    const node = personRefs.current[personId];
    const viewport = viewportRef.current;
    if (!node || !viewport) return;
    // Ikki karra requestAnimationFrame — zoom o'zgargan bo'lsa, layout
    // yangilanishini kutib, keyin aniq markazlashtiramiz.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nodeRect = node.getBoundingClientRect();
        const vRect = viewport.getBoundingClientRect();
        const nodeCenterX = nodeRect.left + nodeRect.width / 2 - vRect.left;
        const nodeCenterY = nodeRect.top + nodeRect.height / 2 - vRect.top;
        const dx = vRect.width / 2 - nodeCenterX;
        const dy = vRect.height / 2 - nodeCenterY;
        setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      });
    });
    setHighlightId(personId);
    setTimeout(() => setHighlightId((h) => (h === personId ? null : h)), 1500);
    if (typeof targetZoom === "number") setZoom(clampZoom(targetZoom));
  }, []);

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return people
      .map((p) => ({ id: p.id, name: personLabel(p) }))
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [people, query]);

  const goToPerson = (personId) => {
    const person = people.find((p) => p.id === personId);
    if (!person) return;
    setSelected({
      id: person.id,
      name: personLabel(person),
      years: personYears(person),
      biography: person.biography,
      photoUrl: person.profile_photo_url,
      gender: person.gender,
      raw: person,
    });
    centerOnPerson(personId, 1);
    setQuery("");
    setSearchFocused(false);
  };

  const relationToMe = useMemo(() => {
    if (!selected || !mePersonId) return null;
    return relationLabelBetween(mePersonId, selected.id, people, relationships);
  }, [selected, mePersonId, people, relationships]);

  useEffect(() => {
    setPhotoError(null);
  }, [selected?.id]);

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
        // getBoundingClientRect transform (zoom) qo'llangandan keyingi ekran
        // piksellarini qaytaradi — SVG konteyner ham xuddi shu transformga
        // ega bo'lgani uchun, path koordinatalarini "zoom"ga bo'lib,
        // transformdan oldingi (local) fazoga qaytarish kerak.
        const x1 = (pRect.left + pRect.width / 2 - cRect.left) / zoom;
        const y1 = (pRect.bottom - cRect.top) / zoom;
        const x2 = (cRect2.left + cRect2.width / 2 - cRect.left) / zoom;
        const y2 = (cRect2.top - cRect.top) / zoom;
        const ym = y1 + (y2 - y1) / 2;
        newPaths.push(`M ${x1} ${y1} L ${x1} ${ym} L ${x2} ${ym} L ${x2} ${y2}`);
      });
    });
    setPaths(newPaths);
  }, [generations, zoom]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 200);
    return () => { window.removeEventListener("resize", measure); clearTimeout(t); };
  }, [measure]);

  // Birinchi ochilganda "men" tugunini markazga keltiramiz (agar bo'lsa).
  useEffect(() => {
    if (mePersonId && personRefs.current[mePersonId]) {
      const t = setTimeout(() => centerOnPerson(mePersonId), 260);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generations.length > 0]);

  if (people.length === 0) {
    return (
      <>
        <EmptyFamilyTree familyName={familyName} canEdit={canEdit} onAddPerson={() => setShowAddModal(true)} />
        {showAddModal && (
          <AddPersonModal familySlug={familySlug} people={people} relationships={relationships} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
        )}
      </>
    );
  }

  const memberCount = people.length;
  const genCount = generations.length;

  return (
    <div className="fm-fade" style={{ display: "flex", height: "100%", flexWrap: "wrap" }}>
      <div style={{ flex: 1, padding: "24px 20px 24px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
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

        {/* Canvas boshqaruvi: zoom, markazga qaytarish, qidiruv */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button type="button" className="fm-tree-zoom-btn" onClick={() => zoomBy(0.9)} title="Kichiklashtirish">−</button>
            <div style={{ width: 46, textAlign: "center", fontSize: 12, fontWeight: 600, color: TOKENS.ink60 }}>{Math.round(zoom * 100)}%</div>
            <button type="button" className="fm-tree-zoom-btn" onClick={() => zoomBy(1.1)} title="Kattalashtirish">+</button>
          </div>
          <button type="button" className="fm-tree-toolbar-btn" onClick={resetView} title="Markazga qaytarish">
            ⛶ Markazga
          </button>
          <div style={{ position: "relative", flex: "0 1 220px", minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "0 10px", height: 32 }}>
              <Search size={13} color={TOKENS.ink40} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Odamni qidirish..."
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 12.5, width: "100%", color: TOKENS.ink, fontFamily: "Inter, sans-serif" }}
              />
            </div>
            {searchFocused && searchMatches.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, boxShadow: "0 10px 24px rgba(30,38,33,0.14)", zIndex: 10, overflow: "hidden" }}>
                {searchMatches.map((m) => (
                  <div
                    key={m.id}
                    onMouseDown={() => goToPerson(m.id)}
                    style={{ padding: "9px 12px", fontSize: 12.5, cursor: "pointer", color: TOKENS.ink }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.parchment)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {m.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          ref={viewportRef}
          className={`fm-tree-viewport ${isDragging ? "dragging" : ""}`}
          style={{ flex: 1, position: "relative", overflow: "hidden", borderRadius: 14, border: `1px solid ${TOKENS.parchmentDeep}`, minHeight: 420, touchAction: "none" }}
          onWheel={onWheel}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              padding: "40px 60px 60px",
            }}
          >
            <div ref={containerRef} style={{ position: "relative", width: 900 }}>
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
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
                            <PersonNode
                              person={person}
                              onSelect={setSelected}
                              isMe={person.id === mePersonId}
                              highlighted={person.id === highlightId}
                              nodeRef={(el) => (personRefs.current[person.id] = el)}
                            />
                          </React.Fragment>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <PersonDetailPanel
          selected={selected}
          mePersonId={mePersonId}
          relationToMe={relationToMe}
          canEdit={canEdit}
          familySlug={familySlug}
          uploadPersonPhotoAction={uploadPersonPhotoAction}
          photoError={photoError}
          setPhotoError={setPhotoError}
          onClose={() => { setSelected(null); setConfirmDelete(false); }}
          onEdit={() => setShowEditModal(true)}
          onLink={() => setShowLinkModal(true)}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          deletePersonAction={deletePersonAction}
        />
      )}

      {showAddModal && (
        <AddPersonModal familySlug={familySlug} people={people} relationships={relationships} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
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

function PhotoUploadButton({ familySlug, personId, uploadPersonPhotoAction, onError }) {
  const [state, formAction, pending] = useActionState(uploadPersonPhotoAction, undefined);
  const inputRef = useRef(null);

  useEffect(() => {
    if (onError) onError(state?.error || null);
  }, [state?.error]);

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
    </form>
  );
}

/* ---------------- Add Person modal ---------------- */

// Mockupdagi "Kimni qo'shmoqchisiz?" menyusi — har bir tugma tanlanganda
// relationType, tegishli savol matni va jinsni oldindan belgilaydi.
// "grandparent_of" — front-end'ga xos maxsus tur: submit paytida avtomatik
// "parent_of" + tegishli oraliq ota-ona ID'siga aylantiriladi (backend'da
// alohida grandparent tushunchasi yo'q, shunga hojat ham yo'q).
const RELATION_OPTIONS = [
  { key: "father", emoji: "👨", label: "Ota", relationType: "parent_of", gender: "male", question: "Kimning otasi bo'ladi?" },
  { key: "mother", emoji: "👩", label: "Ona", relationType: "parent_of", gender: "female", question: "Kimning onasi bo'ladi?" },
  { key: "son", emoji: "👦", label: "O'g'il", relationType: "child_of", gender: "male", question: "Kimning o'g'li bo'ladi?" },
  { key: "daughter", emoji: "👧", label: "Qiz", relationType: "child_of", gender: "female", question: "Kimning qizi bo'ladi?" },
  { key: "spouse", emoji: "💍", label: "Turmush o'rtog'i", relationType: "spouse_of", gender: "", question: "Kimning turmush o'rtog'i bo'ladi?" },
  { key: "grandfather", emoji: "👴", label: "Bobo", relationType: "grandparent_of", gender: "male", question: "Kimning bobosi bo'ladi?" },
  { key: "grandmother", emoji: "👵", label: "Buvi", relationType: "grandparent_of", gender: "female", question: "Kimning buvisi bo'ladi?" },
  { key: "other", emoji: "👤", label: "Boshqa / Aloqasiz", relationType: "none", gender: "", question: "" },
];

/** relatedPersonId'ning (nevarasi) hozirgi ota-onalarini qaytaradi — bobo/buvini
 * shu ota-onalardan biriga "parent_of" sifatida ulash uchun ishlatiladi. */
function getParentsOf(personId, people, relationships) {
  return relationships
    .filter((r) => r.type === "parent" && r.person_b_id === personId)
    .map((r) => people.find((p) => p.id === r.person_a_id))
    .filter(Boolean);
}

function AddPersonModal({ familySlug, people, relationships = [], addPersonAction, onClose }) {
  const [state, formAction, pending] = useActionState(addPersonAction, undefined);
  // Odam allaqachon mavjud bo'lsa, avval "kimni qo'shmoqchisiz" menyusini
  // ko'rsatamiz; aks holda (birinchi odam) to'g'ridan-to'g'ri forma.
  const [step, setStep] = useState(people.length > 0 ? "pick" : "form");
  const [chosen, setChosen] = useState(/** @type {typeof RELATION_OPTIONS[number] | null} */ (null));
  // Bobo/Buvi oqimi uchun: avval nevarasi tanlanadi, keyin (agar ikki
  // ota-onasi bo'lsa) qaysi tomondan ekani tanlanadi.
  const [grandchildId, setGrandchildId] = useState("");
  const [throughParentId, setThroughParentId] = useState("");

  const selectRelation = (opt) => {
    setChosen(opt);
    setGrandchildId("");
    setThroughParentId("");
    setStep("form");
  };

  const isGrandparent = chosen?.relationType === "grandparent_of";
  const grandchildParents = isGrandparent && grandchildId ? getParentsOf(grandchildId, people, relationships) : [];

  // Bitta ota-ona bo'lsa, avtomatik shu orqali ulanadi; ikkitasi bo'lsa —
  // foydalanuvchi tanlaydi; sizni yo'q bo'lsa — submit bloklanadi (pastda).
  const effectiveThroughParentId =
    grandchildParents.length === 1 ? grandchildParents[0].id : throughParentId;

  // Backend'ga yuboriladigan haqiqiy qiymatlar: bobo/buvi uchun bu doim
  // standart "parent_of" + oraliq ota-onaning ID'si.
  const submitRelationType = isGrandparent ? (effectiveThroughParentId ? "parent_of" : "") : (chosen ? chosen.relationType : "none");
  const submitRelatedPersonId = isGrandparent ? effectiveThroughParentId : undefined;

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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {step === "form" && people.length > 0 && (
              <button
                type="button"
                onClick={() => setStep("pick")}
                style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 4, display: "flex" }}
                title="Orqaga"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>
              {step === "pick" ? "Kimni qo'shmoqchisiz?" : chosen ? `Yangi odam — ${chosen.label}` : "Yangi odam qo'shish"}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>

        {step === "pick" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {RELATION_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => selectRelation(opt)}
                className="fm-relation-option"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}`, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: TOKENS.ink, textAlign: "left" }}
              >
                <span style={{ fontSize: 19, lineHeight: 1 }}>{opt.emoji}</span> {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="hidden" name="familySlug" value={familySlug} />
            <input type="hidden" name="relationType" value={submitRelationType} />
            {submitRelatedPersonId !== undefined && <input type="hidden" name="relatedPersonId" value={submitRelatedPersonId} />}

            {isGrandparent ? (
              <>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60 }}>{chosen.question}</div>
                <select value={grandchildId} onChange={(e) => { setGrandchildId(e.target.value); setThroughParentId(""); }} required style={inputStyle}>
                  <option value="" disabled>Odamni tanlang</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{personLabel(p)}</option>
                  ))}
                </select>

                {grandchildId && grandchildParents.length === 0 && (
                  <div style={{ fontSize: 12, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6, lineHeight: 1.5 }}>
                    Bu odamning hali ota-onasi daraxtga qo'shilmagan. Avval otasini yoki onasini qo'shing, keyin bobo/buvini shu orqali qo'sha olasiz.
                  </div>
                )}

                {grandchildId && grandchildParents.length === 1 && (
                  <div style={{ fontSize: 12, color: TOKENS.ink60 }}>
                    {personLabel(grandchildParents[0])} orqali qo'shiladi.
                  </div>
                )}

                {grandchildId && grandchildParents.length >= 2 && (
                  <>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60 }}>Qaysi tomondan?</div>
                    <select value={throughParentId} onChange={(e) => setThroughParentId(e.target.value)} required style={inputStyle}>
                      <option value="" disabled>Ota-onani tanlang</option>
                      {grandchildParents.map((p) => (
                        <option key={p.id} value={p.id}>{personLabel(p)} tomonidan</option>
                      ))}
                    </select>
                  </>
                )}
              </>
            ) : (
              chosen && chosen.relationType !== "none" && (
                <>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60 }}>{chosen.question}</div>
                  <select name="relatedPersonId" defaultValue="" required style={inputStyle}>
                    <option value="" disabled>Odamni tanlang</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>{personLabel(p)}</option>
                    ))}
                  </select>
                </>
              )
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <input name="firstName" placeholder="Ism" required className="fm-modal-input" style={inputStyle} />
              <input name="lastName" placeholder="Familiya" className="fm-modal-input" style={inputStyle} />
            </div>

            <select name="gender" defaultValue={chosen?.gender || ""} style={inputStyle}>
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

            {state?.error && (
              <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending || (isGrandparent && !effectiveThroughParentId)}
              style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending || (isGrandparent && !effectiveThroughParentId) ? 0.6 : 1 }}
            >
              {pending ? "Saqlanmoqda..." : "Qo'shish"}
            </button>
          </form>
        )}
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

/* ---------------- Delete person confirm (useActionState orqali to'g'ri chaqiriladi) ---------------- */

function DeletePersonConfirm({ familySlug, personId, deletePersonAction, onCancel }) {
  const [state, formAction, pending] = useActionState(deletePersonAction, undefined);

  return (
    <div style={{ marginTop: 10, padding: 12, background: "rgba(168,69,58,0.08)", borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: TOKENS.danger, marginBottom: 10 }}>
        Rostdan ham o'chirasizmi? Bog'lanishlari ham o'chadi. Bu amalni ortga qaytarib bo'lmaydi.
      </div>
      {state?.error && (
        <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 8 }}>{state.error}</div>
      )}
      <form action={formAction} style={{ display: "flex", gap: 8 }}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="personId" value={personId} />
        <button type="submit" disabled={pending} style={{ flex: 1, background: TOKENS.danger, color: "#fff", border: "none", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
          {pending ? "O'chirilmoqda..." : "Ha, o'chirish"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} style={{ flex: 1, background: "transparent", color: TOKENS.ink60, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Bekor qilish
        </button>
      </form>
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

const LAYOUTS = [
  { id: "l1", name: "Bitta katta", slots: [{ type: "photo", x: 8, y: 8, w: 84, h: 60 }, { type: "text", x: 8, y: 72, w: 84, h: 20 }] },
  { id: "l2", name: "Ikkita yonma-yon", slots: [{ type: "photo", x: 6, y: 8, w: 41, h: 70 }, { type: "photo", x: 53, y: 8, w: 41, h: 70 }, { type: "text", x: 6, y: 82, w: 88, h: 12 }] },
  { id: "l3", name: "Katta + ikkita kichik", slots: [{ type: "photo", x: 6, y: 6, w: 60, h: 50 }, { type: "photo", x: 68, y: 6, w: 26, h: 24 }, { type: "photo", x: 68, y: 32, w: 26, h: 24 }, { type: "text", x: 6, y: 60, w: 88, h: 32 }] },
  { id: "l4", name: "Uchtasi qatorda", slots: [{ type: "photo", x: 5, y: 10, w: 28, h: 55 }, { type: "photo", x: 36, y: 10, w: 28, h: 55 }, { type: "photo", x: 67, y: 10, w: 28, h: 55 }, { type: "text", x: 5, y: 70, w: 90, h: 22 }] },
];

function ChipButton({ children, active, onClick }) {
  return (
    <button onClick={onClick} type="button" style={{ fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 20, border: active ? "none" : `1px solid ${TOKENS.parchmentDeep}`, background: active ? TOKENS.ink : "transparent", color: active ? TOKENS.parchment : TOKENS.ink60, cursor: "pointer", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

/* ---------------- Empty state ---------------- */

function EmptyAlbums({ onCreate }) {
  return (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BookImage size={24} color="#fff" />
      </div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, margin: "0 0 8px" }}>Hali albom yo'q</h2>
      <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 22px" }}>
        Birinchi xotirangizni saqlang — sayohat, oilaviy kun, yoki shunchaki oddiy bir lahza.
      </p>
      <button onClick={onCreate} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
        <Plus size={15} /> Birinchi albomni yaratish
      </button>
    </div>
  );
}

/* ---------------- Create Album modal ---------------- */

function CreateAlbumModal({ familySlug, createAlbumAction, onClose }) {
  const [state, formAction, pending] = useActionState(createAlbumAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi albom</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input name="title" placeholder="Albom nomi (masalan: 2026 — Parij)" required style={inputStyle} autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <input name="dateLabel" placeholder="Sana (masalan: May 2026)" style={inputStyle} />
            <input name="location" placeholder="Joy (ixtiyoriy)" style={inputStyle} />
          </div>
          <textarea name="description" placeholder="Qisqacha tavsif (ixtiyoriy)" rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Yaratilmoqda..." : "Albom yaratish"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Bulk photo upload modal ("+ Yangi" > "Rasmlar yuklash") ---------------- */

function UploadPhotosModal({ familySlug, albums, bulkUploadPhotosAction, onClose }) {
  const [state, formAction, pending] = useActionState(bulkUploadPhotosAction, undefined);
  const [target, setTarget] = useState(albums.length > 0 ? "existing" : "new");
  const [albumId, setAlbumId] = useState(albums[0]?.id || "");
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [fileCount, setFileCount] = useState(0);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Rasmlar yuklash</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input type="hidden" name="albumId" value={target === "existing" ? albumId : ""} />
          <input type="hidden" name="newAlbumTitle" value={target === "new" ? newAlbumTitle : ""} />

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.ink60, marginBottom: 8 }}>Qaysi albomga?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {albums.length > 0 && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <input type="radio" name="targetChoice" checked={target === "existing"} onChange={() => setTarget("existing")} />
                  <select
                    value={albumId}
                    onChange={(e) => { setAlbumId(e.target.value); setTarget("existing"); }}
                    onFocus={() => setTarget("existing")}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </label>
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                <input type="radio" name="targetChoice" checked={target === "new"} onChange={() => setTarget("new")} />
                <input
                  placeholder="Yangi albom nomi"
                  value={newAlbumTitle}
                  onChange={(e) => { setNewAlbumTitle(e.target.value); setTarget("new"); }}
                  onFocus={() => setTarget("new")}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </label>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.ink60, marginBottom: 8 }}>Rasmlar</div>
            <label
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 90, borderRadius: 10,
                border: `1.5px dashed ${TOKENS.parchmentDeep}`, cursor: "pointer", color: TOKENS.ink60, fontSize: 13, fontWeight: 500,
              }}
            >
              <ImagePlus size={18} color={TOKENS.gold} />
              {fileCount > 0 ? `${fileCount} ta rasm tanlandi` : "Bir yoki bir nechta rasm tanlash uchun bosing"}
              <input
                type="file"
                name="photos"
                accept="image/*"
                multiple
                onChange={(e) => setFileCount(e.target.files?.length || 0)}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button
            type="submit"
            disabled={pending || fileCount === 0 || (target === "new" && !newAlbumTitle.trim())}
            style={{ marginTop: 4, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending || fileCount === 0 || (target === "new" && !newAlbumTitle.trim()) ? 0.6 : 1 }}
          >
            {pending ? "Yuklanmoqda..." : "Yuklash"}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Real fotosuratli albom cover'i, yoki (foydalanuvchi cover tanlamagan bo'lsa)
 * albom nomidan olingan iliq, "generated" gradient — bo'sh kulrang quti emas.
 */
const COVER_GRADIENTS = [
  [TOKENS.gold, TOKENS.teal],
  [TOKENS.teal, TOKENS.ink],
  [TOKENS.goldSoft, TOKENS.gold],
  [TOKENS.ink, TOKENS.tealSoft],
];
function coverGradientFor(id) {
  let hash = 0;
  for (let i = 0; i < (id || "").length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const [a, b] = COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function AlbumCard({ album: a, onClick, compact }) {
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

function AlbumGrid({ albums, onOpen, canEdit, createAlbumAction, familySlug }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div style={{ padding: "28px clamp(16px, 5vw, 48px) 60px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Arxiv</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>Mening albomlarim</h1>
        </div>
        {canEdit && albums.length > 0 && (
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Yangi albom
          </button>
        )}
      </div>

      {albums.length === 0 ? (
        <EmptyAlbums onCreate={() => setShowCreate(true)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} onClick={() => onOpen(a)} />
          ))}
        </div>
      )}

      {showCreate && <CreateAlbumModal familySlug={familySlug} createAlbumAction={createAlbumAction} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

/* ---------------- Page canvas (real elementlar bilan) ---------------- */

function PhotoSlot({ element, familySlug, albumId, uploadElementPhotoAction, canEdit, style }) {
  const [state, formAction, pending] = useActionState(uploadElementPhotoAction, undefined);
  const inputRef = useRef(null);

  return (
    <div style={{ ...style, position: "absolute" }}>
      <div
        style={{
          width: "100%", height: "100%", borderRadius: 3, position: "relative", overflow: "hidden",
          background: element.photo_url ? undefined : TOKENS.parchment,
          backgroundImage: element.photo_url ? `url(${element.photo_url})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          boxShadow: element.photo_url ? "0 3px 10px rgba(0,0,0,0.12)" : "none",
          border: element.photo_url ? "none" : `1.5px dashed ${TOKENS.parchmentDeep}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {!element.photo_url && <BookImage size={20} color={TOKENS.ink40} />}
        {canEdit && (
          <form action={formAction} style={{ position: "absolute", inset: 0 }}>
            <input type="hidden" name="familySlug" value={familySlug} />
            <input type="hidden" name="albumId" value={albumId} />
            <input type="hidden" name="elementId" value={element.id} />
            <input
              ref={inputRef}
              type="file"
              name="photo"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files?.length) e.target.form.requestSubmit(); }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%", background: "rgba(30,38,33,0.0)",
                border: "none", cursor: pending ? "default" : "pointer",
              }}
              title="Rasm yuklash"
            >
              {pending && <span style={{ fontSize: 10, color: TOKENS.ink }}>Yuklanmoqda...</span>}
            </button>
          </form>
        )}
      </div>
      {state?.error && <div style={{ fontSize: 9.5, color: TOKENS.danger, marginTop: 3 }}>{state.error}</div>}
    </div>
  );
}

function TextSlot({ element, familySlug, albumId, updateElementTextAction, canEdit, style }) {
  const [state, formAction] = useActionState(updateElementTextAction, undefined);
  const [value, setValue] = useState(element.text_content || "");
  const formRef = useRef(null);

  return (
    <div style={{ ...style, position: "absolute" }}>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="albumId" value={albumId} />
        <input type="hidden" name="elementId" value={element.id} />
        <input type="hidden" name="text" value={value} />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => { if (canEdit && value !== (element.text_content || "")) formRef.current?.requestSubmit(); }}
          readOnly={!canEdit}
          placeholder={canEdit ? "Matn yozing..." : ""}
          style={{
            width: "100%", height: "100%", border: "none", outline: "none", resize: "none", background: "transparent",
            fontFamily: "Fraunces, serif", fontStyle: "italic", fontSize: 13.5, lineHeight: 1.5, color: TOKENS.ink,
          }}
        />
      </form>
      {state?.error && <div style={{ fontSize: 9.5, color: TOKENS.danger }}>{state.error}</div>}
    </div>
  );
}

function PageCanvas({ page, layout, familySlug, albumId, canEdit, uploadElementPhotoAction, updateElementTextAction }) {
  return (
    <div style={{ width: "100%", aspectRatio: "4/3", background: "#FFFFFF", borderRadius: 4, position: "relative", boxShadow: "0 12px 34px rgba(30,38,33,0.16), 0 2px 6px rgba(30,38,33,0.08)" }}>
      {layout.slots.map((slot, i) => {
        const element = page.elements[i];
        if (!element) return null;
        const style = { left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` };
        if (slot.type === "photo") {
          return (
            <PhotoSlot
              key={element.id}
              element={element}
              familySlug={familySlug}
              albumId={albumId}
              uploadElementPhotoAction={uploadElementPhotoAction}
              canEdit={canEdit}
              style={style}
            />
          );
        }
        return (
          <TextSlot
            key={element.id}
            element={element}
            familySlug={familySlug}
            albumId={albumId}
            updateElementTextAction={updateElementTextAction}
            canEdit={canEdit}
            style={style}
          />
        );
      })}
      <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, color: TOKENS.ink40, display: "flex", alignItems: "center", gap: 10 }}>
        {page.date_label && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Calendar size={10} /> {page.date_label}</span>}
        {page.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPinned size={10} /> {page.location}</span>}
      </div>
    </div>
  );
}

function AlbumEditor({
  album,
  onBack,
  familySlug,
  canEdit,
  addAlbumPageAction,
  deleteAlbumPageAction,
  changePageLayoutAction,
  uploadElementPhotoAction,
  updateElementTextAction,
  deleteAlbumAction,
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(false);

  const pages = album.pages;
  const currentPage = pages[Math.min(pageIndex, pages.length - 1)];
  const currentLayout = currentPage ? LAYOUTS.find((l) => l.id === currentPage.layout_id) || LAYOUTS[0] : LAYOUTS[0];

  const [addPageState, addPageFormAction, addPagePending] = useActionState(addAlbumPageAction, undefined);
  const [layoutState, layoutFormAction] = useActionState(changePageLayoutAction, undefined);
  const [deletePageState, deletePageFormAction] = useActionState(deleteAlbumPageAction, undefined);
  const [deleteAlbumState, deleteAlbumFormAction, deleteAlbumPending] = useActionState(deleteAlbumAction, undefined);

  return (
    <div style={{ padding: "22px clamp(16px, 4vw, 40px) 60px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TOKENS.ink60, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <ChevronLeft size={16} /> Albomlarga qaytish
        </button>
        {canEdit && (
          !confirmDeleteAlbum ? (
            <button onClick={() => setConfirmDeleteAlbum(true)} style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.danger, background: "transparent", border: `1px solid ${TOKENS.danger}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
              Albomni o'chirish
            </button>
          ) : (
            <form action={deleteAlbumFormAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="hidden" name="familySlug" value={familySlug} />
              <input type="hidden" name="albumId" value={album.id} />
              <span style={{ fontSize: 11.5, color: TOKENS.danger }}>Rostdan ham?</span>
              <button type="submit" disabled={deleteAlbumPending} style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: TOKENS.danger, border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>
                Ha, o'chirish
              </button>
              <button type="button" onClick={() => setConfirmDeleteAlbum(false)} style={{ fontSize: 12, fontWeight: 600, color: TOKENS.ink60, background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "7px 12px", cursor: "pointer" }}>
                Bekor qilish
              </button>
            </form>
          )
        )}
      </div>

      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 27, fontWeight: 500, margin: 0 }}>{album.title}</h1>
        <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 4 }}>{[album.date_label, album.location].filter(Boolean).join(" · ")}</div>
      </div>

      {pages.length === 0 || !currentPage ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: TOKENS.ink60, fontSize: 13.5 }}>Bu albomda hali sahifa yo'q.</div>
      ) : (
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            {canEdit && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <ChipButton active={showLayoutPicker} onClick={() => setShowLayoutPicker(!showLayoutPicker)}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><LayoutGrid size={13} /> Layout</span>
                </ChipButton>
              </div>
            )}

            {showLayoutPicker && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18, background: TOKENS.card, padding: 14, borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}` }}>
                {LAYOUTS.map((l) => (
                  <form key={l.id} action={layoutFormAction} onSubmit={() => setShowLayoutPicker(false)}>
                    <input type="hidden" name="familySlug" value={familySlug} />
                    <input type="hidden" name="albumId" value={album.id} />
                    <input type="hidden" name="pageId" value={currentPage.id} />
                    <input type="hidden" name="layoutId" value={l.id} />
                    <button
                      type="submit"
                      style={{ width: "100%", cursor: "pointer", border: currentLayout.id === l.id ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: 8, background: "#fff" }}
                    >
                      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: TOKENS.parchment, borderRadius: 3, marginBottom: 6 }}>
                        {l.slots.map((s, i) => <div key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`, background: s.type === "photo" ? TOKENS.goldSoft : TOKENS.tealSoft, borderRadius: 2, opacity: 0.7 }} />)}
                      </div>
                      <div style={{ fontSize: 10, color: TOKENS.ink60, textAlign: "center" }}>{l.name}</div>
                    </button>
                  </form>
                ))}
              </div>
            )}
            {layoutState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 10 }}>{layoutState.error}</div>}

            <PageCanvas
              page={currentPage}
              layout={currentLayout}
              familySlug={familySlug}
              albumId={album.id}
              canEdit={canEdit}
              uploadElementPhotoAction={uploadElementPhotoAction}
              updateElementTextAction={updateElementTextAction}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20 }}>
              <button onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} disabled={pageIndex === 0} style={{ background: "none", border: "none", cursor: pageIndex === 0 ? "default" : "pointer", color: pageIndex === 0 ? TOKENS.ink40 : TOKENS.ink, opacity: pageIndex === 0 ? 0.4 : 1 }}><ChevronLeft size={20} /></button>
              <span style={{ fontSize: 12.5, color: TOKENS.ink60, fontWeight: 500 }}>Sahifa {pageIndex + 1} / {pages.length}</span>
              <button onClick={() => setPageIndex(Math.min(pages.length - 1, pageIndex + 1))} disabled={pageIndex === pages.length - 1} style={{ background: "none", border: "none", cursor: pageIndex === pages.length - 1 ? "default" : "pointer", color: pageIndex === pages.length - 1 ? TOKENS.ink40 : TOKENS.ink, opacity: pageIndex === pages.length - 1 ? 0.4 : 1 }}><ChevronRight size={20} /></button>
            </div>

            {canEdit && pages.length > 1 && (
              <form action={deletePageFormAction} style={{ textAlign: "center", marginTop: 14 }}>
                <input type="hidden" name="familySlug" value={familySlug} />
                <input type="hidden" name="albumId" value={album.id} />
                <input type="hidden" name="pageId" value={currentPage.id} />
                <button type="submit" style={{ fontSize: 11.5, color: TOKENS.danger, background: "none", border: "none", cursor: "pointer" }}>
                  Bu sahifani o'chirish
                </button>
              </form>
            )}
            {deletePageState?.error && <div style={{ fontSize: 11.5, color: TOKENS.danger, textAlign: "center", marginTop: 6 }}>{deletePageState.error}</div>}
          </div>

          <div style={{ width: 128, flexShrink: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: TOKENS.ink40, textTransform: "uppercase", marginBottom: 12 }}>Sahifalar</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 480, overflowY: "auto" }}>
              {pages.map((p, i) => {
                const firstPhoto = p.elements.find((e) => e.type === "photo" && e.photo_url);
                return (
                  <div key={p.id} onClick={() => setPageIndex(i)} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 4, background: "#fff", border: i === pageIndex ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`, cursor: "pointer", position: "relative", overflow: "hidden" }}>
                    {firstPhoto && <div style={{ position: "absolute", inset: 4, backgroundImage: `url(${firstPhoto.photo_url})`, backgroundSize: "cover", borderRadius: 2 }} />}
                  </div>
                );
              })}
              {canEdit && (
                <form action={addPageFormAction}>
                  <input type="hidden" name="familySlug" value={familySlug} />
                  <input type="hidden" name="albumId" value={album.id} />
                  <button type="submit" disabled={addPagePending} style={{ width: "100%", aspectRatio: "4/3", borderRadius: 4, border: `1.5px dashed ${TOKENS.parchmentDeep}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.ink40, cursor: addPagePending ? "default" : "pointer" }}>
                    <Plus size={18} />
                  </button>
                </form>
              )}
            </div>
            {addPageState?.error && <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 8 }}>{addPageState.error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function AlbumsView({
  albums,
  activeAlbumId,
  openAlbumId,
  setOpenAlbumId,
  familySlug,
  canEdit,
  createAlbumAction,
  deleteAlbumAction,
  addAlbumPageAction,
  deleteAlbumPageAction,
  changePageLayoutAction,
  uploadElementPhotoAction,
  updateElementTextAction,
}) {
  const effectiveOpenId = openAlbumId ?? activeAlbumId;
  const openAlbum = albums.find((a) => a.id === effectiveOpenId) || null;

  return (
    <div className="fm-fade" style={{ height: "100%", overflow: "auto" }}>
      {openAlbum ? (
        <AlbumEditor
          album={openAlbum}
          onBack={() => setOpenAlbumId(null)}
          familySlug={familySlug}
          canEdit={canEdit}
          addAlbumPageAction={addAlbumPageAction}
          deleteAlbumPageAction={deleteAlbumPageAction}
          changePageLayoutAction={changePageLayoutAction}
          uploadElementPhotoAction={uploadElementPhotoAction}
          updateElementTextAction={updateElementTextAction}
          deleteAlbumAction={deleteAlbumAction}
        />
      ) : (
        <AlbumGrid albums={albums} onOpen={(a) => setOpenAlbumId(a.id)} canEdit={canEdit} createAlbumAction={createAlbumAction} familySlug={familySlug} />
      )}
    </div>
  );
}

/* ---------------- People (Odamlar) grid view ---------------- */

function PersonGridCard({ person, onSelect, isMe }) {
  return (
    <div onClick={onSelect} className="fm-person-grid-card" style={{ textAlign: "center", cursor: "pointer" }}>
      <div
        style={{
          width: 76, height: 76, borderRadius: "50%", margin: "0 auto 10px",
          border: isMe ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`,
          background: person.photoUrl ? undefined : TOKENS.parchmentDeep,
          backgroundImage: person.photoUrl ? `url(${person.photoUrl})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          display: person.photoUrl ? undefined : "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Fraunces, serif", fontSize: 24, color: TOKENS.ink60,
        }}
      >
        {!person.photoUrl && (person.name?.[0]?.toUpperCase() || "?")}
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.name}</div>
      <div style={{ fontSize: 11, color: TOKENS.ink60, marginTop: 2 }}>{person.years}</div>
    </div>
  );
}

function PeopleView({
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
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [query, setQuery] = useState("");

  // Bir xil "formatlangan" shakl — Family Tree'dagi bilan bir xil (name/years/
  // photoUrl/raw), shunda PersonDetailPanel va Edit/Link modallarini o'zgarishsiz
  // qayta ishlatish mumkin.
  const items = useMemo(
    () =>
      people
        .map((p) => ({
          id: p.id,
          name: personLabel(p),
          years: personYears(p),
          biography: p.biography,
          photoUrl: p.profile_photo_url,
          gender: p.gender,
          raw: p,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "uz")),
    [people]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => p.name.toLowerCase().includes(q));
  }, [items, query]);

  const selected = items.find((p) => p.id === selectedId) || null;

  const relationToMe = useMemo(() => {
    if (!selected || !mePersonId) return null;
    return relationLabelBetween(mePersonId, selected.id, people, relationships);
  }, [selected, mePersonId, people, relationships]);

  useEffect(() => {
    setPhotoError(null);
  }, [selectedId]);

  if (people.length === 0) {
    return (
      <>
        <EmptyFamilyTree familyName={familyName} canEdit={canEdit} onAddPerson={() => setShowAddModal(true)} />
        {showAddModal && (
          <AddPersonModal familySlug={familySlug} people={people} relationships={relationships} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="fm-fade" style={{ display: "flex", height: "100%", flexWrap: "wrap" }}>
      <div style={{ flex: 1, padding: "28px clamp(16px, 5vw, 48px) 60px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Oila a'zolari</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>Odamlar</h1>
            <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 6 }}>{items.length} a'zo</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, padding: "0 12px", height: 40 }}>
              <Search size={14} color={TOKENS.ink40} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ism bo'yicha qidirish..."
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, width: 170, color: TOKENS.ink, fontFamily: "Inter, sans-serif" }}
              />
            </div>
            {canEdit && (
              <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "0 18px", height: 40, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                <Plus size={14} /> Odam qo'shish
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: TOKENS.ink40, fontSize: 13 }}>Hech kim topilmadi.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: "26px 18px" }}>
            {filtered.map((p) => (
              <PersonGridCard key={p.id} person={p} isMe={p.id === mePersonId} onSelect={() => setSelectedId(p.id)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PersonDetailPanel
          selected={selected}
          mePersonId={mePersonId}
          relationToMe={relationToMe}
          canEdit={canEdit}
          familySlug={familySlug}
          uploadPersonPhotoAction={uploadPersonPhotoAction}
          photoError={photoError}
          setPhotoError={setPhotoError}
          onClose={() => { setSelectedId(null); setConfirmDelete(false); }}
          onEdit={() => setShowEditModal(true)}
          onLink={() => setShowLinkModal(true)}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          deletePersonAction={deletePersonAction}
        />
      )}

      {showAddModal && (
        <AddPersonModal familySlug={familySlug} people={people} relationships={relationships} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
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

/* ---------------- Timeline (Vaqt chizig'i) ---------------- */

/** event_date matnidan boshlang'ich yilni ajratib oladi — faqat guruhlash
 * (yil sarlavhalari) uchun, client tomonda. Backend tartiblashi
 * `lib/timeline.ts`dagi `extractYear` bilan bir xil mantiqqa asoslangan. */
function extractEventYear(dateLabel) {
  if (!dateLabel) return null;
  const m = String(dateLabel).match(/\d{3,4}/);
  return m ? m[0] : null;
}

function EmptyTimeline({ canEdit, onAddEvent }) {
  return (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <History size={24} color="#fff" />
      </div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, margin: "0 0 8px" }}>Hali voqealar yo'q</h2>
      <p style={{ fontSize: 13, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 22px" }}>
        Oilangiz tarixidagi muhim kunlarni — to'ylar, ko'chishlar, tug'ilgan kunlar, yutuqlarni — shu yerga qo'shib, vaqt chizig'ini yarating.
      </p>
      {canEdit && (
        <button onClick={onAddEvent} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={15} /> Birinchi voqeani qo'shish
        </button>
      )}
    </div>
  );
}

function TimelineYearMarker({ label }) {
  return (
    <div style={{ position: "relative", paddingLeft: 30, marginBottom: 14 }}>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 600, color: TOKENS.ink }}>{label}</div>
    </div>
  );
}

function TimelineEventCard({ event, personName, onSelect }) {
  return (
    <div style={{ position: "relative", paddingLeft: 30, paddingBottom: 22 }}>
      <div style={{ position: "absolute", left: 3, top: 4, width: 13, height: 13, borderRadius: "50%", background: TOKENS.card, border: `2.5px solid ${TOKENS.gold}` }} />
      <div
        className="fm-album-card"
        onClick={onSelect}
        style={{ display: "flex", gap: 14, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 12, padding: "14px 16px" }}
      >
        {event.photo_url ? (
          <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, backgroundImage: `url(${event.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, background: TOKENS.parchment, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <History size={20} color={TOKENS.goldSoft} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TOKENS.gold, letterSpacing: "0.05em" }}>
            {event.event_date || "Sana ko'rsatilmagan"}
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 16.5, fontWeight: 500, margin: "2px 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {event.title}
          </div>
          {event.description && (
            <div style={{ fontSize: 12.5, color: TOKENS.ink60, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {event.description}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {event.location && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TOKENS.ink40 }}><MapPinned size={11} /> {event.location}</span>}
            {personName && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TOKENS.ink40 }}><Users size={11} /> {personName}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEventPhotoButton({ familySlug, eventId, uploadTimelineEventPhotoAction, onError }) {
  const [state, formAction, pending] = useActionState(uploadTimelineEventPhotoAction, undefined);
  const inputRef = useRef(null);

  useEffect(() => {
    if (onError) onError(state?.error || null);
  }, [state?.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="familySlug" value={familySlug} />
      <input type="hidden" name="eventId" value={eventId} />
      <input
        ref={inputRef}
        type="file"
        name="photo"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files?.length) e.target.form.requestSubmit(); }}
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
    </form>
  );
}

function DeleteTimelineEventConfirm({ familySlug, eventId, deleteTimelineEventAction, onCancel }) {
  const [state, formAction, pending] = useActionState(deleteTimelineEventAction, undefined);

  return (
    <div style={{ marginTop: 10, padding: 12, background: "rgba(168,69,58,0.08)", borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: TOKENS.danger, marginBottom: 10 }}>
        Rostdan ham bu voqeani o'chirasizmi? Bu amalni ortga qaytarib bo'lmaydi.
      </div>
      {state?.error && (
        <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 8 }}>{state.error}</div>
      )}
      <form action={formAction} style={{ display: "flex", gap: 8 }}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="eventId" value={eventId} />
        <button type="submit" disabled={pending} style={{ flex: 1, background: TOKENS.danger, color: "#fff", border: "none", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
          {pending ? "O'chirilmoqda..." : "Ha, o'chirish"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} style={{ flex: 1, background: "transparent", color: TOKENS.ink60, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Bekor qilish
        </button>
      </form>
    </div>
  );
}

function TimelineEventDetailPanel({
  event,
  personName,
  canEdit,
  familySlug,
  uploadTimelineEventPhotoAction,
  photoError,
  setPhotoError,
  onClose,
  onEdit,
  confirmDelete,
  setConfirmDelete,
  deleteTimelineEventAction,
}) {
  return (
    <div className="fm-panel-enter" style={{ width: "min(320px, 100%)", flex: "1 1 320px", flexShrink: 0, background: TOKENS.card, borderLeft: `1px solid ${TOKENS.parchmentDeep}`, padding: "24px 22px", overflow: "auto", maxHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 4 }}><X size={18} /></button>
      </div>

      <div style={{ position: "relative", width: "100%", height: 150, borderRadius: 12, marginBottom: 16 }}>
        <div
          style={{
            width: "100%", height: "100%", borderRadius: 12,
            background: event.photo_url ? undefined : TOKENS.parchment,
            backgroundImage: event.photo_url ? `url(${event.photo_url})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            border: `1px solid ${TOKENS.parchmentDeep}`,
            display: event.photo_url ? undefined : "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {!event.photo_url && <History size={26} color={TOKENS.goldSoft} />}
        </div>
        {canEdit && uploadTimelineEventPhotoAction && (
          <TimelineEventPhotoButton
            familySlug={familySlug}
            eventId={event.id}
            uploadTimelineEventPhotoAction={uploadTimelineEventPhotoAction}
            onError={setPhotoError}
          />
        )}
      </div>

      {photoError && (
        <div style={{ fontSize: 11, color: TOKENS.danger, textAlign: "center", marginBottom: 10, padding: "6px 10px", background: "rgba(168,69,58,0.08)", borderRadius: 6 }}>
          {photoError}
        </div>
      )}

      <div style={{ fontSize: 11.5, fontWeight: 700, color: TOKENS.gold, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5 }}>
        <Calendar size={12} /> {event.event_date || "Sana ko'rsatilmagan"}
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: "4px 0 10px" }}>{event.title}</div>

      {event.location && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TOKENS.ink60, marginBottom: 8 }}>
          <MapPinned size={12} /> {event.location}
        </div>
      )}
      {personName && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TOKENS.ink60, marginBottom: 8 }}>
          <Users size={12} /> {personName}
        </div>
      )}

      <div style={{ fontSize: 12.5, color: TOKENS.ink60, lineHeight: 1.6, margin: "10px 0 4px" }}>
        {event.description || "Bu voqea haqida hali tavsif qo'shilmagan."}
      </div>

      {canEdit && (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={onEdit} style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              Tahrirlash
            </button>
          </div>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ marginTop: 10, width: "100%", background: "transparent", color: TOKENS.danger, border: `1px solid ${TOKENS.danger}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              O'chirish
            </button>
          ) : (
            <DeleteTimelineEventConfirm
              familySlug={familySlug}
              eventId={event.id}
              deleteTimelineEventAction={deleteTimelineEventAction}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

function AddTimelineEventModal({ familySlug, people, createTimelineEventAction, onClose }) {
  const [state, formAction, pending] = useActionState(createTimelineEventAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi voqea</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input name="title" placeholder="Voqea nomi (masalan: To'y kuni)" required style={inputStyle} autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <input name="eventDate" placeholder="Sana (masalan: 1998 yoki Iyun 2005)" style={inputStyle} />
            <input name="location" placeholder="Joy (ixtiyoriy)" style={inputStyle} />
          </div>
          {people.length > 0 && (
            <select name="personId" defaultValue="" style={inputStyle}>
              <option value="">Bog'liq odam (ixtiyoriy)</option>
              {people.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
            </select>
          )}
          <textarea name="description" placeholder="Voqea haqida qisqacha (ixtiyoriy)" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Qo'shilmoqda..." : "Voqea qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditTimelineEventModal({ familySlug, event, people, updateTimelineEventAction, onClose }) {
  const [state, formAction, pending] = useActionState(updateTimelineEventAction, undefined);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, maxHeight: "88vh", overflow: "auto", background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Voqeani tahrirlash</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input type="hidden" name="eventId" value={event.id} />
          <input name="title" placeholder="Voqea nomi" defaultValue={event.title} required style={inputStyle} />
          <div style={{ display: "flex", gap: 10 }}>
            <input name="eventDate" placeholder="Sana" defaultValue={event.event_date || ""} style={inputStyle} />
            <input name="location" placeholder="Joy (ixtiyoriy)" defaultValue={event.location || ""} style={inputStyle} />
          </div>
          {people.length > 0 && (
            <select name="personId" defaultValue={event.person_id || ""} style={inputStyle}>
              <option value="">Bog'liq odam (ixtiyoriy)</option>
              {people.map((p) => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
            </select>
          )}
          <textarea name="description" placeholder="Voqea haqida qisqacha" defaultValue={event.description || ""} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>
      </div>
    </div>
  );
}

function TimelineView({
  familySlug,
  people,
  timelineEvents,
  canEdit,
  createTimelineEventAction,
  updateTimelineEventAction,
  deleteTimelineEventAction,
  uploadTimelineEventPhotoAction,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  const selected = timelineEvents.find((e) => e.id === selectedId) || null;
  const personNameFor = (personId) => {
    if (!personId) return null;
    const p = people.find((pp) => pp.id === personId);
    return p ? personLabel(p) : null;
  };

  // Voqealarni yil bo'yicha guruhlaymiz (allaqachon xronologik tartiblangan) —
  // render paytida o'zgaruvchini mutatsiya qilishdan qochish uchun useMemo
  // ichida, oldindan hisoblab qo'yamiz.
  const groupedEvents = useMemo(() => {
    const groups = [];
    let currentKey;
    for (const ev of timelineEvents) {
      const year = extractEventYear(ev.event_date);
      if (groups.length === 0 || year !== currentKey) {
        groups.push({ year, items: [ev] });
        currentKey = year;
      } else {
        groups[groups.length - 1].items.push(ev);
      }
    }
    return groups;
  }, [timelineEvents]);

  useEffect(() => {
    setPhotoError(null);
  }, [selectedId]);

  if (timelineEvents.length === 0) {
    return (
      <>
        <EmptyTimeline canEdit={canEdit} onAddEvent={() => setShowAddModal(true)} />
        {showAddModal && (
          <AddTimelineEventModal familySlug={familySlug} people={people} createTimelineEventAction={createTimelineEventAction} onClose={() => setShowAddModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="fm-fade" style={{ display: "flex", height: "100%", flexWrap: "wrap" }}>
      <div style={{ flex: 1, padding: "28px clamp(16px, 5vw, 48px) 60px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Oila tarixi</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>Vaqt chizig'i</h1>
            <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 6 }}>{timelineEvents.length} ta voqea</div>
          </div>
          {canEdit && (
            <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "0 18px", height: 40, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={14} /> Voqea qo'shish
            </button>
          )}
        </div>

        <div style={{ position: "relative", maxWidth: 640 }}>
          <div style={{ position: "absolute", left: 9, top: 6, bottom: 20, width: 2, background: TOKENS.parchmentDeep }} />
          {groupedEvents.map((group) => (
            <React.Fragment key={group.year ?? "unknown"}>
              <TimelineYearMarker label={group.year || "Sana noaniq"} />
              {group.items.map((ev) => (
                <TimelineEventCard key={ev.id} event={ev} personName={personNameFor(ev.person_id)} onSelect={() => setSelectedId(ev.id)} />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {selected && (
        <TimelineEventDetailPanel
          event={selected}
          personName={personNameFor(selected.person_id)}
          canEdit={canEdit}
          familySlug={familySlug}
          uploadTimelineEventPhotoAction={uploadTimelineEventPhotoAction}
          photoError={photoError}
          setPhotoError={setPhotoError}
          onClose={() => { setSelectedId(null); setConfirmDelete(false); }}
          onEdit={() => setShowEditModal(true)}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          deleteTimelineEventAction={deleteTimelineEventAction}
        />
      )}

      {showAddModal && (
        <AddTimelineEventModal familySlug={familySlug} people={people} createTimelineEventAction={createTimelineEventAction} onClose={() => setShowAddModal(false)} />
      )}

      {showEditModal && selected && (
        <EditTimelineEventModal
          familySlug={familySlug}
          event={selected}
          people={people}
          updateTimelineEventAction={updateTimelineEventAction}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

/* ---------------- Settings (Sozlamalar) ---------------- */

const ROLE_LABELS = {
  owner: "Egasi",
  editor: "Muharrir",
  member: "A'zo",
  viewer: "Kuzatuvchi",
};

function RoleBadge({ role }) {
  const isOwner = role === "owner";
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
        background: isOwner ? "rgba(184,134,59,0.16)" : TOKENS.parchment,
        color: isOwner ? TOKENS.gold : TOKENS.ink60,
        border: isOwner ? "none" : `1px solid ${TOKENS.parchmentDeep}`,
      }}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function FamilyNameForm({ familySlug, familyName, updateFamilyNameAction }) {
  const [state, formAction, pending] = useActionState(updateFamilyNameAction, undefined);
  return (
    <form action={formAction} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
      <input type="hidden" name="familySlug" value={familySlug} />
      <div style={{ flex: "1 1 220px", minWidth: 180 }}>
        <input name="name" defaultValue={familyName} required style={inputStyle} />
        {state?.error && <div style={{ fontSize: 12, color: TOKENS.danger, marginTop: 6 }}>{state.error}</div>}
        {state?.ok && <div style={{ fontSize: 12, color: TOKENS.teal, marginTop: 6 }}>Saqlandi. O'zgarish sahifani yangilaganda hamma joyda ko'rinadi.</div>}
      </div>
      <button type="submit" disabled={pending} style={{ background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1, flexShrink: 0 }}>
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </button>
    </form>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 500, margin: "0 0 16px" }}>{title}</h2>
      {children}
    </div>
  );
}

function InviteLinkRow({ invite, familySlug, revokeInviteAction }) {
  const [copied, setCopied] = useState(false);
  const [revokeState, revokeFormAction, revokePending] = useActionState(revokeInviteAction, undefined);
  const url = typeof window !== "undefined" ? `${window.location.origin}/invite/${invite.code}` : `/invite/${invite.code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard ruxsati bo'lmasa jim o'tkazib yuboramiz
    }
  };

  if (revokeState?.ok) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: `1px solid ${TOKENS.parchmentDeep}`, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0, flex: "1 1 220px" }}>
        <div style={{ fontSize: 12.5, fontFamily: "monospace", color: TOKENS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</div>
        <div style={{ fontSize: 11, color: TOKENS.ink40, marginTop: 2 }}>Rol: {ROLE_LABELS[invite.role] || invite.role}</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button type="button" onClick={copy} style={{ background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: TOKENS.ink }}>
          {copied ? "Nusxalandi ✓" : "Nusxalash"}
        </button>
        <form action={revokeFormAction}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input type="hidden" name="inviteId" value={invite.id} />
          <button type="submit" disabled={revokePending} style={{ background: "transparent", border: `1px solid ${TOKENS.danger}`, color: TOKENS.danger, borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: revokePending ? "default" : "pointer", opacity: revokePending ? 0.6 : 1 }}>
            Bekor qilish
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateInviteForm({ familySlug, createInviteAction, onCreated }) {
  const [state, formAction, pending] = useActionState(createInviteAction, undefined);
  const [role, setRole] = useState("member");
  const lastCode = useRef(null);

  useEffect(() => {
    if (state?.ok && state.inviteCode && state.inviteCode !== lastCode.current) {
      lastCode.current = state.inviteCode;
      onCreated?.();
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
      <input type="hidden" name="familySlug" value={familySlug} />
      <select name="role" value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputStyle, flex: "0 0 auto", width: "auto" }}>
        <option value="member">A'zo</option>
        <option value="editor">Muharrir</option>
        <option value="viewer">Kuzatuvchi</option>
      </select>
      <button type="submit" disabled={pending} style={{ background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "11px 18px", fontSize: 13, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
        {pending ? "Yaratilmoqda..." : "Taklif havolasi yaratish"}
      </button>
      {state?.error && <div style={{ width: "100%", fontSize: 12, color: TOKENS.danger }}>{state.error}</div>}
    </form>
  );
}

function MemberRow({ member: m, familySlug, userEmail, isOwner, updateMemberRoleAction, removeMemberAction }) {
  const isMe = m.email === userEmail;
  const canManage = isOwner && !isMe && m.role !== "owner";

  const [roleState, roleFormAction, rolePending] = useActionState(updateMemberRoleAction, undefined);
  const [removeState, removeFormAction, removePending] = useActionState(removeMemberAction, undefined);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [role, setRole] = useState(m.role === "owner" ? "member" : m.role);

  if (removeState?.ok) return null;

  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${TOKENS.parchmentDeep}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: TOKENS.ink, display: "flex", alignItems: "center", gap: 6 }}>
            {m.name}
            {isMe && <span style={{ fontSize: 11, color: TOKENS.ink40, fontWeight: 400 }}>(siz)</span>}
          </div>
          <div style={{ fontSize: 12, color: TOKENS.ink60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
        </div>

        {canManage ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <form action={roleFormAction} onChange={(e) => e.currentTarget.requestSubmit()}>
              <input type="hidden" name="familySlug" value={familySlug} />
              <input type="hidden" name="userId" value={m.user_id} />
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={rolePending}
                style={{ fontSize: 12, fontWeight: 600, padding: "5px 8px", borderRadius: 7, border: `1px solid ${TOKENS.parchmentDeep}`, background: TOKENS.parchment, color: TOKENS.ink, cursor: rolePending ? "default" : "pointer" }}
              >
                <option value="editor">{ROLE_LABELS.editor}</option>
                <option value="member">{ROLE_LABELS.member}</option>
                <option value="viewer">{ROLE_LABELS.viewer}</option>
              </select>
            </form>
            {!confirmRemove ? (
              <button type="button" onClick={() => setConfirmRemove(true)} style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.danger, background: "transparent", border: `1px solid ${TOKENS.danger}`, borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
                Chiqarish
              </button>
            ) : (
              <form action={removeFormAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="hidden" name="familySlug" value={familySlug} />
                <input type="hidden" name="userId" value={m.user_id} />
                <span style={{ fontSize: 11, color: TOKENS.danger }}>Rostdan?</span>
                <button type="submit" disabled={removePending} style={{ fontSize: 11.5, fontWeight: 600, color: "#fff", background: TOKENS.danger, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
                  Ha
                </button>
                <button type="button" onClick={() => setConfirmRemove(false)} style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60, background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
                  Yo'q
                </button>
              </form>
            )}
          </div>
        ) : (
          <RoleBadge role={m.role} />
        )}
      </div>
      {roleState?.error && <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 4 }}>{roleState.error}</div>}
      {removeState?.error && <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 4 }}>{removeState.error}</div>}
    </div>
  );
}

function SettingsView({ familyName, familySince, familySlug, members, invites, isOwner, canInvite, userEmail, updateFamilyNameAction, updateMemberRoleAction, removeMemberAction, createInviteAction, revokeInviteAction }) {
  const router = useRouter();
  return (
    <div className="fm-fade" style={{ padding: "28px clamp(16px, 5vw, 48px) 60px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Boshqaruv</div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>Sozlamalar</h1>
      </div>

      <SettingsCard title="Oila ma'lumotlari">
        {isOwner ? (
          <FamilyNameForm familySlug={familySlug} familyName={familyName} updateFamilyNameAction={updateFamilyNameAction} />
        ) : (
          <div style={{ fontSize: 14, color: TOKENS.ink }}>{familyName}</div>
        )}
        <div style={{ fontSize: 12, color: TOKENS.ink40, marginTop: 12 }}>
          {familySince ? `${familySince}-yildan buyon` : ""} · manzil: <span style={{ fontFamily: "monospace" }}>/{familySlug}</span>
        </div>
        {!isOwner && (
          <div style={{ fontSize: 12, color: TOKENS.ink40, marginTop: 8 }}>Oila nomini faqat egasi o'zgartira oladi.</div>
        )}
      </SettingsCard>

      <SettingsCard title={`Oila a'zolari (${members.length})`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {members.map((m) => (
            <MemberRow
              key={m.user_id}
              member={m}
              familySlug={familySlug}
              userEmail={userEmail}
              isOwner={isOwner}
              updateMemberRoleAction={updateMemberRoleAction}
              removeMemberAction={removeMemberAction}
            />
          ))}
        </div>
        {!isOwner && (
          <div style={{ fontSize: 12, color: TOKENS.ink40, marginTop: 14 }}>
            A'zolarning rolini faqat oila egasi o'zgartira oladi.
          </div>
        )}
      </SettingsCard>

      {canInvite && (
        <SettingsCard title="Oilaga taklif qilish">
          <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginBottom: 14, lineHeight: 1.6 }}>
            Havola yarating va oila a'zosiga yuboring. Havola bir marta ishlatiladi — u orqali qo'shilgan odam tanlangan rol bilan kiradi.
          </div>
          <CreateInviteForm familySlug={familySlug} createInviteAction={createInviteAction} onCreated={() => router.refresh()} />

          {invites.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Faol havolalar</div>
              {invites.map((inv) => (
                <InviteLinkRow key={inv.id} invite={inv} familySlug={familySlug} revokeInviteAction={revokeInviteAction} />
              ))}
            </div>
          )}
        </SettingsCard>
      )}
    </div>
  );
}

/* ---------------- Root app ---------------- */

/**
 * @param {{
 *   userName?: string,
 *   userEmail?: string,
 *   familyName?: string,
 *   familySince?: number | null,
 *   familySlug?: string,
 *   people?: any[],
 *   relationships?: any[],
 *   albums?: any[],
 *   members?: any[],
 *   invites?: any[],
 *   timelineEvents?: any[],
 *   activeAlbumId?: string | null,
 *   canEdit?: boolean,
 *   isOwner?: boolean,
 *   canInvite?: boolean,
 *   mePersonId?: string | null,
 *   initialView?: string,
 *   onLogout?: any,
 *   updateFamilyNameAction?: any,
 *   updateMemberRoleAction?: any,
 *   removeMemberAction?: any,
 *   createInviteAction?: any,
 *   revokeInviteAction?: any,
 *   addPersonAction?: any,
 *   linkPersonAction?: any,
 *   editPersonAction?: any,
 *   deletePersonAction?: any,
 *   uploadPersonPhotoAction?: any,
 *   createAlbumAction?: any,
 *   deleteAlbumAction?: any,
 *   addAlbumPageAction?: any,
 *   deleteAlbumPageAction?: any,
 *   changePageLayoutAction?: any,
 *   updatePageMetaAction?: any,
 *   updateElementTextAction?: any,
 *   uploadElementPhotoAction?: any,
 *   bulkUploadPhotosAction?: any,
 *   createTimelineEventAction?: any,
 *   updateTimelineEventAction?: any,
 *   deleteTimelineEventAction?: any,
 *   uploadTimelineEventPhotoAction?: any,
 * }} props
 */
export default function HeirloomApp({
  userName = "Foydalanuvchi",
  userEmail = "",
  familyName = "Mening oilam",
  familySince = null,
  familySlug = "",
  people = /** @type {any[]} */ ([]),
  relationships = /** @type {any[]} */ ([]),
  albums = /** @type {any[]} */ ([]),
  members = /** @type {any[]} */ ([]),
  invites = /** @type {any[]} */ ([]),
  timelineEvents = /** @type {any[]} */ ([]),
  activeAlbumId = null,
  canEdit = true,
  isOwner = false,
  canInvite = false,
  mePersonId = null,
  initialView = "dashboard",
  onLogout,
  updateFamilyNameAction,
  updateMemberRoleAction,
  removeMemberAction,
  createInviteAction,
  revokeInviteAction,
  addPersonAction,
  linkPersonAction,
  editPersonAction,
  deletePersonAction,
  uploadPersonPhotoAction,
  createAlbumAction,
  deleteAlbumAction,
  addAlbumPageAction,
  deleteAlbumPageAction,
  changePageLayoutAction,
  updatePageMetaAction,
  updateElementTextAction,
  uploadElementPhotoAction,
  bulkUploadPhotosAction,
  createTimelineEventAction,
  updateTimelineEventAction,
  deleteTimelineEventAction,
  uploadTimelineEventPhotoAction,
}) {
  const [view, setView] = useState(
    initialView === "tree" ? VIEWS.TREE
      : initialView === "albums" ? VIEWS.ALBUMS
      : initialView === "people" ? VIEWS.PEOPLE
      : initialView === "settings" ? VIEWS.SETTINGS
      : initialView === "timeline" ? VIEWS.TIMELINE
      : VIEWS.DASHBOARD
  );
  const [openAlbumId, setOpenAlbumId] = useState(null);
  // Dashboard'dagi "+ Yangi" menyusi qaysi view'da bo'lishidan qat'i nazar
  // ishlashi uchun, create modallarini root darajasida boshqaramiz.
  const [globalModal, setGlobalModal] = useState(/** @type {null | "addPerson" | "createAlbum" | "uploadPhotos" | "addEvent"} */ (null));

  const navigate = (target) => {
    if (target === VIEWS.ALBUMS) setOpenAlbumId(null);
    setView(target);
  };

  const openAlbumFromDashboard = (album) => {
    setOpenAlbumId(album.id);
    setView(VIEWS.ALBUMS);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: TOKENS.parchment, height: "100%", color: TOKENS.ink }}>
      <GlobalStyle />
      <div style={{ display: "flex", height: "100%" }}>
        <Sidebar current={view} onNavigate={navigate} onLogout={onLogout} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%" }}>
          <MobileTopBar familyName={familyName} onLogout={onLogout} />
          <main className="fm-main" style={{ flex: 1, overflow: "auto" }}>
            {view === VIEWS.DASHBOARD && (
              <DashboardView
                onNavigate={navigate}
                onOpenAlbum={openAlbumFromDashboard}
                onAddPerson={canEdit ? () => setGlobalModal("addPerson") : undefined}
                onCreateAlbum={canEdit ? () => setGlobalModal("createAlbum") : undefined}
                onUploadPhotos={canEdit ? () => setGlobalModal("uploadPhotos") : undefined}
                onAddEvent={canEdit ? () => setGlobalModal("addEvent") : undefined}
                userName={userName}
                familyName={familyName}
                familySince={familySince}
                people={people}
                relationships={relationships}
                albums={albums}
                timelineEvents={timelineEvents}
              />
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
            {view === VIEWS.ALBUMS && (
              <AlbumsView
                albums={albums}
                activeAlbumId={activeAlbumId}
                openAlbumId={openAlbumId}
                setOpenAlbumId={setOpenAlbumId}
                familySlug={familySlug}
                canEdit={canEdit}
                createAlbumAction={createAlbumAction}
                deleteAlbumAction={deleteAlbumAction}
                addAlbumPageAction={addAlbumPageAction}
                deleteAlbumPageAction={deleteAlbumPageAction}
                changePageLayoutAction={changePageLayoutAction}
                uploadElementPhotoAction={uploadElementPhotoAction}
                updateElementTextAction={updateElementTextAction}
              />
            )}
            {view === VIEWS.PEOPLE && (
              <PeopleView
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
            {view === VIEWS.TIMELINE && (
              <TimelineView
                familySlug={familySlug}
                people={people}
                timelineEvents={timelineEvents}
                canEdit={canEdit}
                createTimelineEventAction={createTimelineEventAction}
                updateTimelineEventAction={updateTimelineEventAction}
                deleteTimelineEventAction={deleteTimelineEventAction}
                uploadTimelineEventPhotoAction={uploadTimelineEventPhotoAction}
              />
            )}
            {view === VIEWS.SETTINGS && (
              <SettingsView
                familyName={familyName}
                familySince={familySince}
                familySlug={familySlug}
                members={members}
                invites={invites}
                isOwner={isOwner}
                canInvite={canInvite}
                userEmail={userEmail}
                updateFamilyNameAction={updateFamilyNameAction}
                updateMemberRoleAction={updateMemberRoleAction}
                removeMemberAction={removeMemberAction}
                createInviteAction={createInviteAction}
                revokeInviteAction={revokeInviteAction}
              />
            )}
          </main>
        </div>
      </div>
      <MobileBottomNav current={view} onNavigate={navigate} />

      {globalModal === "addPerson" && (
        <AddPersonModal
          familySlug={familySlug}
          people={people}
          relationships={relationships}
          addPersonAction={addPersonAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "createAlbum" && (
        <CreateAlbumModal
          familySlug={familySlug}
          createAlbumAction={createAlbumAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "uploadPhotos" && (
        <UploadPhotosModal
          familySlug={familySlug}
          albums={albums}
          bulkUploadPhotosAction={bulkUploadPhotosAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "addEvent" && (
        <AddTimelineEventModal
          familySlug={familySlug}
          people={people}
          createTimelineEventAction={createTimelineEventAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
    </div>
  );
}
