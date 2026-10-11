"use client";

import React, { useState, useEffect, useRef, useActionState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { BookImage, Plus, X, ImagePlus, Loader2 } from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { AlbumCard } from "./shared";
import Editor from "./album-editor/Editor";

// ============================================================
// Albomlar ro'yxati, yaratish/yuklash oynalari va Album Editor'ga kirish.
// Editorning o'zi `./album-editor/` papkasida.
// ============================================================

function EmptyAlbums({ onCreate }) {
  return (
    <div style={{ maxWidth: 460, margin: "80px auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BookImage size={24} color="#fff" />
      </div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, margin: "0 0 8px" }}>Hali albom yo&apos;q</h2>
      <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 22px" }}>
        Birinchi xotirangizni saqlang — sayohat, oilaviy kun, yoki shunchaki oddiy bir lahza.
      </p>
      <button onClick={onCreate} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
        <Plus size={15} /> Birinchi albomni yaratish
      </button>
    </div>
  );
}

export function CreateAlbumModal({ familySlug, createAlbumAction, onClose, onCreated }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAlbumAction, undefined);
  const handledRef = useRef(null);

  useEffect(() => {
    if (state?.ok && state.albumId && onCreated && handledRef.current !== state) {
      handledRef.current = state;
      startTransition(() => router.refresh());
      onCreated(state.albumId);
      onClose();
    }
  }, [state, onCreated, onClose, router]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="fm-panel-enter" style={{ width: "100%", maxWidth: 440, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>Yangi albom</h2>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          {onCreated && <input type="hidden" name="skipRedirect" value="1" />}
          <input name="title" placeholder="Albom nomi (masalan: Sangardak 2026)" required style={inputStyle} autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <input name="dateLabel" placeholder="Sana (masalan: May 2026)" style={inputStyle} />
            <input name="location" placeholder="Joy (ixtiyoriy)" style={inputStyle} />
          </div>
          <textarea name="description" placeholder="Qisqacha tavsif (ixtiyoriy)" rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
          {state?.error && <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>{state.error}</div>}
          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Yaratilmoqda..." : "Yaratish va shablon tanlash"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function UploadPhotosModal({ familySlug, albums, bulkUploadPhotosAction, onClose }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(bulkUploadPhotosAction, undefined);
  const [target, setTarget] = useState(albums.length > 0 ? "existing" : "new");
  const [albumId, setAlbumId] = useState(albums[0]?.id || "");
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [fileCount, setFileCount] = useState(0);

  // Muvaffaqiyatli yuklangandan keyin: server ma'lumotini yangilash
  // (router.refresh()) va modalni yopish — aks holda o'zgarish faqat
  // F5'dan keyin ko'rinardi (redirect() bir xil URL'ga bo'lgani uchun
  // hech narsa qilmasdi).
  useEffect(() => {
    if (state?.ok) {
      startTransition(() => router.refresh());
      onClose();
    }
  }, [state, router, onClose]);

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

function AlbumGrid({ albums, onOpen, canEdit, createAlbumAction, familySlug, onCreated, coverControl }) {
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
            <AlbumCard key={a.id} album={a} onClick={() => onOpen(a)} coverControl={coverControl} />
          ))}
        </div>
      )}

      {showCreate && <CreateAlbumModal familySlug={familySlug} createAlbumAction={createAlbumAction} onCreated={onCreated} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

export function AlbumsView({
  albums,
  openAlbumId,
  setOpenAlbumId,
  familySlug,
  canEdit,
  photos,
  media,
  createAlbumAction,
  deleteAlbumAction,
  renameAlbumAction,
  saveAlbumAction,
  registerMediaAction,
  setAlbumCoverAction,
  newAlbumId,
}) {
  const openAlbum = albums.find((a) => a.id === openAlbumId) || null;

  if (openAlbumId && !openAlbum) {
    // Yangi yaratilgan albom server ma'lumotida hali paydo bo'lmagan bo'lishi mumkin.
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: TOKENS.ink60 }}>
        <Loader2 size={18} className="fm-spin" /> Albom ochilmoqda…
      </div>
    );
  }

  return (
    <div className="fm-fade" style={{ height: "100%", overflow: "auto" }}>
      {openAlbum && (
        <Editor
          key={openAlbum.id}
          album={openAlbum}
          familySlug={familySlug}
          canEdit={canEdit}
          photos={photos}
          media={media}
          saveAlbumAction={saveAlbumAction}
          renameAlbumAction={renameAlbumAction}
          deleteAlbumAction={deleteAlbumAction}
          registerMediaAction={registerMediaAction}
          initialPanel={newAlbumId === openAlbum.id ? "templates" : null}
          onBack={() => setOpenAlbumId(null)}
        />
      )}
      <AlbumGrid
        albums={albums}
        onOpen={(a) => setOpenAlbumId(a.id)}
        canEdit={canEdit}
        createAlbumAction={createAlbumAction}
        familySlug={familySlug}
        onCreated={(id) => setOpenAlbumId(id, { isNew: true })}
        coverControl={canEdit && setAlbumCoverAction ? { familySlug, action: setAlbumCoverAction, sources: { albums, photos, media } } : null}
      />
    </div>
  );
}
