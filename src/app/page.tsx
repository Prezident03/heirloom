export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamiliesForUser } from "@/lib/family";
import { TOKENS, FONT_IMPORT } from "@/lib/uiTokens";

export default async function Home() {
  const session = await getSession();
  if (session) {
    const families = await getFamiliesForUser(session.id);
    redirect(families.length > 0 ? `/${families[0].slug}/dashboard` : "/onboarding");
  }

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: TOKENS.parchment,
        fontFamily: "Inter, sans-serif",
        color: TOKENS.ink,
        padding: 20,
      }}
    >
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        .fm-cta-primary {
          background: ${TOKENS.ink}; color: ${TOKENS.parchment}; border: none;
          border-radius: 10px; padding: 13px 26px; font-size: 14px; font-weight: 600;
          cursor: pointer; text-decoration: none; display: inline-block;
        }
        .fm-cta-secondary {
          background: transparent; color: ${TOKENS.ink}; border: 1px solid ${TOKENS.parchmentDeep};
          border-radius: 10px; padding: 13px 26px; font-size: 14px; font-weight: 600;
          cursor: pointer; text-decoration: none; display: inline-block;
        }
      `}</style>

      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})` }} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 600 }}>Heirloom</span>
        </div>

        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 42, fontWeight: 500, lineHeight: 1.15, margin: "0 0 16px" }}>
          Your family. Your memories. Your story.
        </h1>
        <p style={{ fontSize: 16, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 34px" }}>
          Rasmlar shunchaki suratlar emas — ular xotiralar, odamlar va hikoyalar. Oilangizning raqamli arxivini shu yerda quring — xususiy, xavfsiz va abadiy.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/register" className="fm-cta-primary">Bepul boshlash</Link>
          <Link href="/login" className="fm-cta-secondary">Kirish</Link>
        </div>
      </div>
    </div>
  );
}
