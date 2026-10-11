"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { setLang, normalizeLang, LANG_COOKIE } from "@/lib/i18n";

const LangContext = createContext({ lang: "uz", changeLang: () => {} });

// Til almashganda ilova qayta yaratiladi; shu belgi orqali ochiq bo'lim
// (masalan, Sozlamalar) saqlanib qoladi.
let justSwitched = false;
export function consumeLangSwitch() {
  const v = justSwitched;
  justSwitched = false;
  return v;
}

/**
 * Tilni butun ilovaga tarqatadi. Til almashganda cookie yoziladi (server
 * keyingi so'rovlarda shu tilda chizadi) va ilova qayta chiziladi.
 */
export function LangProvider({ initialLang, children }) {
  const router = useRouter();
  const [lang, setLangState] = useState(normalizeLang(initialLang));
  setLang(lang); // bolalar render bo'lishidan oldin

  const changeLang = useCallback((next) => {
    const l = normalizeLang(next);
    setLang(l);
    justSwitched = true;
    try {
      document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      document.documentElement.lang = l;
    } catch { /* ignore */ }
    setLangState(l);
    router.refresh();
  }, [router]);

  return (
    <LangContext.Provider value={{ lang, changeLang }}>
      <React.Fragment key={lang}>{children}</React.Fragment>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
