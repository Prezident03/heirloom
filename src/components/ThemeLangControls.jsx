"use client";

import React, { useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { applyThemeMode } from "@/lib/uiTokens";
import { LANGS, t } from "@/lib/i18n";
import { useLang } from "./LangProvider";

// html[data-theme-mode] o'zgarishini kuzatish — rejim boshqa joyda
// almashtirilsa ham barcha tugmalar bir xil holatda turadi.
function subscribe(cb) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-theme-mode"] });
  return () => mo.disconnect();
}
const readMode = () => document.documentElement.getAttribute("data-theme-mode") || "system";
const readDark = () => document.documentElement.getAttribute("data-theme") === "dark";

export function useThemeMode() {
  const mode = useSyncExternalStore(subscribe, readMode, () => "system");
  const dark = useSyncExternalStore(subscribe, readDark, () => false);
  return { mode, dark, setMode: applyThemeMode };
}

/** Bir bosishda kunduzgi ⇄ tungi. */
export function ThemeToggle({ color, size = 17, style, className }) {
  const { dark, setMode } = useThemeMode();
  const label = dark ? t("Kunduzgi rejim") : t("Tungi rejim");
  return (
    <button
      type="button"
      className={className}
      onClick={() => setMode(dark ? "light" : "dark")}
      title={label}
      aria-label={label}
      style={{ background: "none", border: "none", color, cursor: "pointer", padding: 6, display: "flex", alignItems: "center", gap: 10, font: "inherit", ...style }}
    >
      {dark ? <Sun size={size} /> : <Moon size={size} />}
      {className ? label : null}
    </button>
  );
}

/** Ixcham til tanlagich: UZ · RU · EN. */
export function LangSwitch({ color, activeColor, style, compact = false }) {
  const { lang, changeLang } = useLang();
  if (compact) {
    // Telefonda joy tejash: bitta tugma, bosilganda keyingi til.
    const i = LANGS.findIndex((l) => l.id === lang);
    const next = LANGS[(i + 1) % LANGS.length];
    return (
      <button type="button" onClick={() => changeLang(next.id)} title={`${t("Til")}: ${LANGS[i].name} → ${next.name}`}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: activeColor, ...style }}>
        {LANGS[i].short}
      </button>
    );
  }
  return (
    <div role="group" aria-label={t("Til")} style={{ display: "flex", gap: 2, ...style }}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => changeLang(l.id)}
          title={l.name}
          aria-pressed={lang === l.id}
          style={{
            background: lang === l.id ? "rgba(184,134,59,0.22)" : "none",
            border: "none",
            borderRadius: 6,
            padding: "4px 7px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.4,
            cursor: "pointer",
            color: lang === l.id ? activeColor : color,
          }}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

const MODES = [
  { id: "light", icon: Sun, label: "Kunduzgi" },
  { id: "dark", icon: Moon, label: "Tungi" },
  { id: "system", icon: Monitor, label: "Tizim bo'yicha" },
];

/** Sozlamalar sahifasi uchun to'liq tanlov. */
export function AppearanceSettings({ tokens }) {
  const { mode, setMode } = useThemeMode();
  const { lang, changeLang } = useLang();
  const T = tokens;
  const chip = (active) => ({
    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, cursor: "pointer",
    border: `1px solid ${active ? T.gold : T.parchmentDeep}`,
    background: active ? `color-mix(in srgb, ${T.gold} 14%, transparent)` : T.card,
    color: T.ink, fontSize: 13, fontWeight: 600,
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink60, marginBottom: 8 }}>{t("Rejim")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MODES.map((m) => (
            <button key={m.id} type="button" style={chip(mode === m.id)} onClick={() => setMode(m.id)} aria-pressed={mode === m.id}>
              <m.icon size={16} /> {t(m.label)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink60, marginBottom: 8 }}>{t("Til")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LANGS.map((l) => (
            <button key={l.id} type="button" style={chip(lang === l.id)} onClick={() => changeLang(l.id)} aria-pressed={lang === l.id}>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>{l.short}</span> {l.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
