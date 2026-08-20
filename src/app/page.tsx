export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamiliesForUser } from "@/lib/family";
import { TOKENS, FONT_IMPORT } from "@/lib/uiTokens";
import {
  TreePine, BookImage, History, Camera, BookOpen, Users, MapPinned, ShieldCheck,
} from "lucide-react";

const FEATURES = [
  { icon: TreePine, title: "Oila daraxti", desc: "Avlodlarni bog'lang, qarindoshlik aloqalarini ko'ring va oilangiz tarixini bir joyda saqlang." },
  { icon: BookImage, title: "Albomlar va Scrapbook", desc: "Rasmlaringizdan erkin joylashuvli, jonli albom sahifalari yarating — xuddi qog'oz albom kabi." },
  { icon: History, title: "Vaqt chizig'i", desc: "Oilangizning muhim voqealarini xronologik tartibda — tug'ilishdan bugungi kungacha." },
  { icon: Camera, title: "Xotiralar", desc: "\"Bugun necha yil oldin\" — har kuni eslatiladigan qadrli lahzalar." },
  { icon: BookOpen, title: "Hikoyalar", desc: "Oilangizning tarixini, rivoyatlarini va an'analarini yozma shaklda saqlang." },
  { icon: Users, title: "Odamlar", desc: "Har bir oila a'zosi uchun alohida profil — surat, ma'lumot va bog'liqliklar bilan." },
  { icon: MapPinned, title: "Joylar", desc: "Oilangizga tegishli joylarni xaritada belgilang — uylar, shaharlar, sayohatlar." },
  { icon: ShieldCheck, title: "Maxfiylik va ulashish", desc: "Faqat siz taklif qilgan oila a'zolari kira oladi — to'liq nazorat sizda." },
];

export default async function Home() {
  let session = null;
  try {
    session = await getSession();
  } catch {}
  if (session) {
    try {
      const families = await getFamiliesForUser(session.id);
      redirect(families.length > 0 ? `/${families[0].slug}/dashboard` : "/onboarding");
    } catch {
      try {
        const { destroySession } = await import("@/lib/session");
        await destroySession();
      } catch {}
    }
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: TOKENS.parchment,
        fontFamily: "Inter, sans-serif",
        color: TOKENS.ink,
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
        .fm-feature-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
        }
        @media (max-width: 640px) {
          .fm-feature-grid { grid-template-columns: 1fr; }
        }
        .fm-feature-card {
          background: ${TOKENS.card}; border: 1px solid ${TOKENS.parchmentDeep}; border-radius: 14px;
          padding: 20px; display: flex; gap: 14px; align-items: flex-start;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .fm-feature-card:hover { box-shadow: 0 8px 24px rgba(30,38,33,0.08); transform: translateY(-1px); }
      `}</style>

      {/* Hero */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 20px 56px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})` }} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 600 }}>Heirloom</span>
        </div>

        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 42, fontWeight: 500, lineHeight: 1.15, margin: "0 0 16px", maxWidth: 620 }}>
          Your family. Your memories. Your story.
        </h1>
        <p style={{ fontSize: 16, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 34px", maxWidth: 560 }}>
          Heirloom — oilaviy xotiralarni, avlodlar ketma-ketligini va hayotdagi muhim lahzalarni saqlash uchun mo'ljallangan raqamli platforma. Xususiy, xavfsiz va abadiy.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/register" className="fm-cta-primary">Bepul boshlash</Link>
          <Link href="/login" className="fm-cta-secondary">Kirish</Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px 90px" }}>
        <div className="fm-feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="fm-feature-card">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: TOKENS.parchment, border: `1px solid ${TOKENS.parchmentDeep}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <f.icon size={18} color={TOKENS.teal} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: TOKENS.ink, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12.5, color: TOKENS.ink60, lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

