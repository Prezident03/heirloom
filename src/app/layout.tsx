import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { cookies } from "next/headers";
import { THEME_CSS, THEME_INIT_SCRIPT } from "@/lib/uiTokens";
import { LANG_COOKIE, normalizeLang } from "@/lib/i18n";
import { LangProvider } from "@/components/LangProvider";
import { PublicControls } from "@/components/ThemeLangControls";

export const metadata: Metadata = {
  title: "Heirloom — Your family. Your memories. Your story.",
  description: "Digital family memory platform — albums, family tree, timeline and stories, all in one private place.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = normalizeLang((await cookies()).get(LANG_COOKIE)?.value);
  return (
    <html lang={lang} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="h-full">
        <LangProvider initialLang={lang}>
          {children}
          <PublicControls />
        </LangProvider>
      </body>
    </html>
  );
}
