"use client";

import React, { useEffect, useRef, useState, startTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Upload, Images, RotateCcw, X, Loader2 } from "lucide-react";
import { TOKENS } from "@/lib/uiTokens";
import { ImageCropper, MAX_SOURCE_BYTES } from "./AvatarCropper";

// ============================================================
// Muqova tanlash: burchakdagi "⋯" menyusi → yuklash / mavjud rasmdan
// tanlash / avtomatik holatga qaytarish. Tanlangan rasm kesish
// oynasida kerakli nisbatda (banner 4:1, albom 4:3) qirqiladi.
// ============================================================

function MenuItem({ icon: Icon, children, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", border: "none", background: "transparent", borderRadius: 8, cursor: "pointer", fontSize: 13, color: danger ? TOKENS.danger : TOKENS.ink, textAlign: "left", fontFamily: "Inter, sans-serif" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(30,38,33,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={15} /> {children}
    </button>
  );
}

function LibraryPicker({ items, onPick, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 190, background: "rgba(20,25,21,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: TOKENS.card, borderRadius: 16, width: "min(640px, 100%)", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 70px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px" }}>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: 19 }}>Rasmni tanlang</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: "0 18px 18px" }}>
          {items.length === 0 ? (
            <div style={{ padding: "40px 10px", textAlign: "center", color: TOKENS.ink60, fontSize: 13 }}>Hali rasmlar yo&apos;q. Kompyuterdan yuklab ko&apos;ring.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
              {items.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => onPick(url)}
                  style={{ aspectRatio: "1", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, padding: 0, cursor: "pointer", backgroundImage: `url("${url}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: TOKENS.parchment }}
                  aria-label="Shu rasmni tanlash"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * kind: "family" | "album"
 * action: setFamilyCoverAction yoki setAlbumCoverAction
 * library: tanlash uchun rasm manzillari ro'yxati
 */
export function CoverMenu({ kind, familySlug, albumId, action, library = [], isCustom, onError, light = true }) {
  const router = useRouter();
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [picking, setPicking] = useState(false);
  const [source, setSource] = useState(null); // { file } yoki { src }
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const aspect = kind === "family" ? 4 : 4 / 3;
  const outputWidth = kind === "family" ? 2400 : 1200;
  const title = kind === "family" ? "Banner rasmini joylashtiring" : "Albom muqovasini joylashtiring";

  useEffect(() => {
    if (!open) return undefined;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 250) });
    const onDown = (e) => { if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    return () => { document.removeEventListener("pointerdown", onDown, true); window.removeEventListener("scroll", onScroll, true); };
  }, [open]);

  const report = (msg) => { setErr(msg || ""); onError?.(msg || null); };

  const submit = async (fields) => {
    const fd = new FormData();
    fd.set("familySlug", familySlug);
    if (albumId) fd.set("albumId", albumId);
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
    const res = await action(undefined, fd);
    if (res?.error) throw new Error(res.error);
    startTransition(() => router.refresh());
  };

  const onCropped = async (file) => {
    setSaving(true);
    try {
      await submit({ photo: file });
      setSource(null);
      report(null);
    } catch (e) {
      report(e.message || "Saqlab bo'lmadi.");
    } finally {
      setSaving(false);
    }
  };

  const applyOriginal = async (url) => {
    setSaving(true);
    try {
      await submit({ url });
      setSource(null);
      report(null);
    } catch (e) {
      report(e.message || "Saqlab bo'lmadi.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setOpen(false);
    setBusy(true);
    try { await submit({ reset: "1" }); report(null); } catch (e) { report(e.message); } finally { setBusy(false); }
  };

  const stop = (e) => { e.stopPropagation(); };

  return (
    <div onClick={stop} onPointerDown={stop} style={{ position: "absolute", top: 10, right: 10, zIndex: 3 }}>
      <button
        ref={btnRef}
        type="button"
        title="Muqovani o'zgartirish"
        aria-label="Muqovani o'zgartirish"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: light ? "rgba(20,25,21,0.45)" : "rgba(255,255,255,0.9)",
          color: light ? "#fff" : TOKENS.ink,
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {busy ? <Loader2 size={16} className="fm-spin" /> : <MoreHorizontal size={17} />}
      </button>
      {err && !source && (
        <div style={{ position: "absolute", right: 0, top: 38, width: 220, background: TOKENS.card, color: TOKENS.danger, fontSize: 12, padding: "8px 10px", borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
          {err}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,.avif,.webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (f.size > MAX_SOURCE_BYTES) { report("Rasm hajmi 60MB dan oshmasligi kerak."); return; }
          report(null);
          setSource({ file: f });
        }}
      />
      {open && pos && createPortal(
        <div
          ref={menuRef}
          onClick={stop}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: 250, zIndex: 180, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 12, padding: 6, boxShadow: "0 12px 32px rgba(30,26,15,0.2)" }}
        >
          <MenuItem icon={Upload} onClick={() => { setOpen(false); inputRef.current?.click(); }}>Kompyuterdan yuklash</MenuItem>
          <MenuItem icon={Images} onClick={() => { setOpen(false); setPicking(true); }}>Mavjud rasmlardan tanlash</MenuItem>
          {(kind === "family" || isCustom) && (
            <MenuItem icon={RotateCcw} onClick={reset}>Avtomatik rasmga qaytarish</MenuItem>
          )}
        </div>,
        document.body
      )}
      {picking && (
        <LibraryPicker
          items={library}
          onClose={() => setPicking(false)}
          onPick={(url) => { setPicking(false); setSource({ src: url }); }}
        />
      )}
      {source && (
        <ImageCropper
          file={source.file}
          src={source.src}
          shape="rect"
          aspect={aspect}
          outputWidth={outputWidth}
          title={title}
          saving={saving}
          onCancel={() => { if (!saving) { setSource(null); report(null); } }}
          onConfirm={onCropped}
          onUseOriginal={source.src ? () => applyOriginal(source.src) : undefined}
          externalError={err}
        />
      )}
    </div>
  );
}
