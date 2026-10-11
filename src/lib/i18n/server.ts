import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang, translate, type Lang } from "./index";

export async function getLangFromCookies(): Promise<Lang> {
  return normalizeLang((await cookies()).get(LANG_COOKIE)?.value);
}

/** Server komponentlar uchun: so'rovning tiliga bog'langan t(). */
export async function getT() {
  const lang = await getLangFromCookies();
  return (text: string | null | undefined, vars?: Record<string, string | number>) => translate(lang, text, vars);
}
