import React, { useState, useMemo } from "react";
import { BookImage, Camera, Search, TreePine, UserPlus } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";
import { VIEWS, SectionLabel, CreateMenu, StatItem, EmptyState, AlbumCard, buildFamilyGenerations } from "./shared";

/**
 * Family Space'ning "shaxsiyati" — daraxt statistikasi asosida, hech qanday
 * demo son yo'q. Fon sifatida oiladagi haqiqiy rasm (birinchi topilgan album
 * muqovasi, keyin xotira, keyin voqea rasmi) ishlatiladi; hech narsa topilmasa
 * eski gradient fonga qaytadi.
 */
function FamilyHeroBanner({ familyName, familySince, genCount, memberCount, albumCount, photoCount, heroPhotoUrl, onNavigate }) {
  return (
    <div
      onClick={() => onNavigate(VIEWS.TREE)}
      style={{
        cursor: "pointer",
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        minHeight: 224,
        marginBottom: 40,
        display: "flex",
        alignItems: "flex-end",
        background: heroPhotoUrl ? `url(${heroPhotoUrl}) center/cover` : `linear-gradient(120deg, ${TOKENS.ink} 0%, ${TOKENS.teal} 130%)`,
      }}
    >
      {heroPhotoUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(0deg, rgba(30,38,33,0.90) 0%, rgba(30,38,33,0.55) 50%, rgba(30,38,33,0.18) 100%)`,
          }}
        />
      )}
      <div style={{ position: "relative", width: "100%", padding: "26px 30px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", color: TOKENS.goldSoft, fontWeight: 700, textTransform: "uppercase" }}>
            {familyName}{familySince ? ` · ${familySince} yildan beri` : ""}
          </div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 23, color: TOKENS.parchment, marginTop: 4 }}>
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

/** Kichik doiraviy avatar — rasm bo'lsa rasm, bo'lmasa ismning birinchi harfi. */
function MiniAvatar({ photoUrl, name, size = 34, ring }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        border: ring ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`,
        background: photoUrl ? undefined : TOKENS.parchmentDeep,
        backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
        display: photoUrl ? undefined : "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Fraunces, serif", fontSize: Math.round(size * 0.36), color: TOKENS.ink60,
      }}
    >
      {!photoUrl && (name?.[0]?.toUpperCase() || "?")}
    </div>
  );
}

/** Bosh sahifadagi ixcham "vidjet karta" qobig'i — sarlavha + "ko'proq" havolasi. */
function MiniWidgetShell({ title, action, onAction, children }) {
  return (
    <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", minHeight: 216 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 15.5, fontWeight: 500 }}>{title}</div>
        {onAction && (
          <span onClick={onAction} style={{ cursor: "pointer", fontSize: 11.5, color: TOKENS.gold, fontWeight: 600 }}>{action}</span>
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

/** "Vaqt chizig'i" mini-vidjeti — so'nggi voqealarning ixcham ro'yxati. */
function TimelineMiniWidget({ events, onNavigate }) {
  const items = (events || []).slice(-5).reverse();
  return (
    <MiniWidgetShell title="Vaqt chizig'i" action="Barchasi" onAction={() => onNavigate(VIEWS.TIMELINE)}>
      {items.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 12.5, color: TOKENS.ink60 }}>
          Hali voqealar yo'q
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {items.map((ev) => (
            <div key={ev.id} onClick={() => onNavigate(VIEWS.TIMELINE)} style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TOKENS.gold, flexShrink: 0, minWidth: 32 }}>
                {ev.event_date ? new Date(ev.event_date).getFullYear() : "—"}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MiniWidgetShell>
  );
}

/** "Oila daraxti" mini-vidjeti — birinchi ikki avlodning kichik preview'i. */
function FamilyTreeMiniWidget({ generations, genCount, memberCount, onNavigate }) {
  const gen0 = (generations[0]?.units || []).flatMap((u) => u.people).slice(0, 2);
  const gen1 = (generations[1]?.units || []).flatMap((u) => u.people).slice(0, 4);

  return (
    <MiniWidgetShell title="Oila daraxti" action="Ochish" onAction={() => onNavigate(VIEWS.TREE)}>
      {memberCount === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 12.5, color: TOKENS.ink60 }}>
          Hali a'zolar yo'q
        </div>
      ) : (
        <div onClick={() => onNavigate(VIEWS.TREE)} style={{ cursor: "pointer", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9 }}>
          {gen0.length > 0 && (
            <div style={{ display: "flex", gap: 10 }}>
              {gen0.map((p) => <MiniAvatar key={p.id} photoUrl={p.photoUrl} name={p.name} />)}
            </div>
          )}
          {gen0.length > 0 && gen1.length > 0 && <div style={{ width: 1, height: 14, background: TOKENS.parchmentDeep }} />}
          {gen1.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {gen1.map((p) => <MiniAvatar key={p.id} photoUrl={p.photoUrl} name={p.name} size={30} />)}
            </div>
          )}
          <div style={{ fontSize: 11.5, color: TOKENS.ink60, marginTop: 4 }}>{genCount} avlod · {memberCount} a'zo</div>
        </div>
      )}
    </MiniWidgetShell>
  );
}

/** "Bugungi xotira" mini-vidjeti — bugungi kunga to'g'ri keluvchi xotira bo'lsa shu, bo'lmasa eng so'nggi xotira. */
function TodayMemoryWidget({ item, isOnThisDay, onNavigate, onAddMemory }) {
  const yearsAgo = useMemo(() => {
    if (!item?.date) return 0;
    const y = new Date(item.date).getFullYear();
    return y ? new Date().getFullYear() - y : 0;
  }, [item]);

  return (
    <MiniWidgetShell title="Bugungi xotira">
      {!item ? (
        <div
          onClick={onAddMemory}
          style={{ cursor: onAddMemory ? "pointer" : "default", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 12.5, color: TOKENS.ink60 }}
        >
          Hali xotiralar yo'q
        </div>
      ) : (
        <div onClick={() => onNavigate(VIEWS.MEMORIES)} style={{ cursor: "pointer", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              flex: 1, minHeight: 82, borderRadius: 10,
              background: item.photo_url ? `url(${item.photo_url}) center/cover` : TOKENS.parchment,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {!item.photo_url && <Camera size={26} color={TOKENS.goldSoft} strokeWidth={1.4} />}
          </div>
          <div>
            {isOnThisDay && yearsAgo > 0 && (
              <div style={{ fontSize: 10.5, fontWeight: 700, color: TOKENS.gold, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                {yearsAgo} yil oldin
              </div>
            )}
            <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
          </div>
        </div>
      )}
    </MiniWidgetShell>
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
  const generations = useMemo(() => buildFamilyGenerations(people, relationships), [people, relationships]);
  const genCount = stats?.generationsCount && stats.generationsCount > 0 ? stats.generationsCount : generations.length;
  const memberCount = typeof stats?.peopleCount === "number" ? stats.peopleCount : people.length;
  const albumCount = typeof stats?.albumsCount === "number" ? stats.albumsCount : albums.length;
  const computedPhotoCount = useMemo(
    () => albums.reduce((sum, a) => sum + a.pages.reduce((s, p) => s + p.elements.filter((e) => e.type === "photo" && e.photo_url).length, 0), 0),
    [albums]
  );
  const photoCount = typeof stats?.photosCount === "number" ? stats.photosCount : computedPhotoCount;
  const memoryCount = typeof stats?.memoriesCount === "number" ? stats.memoriesCount : memories?.length ?? 0;

  // Hero banner foni — birinchi topilgan haqiqiy rasm: album muqovasi →
  // xotira rasmi → voqea rasmi. Hech narsa topilmasa komponent o'zi
  // gradient fonga tushadi.
  const heroPhotoUrl = useMemo(() => {
    const albumWithCover = albums.find((a) => a.cover_url);
    if (albumWithCover) return albumWithCover.cover_url;
    const memoryWithPhoto = (memories || []).find((m) => m.photo_url);
    if (memoryWithPhoto) return memoryWithPhoto.photo_url;
    const eventWithPhoto = (timelineEvents || []).find((ev) => ev.photo_url);
    if (eventWithPhoto) return eventWithPhoto.photo_url;
    return null;
  }, [albums, memories, timelineEvents]);

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

  // "Bugungi xotira" vidjeti uchun: avval shu kunga to'g'ri keluvchi voqea,
  // bo'lmasa eng so'nggi qo'shilgan xotira (fallback).
  const todayMemoryItem = useMemo(() => {
    if (onThisDayItems.length > 0) return onThisDayItems[0];
    const latest = (memories || [])[memories.length - 1];
    if (!latest) return null;
    return { kind: "memory", id: latest.id, title: latest.title, subtitle: latest.caption, date: latest.memory_date, photo_url: latest.photo_url };
  }, [onThisDayItems, memories]);

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
          <FamilyHeroBanner
            familyName={familyName}
            familySince={familySince}
            genCount={genCount}
            memberCount={memberCount}
            albumCount={albumCount}
            photoCount={photoCount}
            heroPhotoUrl={heroPhotoUrl}
            onNavigate={onNavigate}
          />

          <section style={{ marginBottom: 40 }}>
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

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            <TimelineMiniWidget events={timelineEvents} onNavigate={onNavigate} />
            <FamilyTreeMiniWidget generations={generations} genCount={genCount} memberCount={memberCount} onNavigate={onNavigate} />
            <TodayMemoryWidget item={todayMemoryItem} isOnThisDay={onThisDayItems.length > 0} onNavigate={onNavigate} onAddMemory={onAddMemory} />
          </section>
        </>
      )}
    </div>
  );
}
