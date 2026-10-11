"use client";

import React, { useState } from "react";
import { Share2, Link2, Copy, Check, Loader2, Send, Eye } from "lucide-react";
import { PopButton, C } from "./ui";
import { t } from "@/lib/i18n";

/** Albomni faqat ko'rish uchun havola orqali ulashish. */
export function SharePopover({ album, familySlug, shareAlbumAction }) {
  const [token, setToken] = useState(album.share_token || null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const link = token && typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : "";
  // Do'stlarga yuboriladigan tayyor xabar: nom, chaqiriq va ostida havola.
  const invite = t("\"{0}\" albomimizni tomosha qiling 👇", { 0: album.title });
  const message = `${invite}\n${link}`;

  const toggle = async (enabled) => {
    setBusy(true);
    setError("");
    try {
      const res = await shareAlbumAction(familySlug, album.id, enabled);
      if (res?.error) throw new Error(res.error);
      setToken(res?.token || null);
    } catch (e) {
      setError(e.message || t("Ulashishni sozlab bo'lmadi."));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    try { await navigator.share({ title: album.title, text: invite, url: link }); } catch { /* bekor qilindi */ }
  };

  return (
    <PopButton className="he-btn" icon={<Share2 size={16} />} label={<span className="he-hide-sm">{t("Ulashish")}</span>} title={t("Albomni ulashish")} width={340} align="end">
      <div style={{ padding: 4 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, marginBottom: 4 }}>{t("Albomni ulashish")}</div>
        <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>
          {t("Havolaga ega har kim albomni varaqlab ko'ra oladi, lekin uni o'zgartira olmaydi. Ro'yxatdan o'tish shart emas.")}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "color-mix(in srgb, var(--he-ink) 5%, transparent)", cursor: busy ? "default" : "pointer", marginBottom: 12 }}>
          <Link2 size={16} color={token ? C.gold : C.muted} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{t("Havola orqali ko'rish")}</span>
          {busy ? <Loader2 size={16} className="he-spin" /> : (
            <input type="checkbox" checked={!!token} onChange={(e) => toggle(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.gold, cursor: "pointer" }} aria-label={t("Havola orqali ulashish")} />
          )}
        </label>

        {token && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input className="he-input" readOnly value={link} onFocus={(e) => e.currentTarget.select()} style={{ fontSize: 12 }} aria-label={t("Ulashish havolasi")} />
              <button type="button" className="he-btn primary" style={{ flexShrink: 0 }} onClick={copy}>
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? t("Nusxalandi") : t("Nusxa")}
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, background: "color-mix(in srgb, var(--he-ink) 5%, transparent)", borderRadius: 8, padding: "8px 10px", marginBottom: 8, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {t(message)}
            </div>
            <a
              className="he-btn soft"
              style={{ width: "100%", textDecoration: "none", marginBottom: 6 }}
              href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(invite)}`}
              target="_blank"
              rel="noreferrer"
            >
              <Send size={15} /> {t("Telegram orqali yuborish")}
            </a>
            <div style={{ display: "flex", gap: 6 }}>
              {typeof navigator !== "undefined" && navigator.share && (
                <button type="button" className="he-btn soft" style={{ flex: 1 }} onClick={nativeShare}><Send size={15} /> {t("Yuborish")}</button>
              )}
              <a className="he-btn soft" style={{ flex: 1, textDecoration: "none" }} href={link} target="_blank" rel="noreferrer"><Eye size={15} /> {t("Ochib ko'rish")}</a>
            </div>
            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 10, lineHeight: 1.45 }}>
              {t("Ulashishni o'chirsangiz, havola darhol ishlamay qoladi. Qayta yoqilsa, yangi havola yaratiladi.")}
            </div>
          </>
        )}
        {error && <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>{t(error)}</div>}
      </div>
    </PopButton>
  );
}
