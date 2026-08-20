import React, { useState, useMemo } from "react";
import { BookImage, Camera, Cake, History, Search, TreePine, UserPlus } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";
import { VIEWS, SectionLabel, CreateMenu, StatItem, EmptyState, AlbumCard, buildFamilyGenerations } from "./shared";

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

export function DashboardView({ onNavigate, onOpenAlbum, onAddPerson, onCreateAlbum, onUploadPhotos, onAddEvent, onAddMemory, onAddStory, onAddPlace, userName, familyName, familySince, people, relationships, albums, timelineEvents, memories, stats }) {
  const [query, setQuery] = useState("");
  const [greeting] = useState(() => {
    const h = new Date().getHours();
    if (h < 12) return "Xayrli tong";
    if (h < 18) return "Xayrli kun";
    return "Xayrli kech";
  });

  // useMemo shartsiz, har renderda bir xil tartibda chaqirilishi SHART
  // (React Hooks qoidasi) — shuning uchun natijalar avval hisoblab olinadi,
  // keyin faqat qaysi qiymatdan (stats yoki hisoblangan) foydalanish
  // shartli ravishda tanlanadi.
  const computedGenCount = useMemo(() => buildFamilyGenerations(people, relationships).length, [people, relationships]);
  const genCount = stats?.generationsCount && stats.generationsCount > 0 ? stats.generationsCount : computedGenCount;
  const memberCount = typeof stats?.peopleCount === "number" ? stats.peopleCount : people.length;
  const albumCount = typeof stats?.albumsCount === "number" ? stats.albumsCount : albums.length;
  const computedPhotoCount = useMemo(
    () => albums.reduce((sum, a) => sum + a.pages.reduce((s, p) => s + p.elements.filter((e) => e.type === "photo" && e.photo_url).length, 0), 0),
    [albums]
  );
  const photoCount = typeof stats?.photosCount === "number" ? stats.photosCount : computedPhotoCount;
  const memoryCount = typeof stats?.memoriesCount === "number" ? stats.memoriesCount : memories?.length ?? 0;

  // On This Day — bugungi sana (oy + kun) bo'yicha xotira va voqealarni filter
  const onThisDayItems = useMemo(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const suffix = `-${mm}-${dd}`;
    const items = [];
    (memories || []).forEach((m) => {
      if (m.memory_date && String(m.memory_date).includes(suffix)) {
        items.push({ kind: "memory", id: m.id, title: m.title, subtitle: m.caption, date: m.memory_date, photo_url: m.photo_url, extra: m.location });
      }
    });
    (timelineEvents || []).forEach((ev) => {
      if (ev.event_date && String(ev.event_date).includes(suffix)) {
        items.push({ kind: "event", id: ev.id, title: ev.title, subtitle: ev.description, date: ev.event_date, photo_url: ev.photo_url, extra: ev.location });
      }
    });
    (people || []).forEach((p) => {
      if (p.birth_date && String(p.birth_date).includes(suffix)) {
        const year = new Date(p.birth_date).getFullYear();
        const age = today.getFullYear() - year;
        items.push({ kind: "birthday", id: "b-" + p.id, title: `${p.first_name}${p.last_name ? " " + p.last_name : ""} tug'ilgan kuni`, subtitle: `${age} yil bo'ldi`, date: p.birth_date, photo_url: p.profile_photo_url, extra: "" });
      }
      if (p.death_date && String(p.death_date).includes(suffix)) {
        const year = new Date(p.death_date).getFullYear();
        const years = today.getFullYear() - year;
        items.push({ kind: "death", id: "d-" + p.id, title: `${p.first_name}${p.last_name ? " " + p.last_name : ""}`, subtitle: `${years} yil avval vafot etgan`, date: p.death_date, photo_url: p.profile_photo_url, extra: "" });
      }
    });
    return items;
  }, [memories, timelineEvents, people]);

  const isTotallyEmpty = memberCount === 0 && albumCount === 0 && (timelineEvents?.length ?? 0) === 0 && memoryCount === 0;

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
          {(onCreateAlbum || onAddPerson || onUploadPhotos || onAddEvent || onAddMemory || onAddStory || onAddPlace) && <CreateMenu onCreateAlbum={onCreateAlbum} onAddPerson={onAddPerson} onUploadPhotos={onUploadPhotos} onAddEvent={onAddEvent} onAddMemory={onAddMemory} onAddStory={onAddStory} onAddPlace={onAddPlace} />}
        </div>
      </div>

      {isTotallyEmpty ? (
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
            memberCount={memberCount}
            albumCount={albumCount}
            photoCount={photoCount}
            onNavigate={onNavigate}
          />

          {onThisDayItems.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <SectionLabel eyebrow="Bugungi kun" title="Shu kunda" action="Xotiralar" onAction={() => onNavigate(VIEWS.MEMORIES)} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {onThisDayItems.slice(0, 4).map((it) => {
                  const year = it.date ? new Date(it.date).getFullYear() : "";
                  const yearsAgo = year ? new Date().getFullYear() - year : 0;
                  const accent = it.kind === "birthday" ? TOKENS.gold : it.kind === "death" ? TOKENS.ink60 : TOKENS.goldSoft;
                  const Icon = it.kind === "birthday" ? Cake : it.kind === "memory" ? Camera : History;
                  return (
                    <div
                      key={it.id}
                      onClick={() => onNavigate(it.kind === "event" ? VIEWS.TIMELINE : it.kind === "birthday" || it.kind === "death" ? VIEWS.PEOPLE : VIEWS.MEMORIES)}
                      className="fm-album-card"
                      style={{ cursor: "pointer", borderRadius: 14, overflow: "hidden", background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, display: "flex", flexDirection: "column" }}
                    >
                      <div style={{ aspectRatio: "4 / 3", background: it.photo_url ? `url(${it.photo_url}) center/cover` : TOKENS.parchment, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {!it.photo_url && <Icon size={28} color={accent} strokeWidth={1.4} />}
                      </div>
                      <div style={{ padding: "12px 14px 14px" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: TOKENS.gold, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {year} · {yearsAgo > 0 ? `${yearsAgo} yil oldin` : ""}
                        </div>
                        <div style={{ fontFamily: "Fraunces, serif", fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }}>{it.title}</div>
                        {it.subtitle && <div style={{ fontSize: 12, color: TOKENS.ink60, marginTop: 4, lineHeight: 1.4 }}>{String(it.subtitle).slice(0, 80)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section style={{ marginBottom: 48 }}>
            <SectionLabel eyebrow="Arxiv" title="So'nggi albomlar" action="Barchasi" onAction={() => onNavigate(VIEWS.ALBUMS)} />
            {albums.length === 0 ? (
              <EmptyState
                icon={<BookImage size={32} color={TOKENS.goldSoft} strokeWidth={1.4} />}
                title="Hali albomlar yaratilmagan"
                description="Oilaviy xotiralarni albomlar orqali tartiblang."
                actionLabel={onCreateAlbum ? "+ Birinchi albomni yaratish" : undefined}
                onAction={onCreateAlbum}
              />
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
              <EmptyState
                icon={<History size={32} color={TOKENS.goldSoft} strokeWidth={1.4} />}
                title="Vaqt chizig'i bo'sh"
                description="Oilingiz tarixidagi muhim voqealarni qo'shishni boshlang."
                actionLabel={onAddEvent ? "+ Voqea qo'shish" : undefined}
                onAction={onAddEvent}
              />
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
            {memberCount === 0 ? (
              <EmptyState
                icon={<TreePine size={32} color={TOKENS.goldSoft} strokeWidth={1.4} />}
                title="Oila daraxti hali yaratilmagan"
                description="Avval oila a'zolarini kiritib, ular orasidagi munosabatlarni hosil qiling."
                actionLabel={onAddPerson ? "+ Birinchi a'zoni qo'shish" : undefined}
                onAction={onAddPerson}
              />
            ) : (
              <div onClick={() => onNavigate(VIEWS.TREE)} style={{ cursor: "pointer", background: `linear-gradient(135deg, ${TOKENS.teal}, ${TOKENS.ink})`, borderRadius: 14, padding: "30px 34px", display: "flex", alignItems: "center", justifyContent: "space-between", color: TOKENS.parchment }}>
                <div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, marginBottom: 6 }}>{familyName}</div>
                  <div style={{ fontSize: 12.5, color: "rgba(242,237,226,0.7)" }}>{genCount} avlod · {memberCount} a'zo</div>
                </div>
                <TreePine size={34} color={TOKENS.goldSoft} strokeWidth={1.3} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
