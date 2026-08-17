export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSession } from "@/lib/session";
import { getInviteByCode, getMembership } from "@/lib/family";
import { sql } from "@/lib/db";
import { TOKENS, FONT_IMPORT } from "@/lib/uiTokens";
import { acceptInviteFormAction } from "@/lib/actions";

const ROLE_LABELS: Record<string, string> = {
  owner: "Egasi",
  editor: "Muharrir",
  member: "A'zo",
  viewer: "Kuzatuvchi",
};

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await getSession();
  const invite = await getInviteByCode(code);

  let familyName: string | null = null;
  let familySlug: string | null = null;
  let alreadyMember = false;
  let statusMessage: string | null = null;

  if (invite) {
    const rows = (await sql`SELECT name, slug FROM families WHERE id = ${invite.family_id}`) as { name: string; slug: string }[];
    familyName = rows[0]?.name ?? null;
    familySlug = rows[0]?.slug ?? null;

    if (invite.revoked_at) statusMessage = "Bu taklif havolasi bekor qilingan.";
    else if (invite.used_at) statusMessage = "Bu taklif havolasi allaqachon ishlatilgan.";

    if (session) {
      const membership = await getMembership(invite.family_id, session.id);
      if (membership) alreadyMember = true;
    }
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
      <style>{`${FONT_IMPORT} * { box-sizing: border-box; }`}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: TOKENS.card,
          borderRadius: 16,
          padding: "36px 32px",
          border: `1px solid ${TOKENS.parchmentDeep}`,
          boxShadow: "0 20px 50px rgba(30,38,33,0.10)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 10 }}>🌿</div>

        {!invite || !familyName ? (
          <>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 500, margin: "0 0 10px" }}>Taklif topilmadi</h1>
            <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6 }}>Bu havola noto'g'ri yoki muddati o'tgan bo'lishi mumkin.</p>
          </>
        ) : statusMessage ? (
          <>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 500, margin: "0 0 10px" }}>{familyName}</h1>
            <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6 }}>{statusMessage}</p>
          </>
        ) : alreadyMember ? (
          <>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 500, margin: "0 0 10px" }}>{familyName}</h1>
            <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6, marginBottom: 20 }}>Siz allaqachon bu oila a'zosisiz.</p>
            <Link
              href={`/${familySlug}/dashboard`}
              style={{ display: "inline-block", background: TOKENS.ink, color: TOKENS.parchment, borderRadius: 8, padding: "12px 22px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
            >
              Dashboard'ga o'tish
            </Link>
          </>
        ) : session ? (
          <>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 500, margin: "0 0 6px" }}>{familyName}</h1>
            <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6, marginBottom: 20 }}>
              Sizni <b>{ROLE_LABELS[invite.role] || invite.role}</b> sifatida shu oilaga qo'shilishga taklif qilishdi.
            </p>
            <form action={acceptInviteFormAction}>
              <input type="hidden" name="code" value={code} />
              <button
                type="submit"
                style={{ width: "100%", background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Qo'shilish
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 500, margin: "0 0 6px" }}>{familyName}</h1>
            <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6, marginBottom: 20 }}>
              Sizni shu oilaga qo'shilishga taklif qilishdi. Davom etish uchun kiring yoki hisob yarating.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href={`/login?invite=${code}`}
                style={{ flex: 1, background: TOKENS.ink, color: TOKENS.parchment, borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
              >
                Kirish
              </Link>
              <Link
                href={`/register?invite=${code}`}
                style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
              >
                Ro'yxatdan o'tish
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
