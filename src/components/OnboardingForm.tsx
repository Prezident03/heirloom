"use client";

import { useActionState, useEffect, useState } from "react";
import { TOKENS, FONT_IMPORT } from "@/lib/uiTokens";
import { createFamilyAction, addPersonAction, createAlbumAction } from "@/lib/actions";

const STEP_COUNT = 4;

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 26 }}>
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 22 : 7,
            height: 7,
            borderRadius: 4,
            background: i <= step ? TOKENS.gold : TOKENS.parchmentDeep,
            transition: "all 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
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
          font-size: 14.5px;
          font-family: "Fraunces", serif;
          color: ${TOKENS.ink};
          outline: none;
          transition: border-color 0.2s;
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
          text-align: center;
          text-decoration: none;
          display: block;
          transition: opacity 0.2s;
        }
        .fm-submit:hover { opacity: 0.9; }
        .fm-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .fm-skip {
          width: 100%;
          background: none;
          border: none;
          color: ${TOKENS.ink60};
          font-size: 12.5px;
          font-weight: 600;
          padding: 12px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .fm-skip:hover { color: ${TOKENS.ink}; }
        .fm-step-enter { animation: fm-step-in 0.3s ease; }
        @keyframes fm-step-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: TOKENS.card,
          borderRadius: 18,
          padding: "40px 38px",
          border: `1px solid ${TOKENS.parchmentDeep}`,
          boxShadow: "0 24px 60px rgba(30,38,33,0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 22 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})` }} />
          <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 600 }}>Heirloom</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function StepFamilyName({
  userName,
  onDone,
}: {
  userName: string;
  onDone: (slug: string, mePersonId: string, familyName: string) => void;
}) {
  const [state, formAction, pending] = useActionState(createFamilyAction, undefined);
  const [name, setName] = useState("");

  useEffect(() => {
    if (state?.ok && state.familySlug) {
      onDone(state.familySlug, state.mePersonId || "", state.familyName || name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fm-step-enter" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.12em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>
        Xush kelibsiz, {userName}
      </div>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 500, margin: "0 0 10px" }}>
        Oilangiz hikoyasini quring
      </h1>
      <p style={{ fontSize: 13.5, color: TOKENS.ink60, margin: "0 0 26px", lineHeight: 1.6 }}>
        Bu — sizning shaxsiy, xususiy oilaviy arxivingiz. Tayyor namuna yo&apos;q — hammasini o&apos;zingiz qurasiz. Boshlash uchun oilangizga bir nom bering.
      </p>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          className="fm-input"
          type="text"
          name="familyName"
          placeholder="masalan, Zokirov oilasi"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {state?.error && (
          <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
            {state.error}
          </div>
        )}
        <button type="submit" className="fm-submit" disabled={pending}>
          {pending ? "Yaratilmoqda..." : "Davom etish"}
        </button>
      </form>
    </div>
  );
}

function StepAddMember({
  familySlug,
  mePersonId,
  onNext,
}: {
  familySlug: string;
  mePersonId: string;
  onNext: () => void;
}) {
  const [state, formAction, pending] = useActionState(addPersonAction, undefined);
  const [relation, setRelation] = useState("none");

  useEffect(() => {
    if (state?.ok) onNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fm-step-enter">
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 500, margin: "0 0 8px", textAlign: "center" }}>
        Birinchi oila a&apos;zosini qo&apos;shing
      </h2>
      <p style={{ fontSize: 13, color: TOKENS.ink60, margin: "0 0 22px", textAlign: "center", lineHeight: 1.6 }}>
        Masalan, turmush o&apos;rtog&apos;ingiz yoki farzandingiz. Buni istalgan vaqtda Oila daraxtidan ham qilishingiz mumkin.
      </p>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="skipRedirect" value="1" />
        <div style={{ display: "flex", gap: 10 }}>
          <input className="fm-input" name="firstName" placeholder="Ism" required />
          <input className="fm-input" name="lastName" placeholder="Familiya" />
        </div>
        <select
          className="fm-input"
          name="relationType"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <option value="none">Bog&apos;lanish (ixtiyoriy)</option>
          <option value="spouse_of">Turmush o&apos;rtog&apos;im</option>
          <option value="child_of">Farzandim</option>
        </select>
        {relation !== "none" && <input type="hidden" name="relatedPersonId" value={mePersonId} />}
        {state?.error && (
          <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
            {state.error}
          </div>
        )}
        <button type="submit" className="fm-submit" disabled={pending}>
          {pending ? "Qo'shilmoqda..." : "Qo'shish va davom etish"}
        </button>
      </form>
      <button type="button" className="fm-skip" onClick={onNext}>
        Hozircha o&apos;tkazib yuborish
      </button>
    </div>
  );
}

function StepCreateAlbum({ familySlug, onNext }: { familySlug: string; onNext: () => void }) {
  const [state, formAction, pending] = useActionState(createAlbumAction, undefined);

  useEffect(() => {
    if (state?.ok) onNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fm-step-enter">
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 21, fontWeight: 500, margin: "0 0 8px", textAlign: "center" }}>
        Birinchi albomingizni yarating
      </h2>
      <p style={{ fontSize: 13, color: TOKENS.ink60, margin: "0 0 22px", textAlign: "center", lineHeight: 1.6 }}>
        Sayohat, oilaviy kun, yoki shunchaki oddiy bir lahza. Rasmlarni keyinroq ham qo&apos;shishingiz mumkin.
      </p>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="skipRedirect" value="1" />
        <input className="fm-input" name="title" placeholder="Albom nomi (masalan: 2026 — Parij)" required autoFocus />
        <div style={{ display: "flex", gap: 10 }}>
          <input className="fm-input" name="dateLabel" placeholder="Sana (ixtiyoriy)" />
          <input className="fm-input" name="location" placeholder="Joy (ixtiyoriy)" />
        </div>
        {state?.error && (
          <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
            {state.error}
          </div>
        )}
        <button type="submit" className="fm-submit" disabled={pending}>
          {pending ? "Yaratilmoqda..." : "Yaratish va davom etish"}
        </button>
      </form>
      <button type="button" className="fm-skip" onClick={onNext}>
        Hozircha o&apos;tkazib yuborish
      </button>
    </div>
  );
}

function StepDone({ familyName, familySlug }: { familyName: string; familySlug: string }) {
  return (
    <div className="fm-step-enter" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>❤️</div>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 23, fontWeight: 500, margin: "0 0 10px" }}>
        {familyName || "Oilangiz"} hikoyasi boshlandi
      </h2>
      <p style={{ fontSize: 13.5, color: TOKENS.ink60, margin: "0 0 26px", lineHeight: 1.6 }}>
        Bundan buyog&apos;i — sizning qo&apos;lingizda. Har bir yangi rasm, har bir yangi ism bu hikoyani davom ettiradi.
      </p>
      <a href={`/${familySlug}/dashboard`} className="fm-submit">
        Family Space&apos;ga o&apos;tish
      </a>
    </div>
  );
}

export default function OnboardingForm({ userName }: { userName: string }) {
  const [step, setStep] = useState(0);
  const [familySlug, setFamilySlug] = useState("");
  const [mePersonId, setMePersonId] = useState("");
  const [familyName, setFamilyName] = useState("");

  return (
    <Shell>
      <ProgressDots step={step} />
      {step === 0 && (
        <StepFamilyName
          userName={userName}
          onDone={(slug, personId, name) => {
            setFamilySlug(slug);
            setMePersonId(personId);
            setFamilyName(name);
            setStep(1);
          }}
        />
      )}
      {step === 1 && <StepAddMember familySlug={familySlug} mePersonId={mePersonId} onNext={() => setStep(2)} />}
      {step === 2 && <StepCreateAlbum familySlug={familySlug} onNext={() => setStep(3)} />}
      {step === 3 && <StepDone familyName={familyName} familySlug={familySlug} />}
    </Shell>
  );
}