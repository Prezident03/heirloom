"use client";

import { useActionState } from "react";
import { TOKENS, FONT_IMPORT } from "@/lib/uiTokens";
import type { ActionState } from "@/lib/actions";

type Field = { name: string; label: string; type: string; placeholder: string };

export default function AuthForm({
  action,
  fields,
  submitLabel,
  title,
  subtitle,
  footer,
  hiddenFields = [],
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Field[];
  submitLabel: string;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  hiddenFields?: { name: string; value: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

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
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid ${TOKENS.parchmentDeep};
          background: #fff;
          font-size: 14px;
          font-family: Inter, sans-serif;
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
        .fm-auth-link { color: ${TOKENS.teal}; font-weight: 600; text-decoration: none; }
        .fm-auth-link:hover { color: ${TOKENS.gold}; }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: TOKENS.card,
          borderRadius: 16,
          padding: "38px 34px",
          border: `1px solid ${TOKENS.parchmentDeep}`,
          boxShadow: "0 20px 50px rgba(30,38,33,0.10)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 26 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})` }} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600 }}>Heirloom</span>
        </div>

        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 25, fontWeight: 500, margin: "0 0 6px" }}>{title}</h1>
        <p style={{ fontSize: 13, color: TOKENS.ink60, margin: "0 0 24px" }}>{subtitle}</p>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {hiddenFields.map((f) => (
            <input key={f.name} type="hidden" name={f.name} value={f.value} />
          ))}
          {fields.map((f) => (
            <div key={f.name}>
              <label style={{ fontSize: 12, fontWeight: 600, color: TOKENS.ink60, marginBottom: 6, display: "block" }}>{f.label}</label>
              <input className="fm-input" type={f.type} name={f.name} placeholder={f.placeholder} required />
            </div>
          ))}

          {state?.error && (
            <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
              {state.error}
            </div>
          )}

          <button type="submit" className="fm-submit" disabled={pending}>
            {pending ? "Iltimos kuting..." : submitLabel}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 13, color: TOKENS.ink60, textAlign: "center" }}>{footer}</div>
      </div>
    </div>
  );
}
