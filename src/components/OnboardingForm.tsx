"use client";

import { useActionState } from "react";
import { TOKENS, FONT_IMPORT } from "@/lib/uiTokens";
import { createFamilyAction, type ActionState } from "@/lib/actions";

export default function OnboardingForm({ userName }: { userName: string }) {
  const [state, formAction, pending] = useActionState(createFamilyAction, undefined);

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
        .fm-input {
          width: 100%;
          padding: 13px 14px;
          border-radius: 8px;
          border: 1px solid ${TOKENS.parchmentDeep};
          background: #fff;
          font-size: 15px;
          font-family: "Fraunces", serif;
          color: ${TOKENS.ink};
          outline: none;
        }
        .fm-input:focus { border-color: ${TOKENS.gold}; }
        .fm-submit {
          width: 100%;
          background: ${TOKENS.ink};
          color: ${TOKENS.parchment};
          border: none;
          border-radius: 8px;
          padding: 13px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .fm-submit:disabled { opacity: 0.6; cursor: default; }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: TOKENS.card,
          borderRadius: 18,
          padding: "44px 38px",
          border: `1px solid ${TOKENS.parchmentDeep}`,
          boxShadow: "0 24px 60px rgba(30,38,33,0.12)",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 22 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})` }} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600 }}>Heirloom</span>
        </div>

        <div style={{ fontSize: 12, letterSpacing: "0.12em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>
          Xush kelibsiz, {userName}
        </div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 27, fontWeight: 500, margin: "0 0 10px" }}>
          Oilangiz hikoyasini quring
        </h1>
        <p style={{ fontSize: 13.5, color: TOKENS.ink60, margin: "0 0 28px", lineHeight: 1.6 }}>
          Bu — sizning shaxsiy, xususiy oilaviy arxivingiz. Boshlash uchun oilangizga bir nom bering.
        </p>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input className="fm-input" type="text" name="familyName" placeholder="masalan, Zokirov oilasi" required autoFocus />

          {state?.error && (
            <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
              {state.error}
            </div>
          )}

          <button type="submit" className="fm-submit" disabled={pending}>
            {pending ? "Yaratilmoqda..." : "Family Space yaratish"}
          </button>
        </form>
      </div>
    </div>
  );
}
