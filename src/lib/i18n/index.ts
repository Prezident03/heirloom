// ============================================================
// Platforma tili: o'zbek (asosiy), rus, ingliz.
//
// Kalit sifatida o'zbekcha matnning o'zi ishlatiladi: t("Albomlar").
// Tarjima topilmasa, o'zbekcha matn chiqadi — hech narsa buzilmaydi.
// Joriy til modul darajasida saqlanadi; LangProvider uni har renderda
// o'rnatadi va til almashganda butun ilovani qayta chizadi.
// ============================================================
import { RU } from "./ru";
import { EN } from "./en";

export type Lang = "uz" | "ru" | "en";
export const LANGS: { id: Lang; name: string; short: string }[] = [
  { id: "uz", name: "O'zbekcha", short: "UZ" },
  { id: "ru", name: "Русский", short: "RU" },
  { id: "en", name: "English", short: "EN" },
];
export const LANG_COOKIE = "heirloom-lang";

const DICTS: Record<Lang, Record<string, string> | null> = { uz: null, ru: RU, en: EN };

let current: Lang = "uz";

export function normalizeLang(v: unknown): Lang {
  return v === "ru" || v === "en" ? v : "uz";
}

export function setLang(lang: Lang) {
  current = normalizeLang(lang);
}

export function getLang(): Lang {
  return current;
}

/** Tarjima. `vars` — {name} ko'rinishidagi o'rinbosarlar. */
export function t(text: string | null | undefined, vars?: Record<string, string | number>): string {
  return translate(current, text, vars);
}

export function translate(lang: Lang, text: string | null | undefined, vars?: Record<string, string | number>): string {
  if (text == null) return "";
  const s = String(text);
  const dict = DICTS[lang];
  let out = (dict && dict[s]) || s;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

/** Sana/oy nomlari uchun brauzer locale kodi. */
export function localeCode(): string {
  return current === "ru" ? "ru-RU" : current === "en" ? "en-GB" : "uz-UZ";
}
