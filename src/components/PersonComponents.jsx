import React, { useState, useRef, useEffect, useMemo, useActionState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, MapPinned, ChevronLeft, TreePine, Plus, Camera, Search, Users, Heart, Baby } from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { personLabel, personYears, relationLabelBetween } from "@/lib/relationshipLabels";
import { AvatarCropper, MAX_SOURCE_BYTES } from "./AvatarCropper";
import { t } from "@/lib/i18n";

/* ---------------- Profile photo upload (small inline form + camera button) ---------------- */

export function PhotoUploadButton({ familySlug, personId, uploadPersonPhotoAction, onError }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_SOURCE_BYTES) { onError?.(t("Rasm hajmi 60MB dan oshmasligi kerak.")); return; }
    onError?.(null);
    setFile(f);
  };

  const save = async (cropped) => {
    setSaving(true);
    const fd = new FormData();
    fd.set("familySlug", familySlug);
    fd.set("personId", personId);
    fd.set("photo", cropped);
    try {
      const res = await uploadPersonPhotoAction(undefined, fd);
      if (res?.error) { onError?.(res.error); return; }
      setFile(null);
      startTransition(() => router.refresh());
    } catch {
      onError?.(t("Rasm yuklashda xato yuz berdi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,.avif,.webp"
        style={{ display: "none" }}
        onChange={pick}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={saving}
        title={t("Profil rasmini yuklash")}
        style={{
          position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%",
          background: TOKENS.ink, border: `2px solid ${TOKENS.card}`, color: TOKENS.parchment,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: saving ? "default" : "pointer",
          opacity: saving ? 0.6 : 1,
        }}
      >
        <Camera size={13} />
      </button>
      {file && (
        <AvatarCropper
          file={file}
          saving={saving}
          onCancel={() => { if (!saving) setFile(null); }}
          onConfirm={save}
        />
      )}
    </>
  );
}

/* ---------------- Delete person confirm (useActionState orqali to'g'ri chaqiriladi) ---------------- */

export function DeletePersonConfirm({ familySlug, personId, deletePersonAction, onCancel }) {
  const [state, formAction, pending] = useActionState(deletePersonAction, undefined);

  return (
    <div style={{ marginTop: 10, padding: 12, background: "rgba(168,69,58,0.08)", borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: TOKENS.danger, marginBottom: 10 }}>
        {t("Rostdan ham o'chirasizmi? Bog'lanishlari ham o'chadi. Bu amalni ortga qaytarib bo'lmaydi.")}
      </div>
      {state?.error && (
        <div style={{ fontSize: 11.5, color: TOKENS.danger, marginBottom: 8 }}>{t(state.error)}</div>
      )}
      <form action={formAction} style={{ display: "flex", gap: 8 }}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="personId" value={personId} />
        <button type="submit" disabled={pending} style={{ flex: 1, background: TOKENS.danger, color: "#fff", border: "none", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
          {pending ? t("O'chirilmoqda...") : t("Ha, o'chirish")}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} style={{ flex: 1, background: "transparent", color: TOKENS.ink60, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          {t("Bekor qilish")}
        </button>
      </form>
    </div>
  );
}

/**
 * O'ng tomondagi odam profili paneli — Family Tree va People (Odamlar)
 * ko'rinishlarida bir xil ishlatiladi, shuning uchun alohida komponent.
 */
export function PersonDetailPanel({
  selected,
  people = [],
  relationships = [],
  mePersonId,
  relationToMe,
  canEdit,
  familySlug,
  uploadPersonPhotoAction,
  photoError,
  setPhotoError,
  onSelectRelated,
  onClose,
  onEdit,
  onLink,
  confirmDelete,
  setConfirmDelete,
  deletePersonAction,
}) {
  const [activeTab, setActiveTab] = useState("about");

  const relatedParents = useMemo(
    () => getParentsOf(selected.id, people, relationships),
    [selected.id, people, relationships]
  );
  const relatedSpouse = useMemo(
    () => getSpouseOf(selected.id, people, relationships),
    [selected.id, people, relationships]
  );
  const relatedChildren = useMemo(
    () => getChildrenOf(selected.id, people, relationships),
    [selected.id, people, relationships]
  );

  const tabs = [
    { id: "about", label: "Ma'lumot" },
    { id: "memories", label: "Xotiralar" },
    { id: "albums", label: "Albomlar" },
    { id: "events", label: "Voqealar" },
  ];

  return (
    <div className="fm-panel-enter" style={{ width: "min(380px, 100%)", flex: "0 0 min(380px, 100%)", background: TOKENS.card, borderLeft: `1px solid ${TOKENS.parchmentDeep}`, padding: "24px 22px", overflow: "auto", maxHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 4 }}><X size={18} /></button>
      </div>

      <div style={{ position: "relative", width: 84, height: 84, margin: "6px auto 16px" }}>
        <div
          style={{
            width: 84, height: 84, borderRadius: "50%",
            background: selected.photoUrl ? undefined : TOKENS.parchmentDeep,
            backgroundImage: selected.photoUrl ? `url(${selected.photoUrl})` : undefined,
            backgroundSize: "cover", backgroundPosition: "center",
            border: `3px solid ${TOKENS.parchmentDeep}`,
            display: selected.photoUrl ? undefined : "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Fraunces, serif", fontSize: 28, color: TOKENS.ink60,
          }}
        >
          {!selected.photoUrl && (selected.name?.[0]?.toUpperCase() || "?")}
        </div>
        {canEdit && uploadPersonPhotoAction && (
          <PhotoUploadButton
            familySlug={familySlug}
            personId={selected.id}
            uploadPersonPhotoAction={uploadPersonPhotoAction}
            onError={setPhotoError}
          />
        )}
      </div>

      {photoError && (
        <div style={{ fontSize: 11, color: TOKENS.danger, textAlign: "center", marginBottom: 10, padding: "6px 10px", background: "rgba(168,69,58,0.08)", borderRadius: 6 }}>
          {photoError}
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500 }}>{selected.name}</div>
        {selected.years && <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Calendar size={12} /> {selected.years}</div>}
        {selected.id === mePersonId ? (
          <div style={{ fontSize: 11, fontWeight: 600, color: TOKENS.gold, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Bu — sizsiz")}</div>
        ) : relationToMe ? (
          <div style={{ fontSize: 11.5, color: TOKENS.teal, marginTop: 6, fontWeight: 600 }}>{t("Sizga:")} {relationToMe}</div>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, marginTop: 12, borderBottom: `1px solid ${TOKENS.parchmentDeep}`, overflowX: "auto" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "8px 9px",
              borderRadius: "8px 8px 0 0",
              background: activeTab === tab.id ? TOKENS.ink : "transparent",
              color: activeTab === tab.id ? TOKENS.parchment : TOKENS.ink60,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              borderBottom: activeTab === tab.id ? "none" : `2px solid transparent`,
            }}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {activeTab === "about" && (
        <div>
          <div style={{ fontSize: 12.5, color: TOKENS.ink60, lineHeight: 1.6, marginBottom: 14 }}>
            {selected.biography || t("Bu odam haqida hali biografiya qo'shilmagan.")}
          </div>
          {selected.raw?.birth_place && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: TOKENS.ink60, marginBottom: 8 }}>
              <MapPinned size={14} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>{t("Tug'ilgan joy:")} {selected.raw.birth_place}</div>
            </div>
          )}
          {selected.raw?.gender && (
            <div style={{ fontSize: 12, color: TOKENS.ink60, marginBottom: 14 }}>
              {t("Jinsi:")} {selected.raw.gender === "male" ? t("Erkak") : selected.raw.gender === "female" ? t("Ayol") : t("Boshqa")}
            </div>
          )}

          <RelatedPersonGroup icon={Users} label={t("Ota-onasi")} people={relatedParents} onSelectRelated={onSelectRelated} />
          <RelatedPersonGroup icon={Heart} label={t("Turmush o'rtog'i")} people={relatedSpouse ? [relatedSpouse] : []} onSelectRelated={onSelectRelated} />
          <RelatedPersonGroup icon={Baby} label={t("Farzandlari")} people={relatedChildren} onSelectRelated={onSelectRelated} />
        </div>
      )}

      {activeTab === "memories" && (
        <div style={{ fontSize: 12.5, color: TOKENS.ink60 }}>
          {t("Bu odam bilan bog'langan xotiralar hali ko'rsatilmadi. Keyingi update'da bo'ladi.")}
        </div>
      )}

      {activeTab === "albums" && (
        <div style={{ fontSize: 12.5, color: TOKENS.ink60 }}>
          {t("Bu odam ishtirok etgan albomlar hali ko'rsatilmadi. Keyingi update'da bo'ladi.")}
        </div>
      )}

      {activeTab === "events" && (
        <div style={{ fontSize: 12.5, color: TOKENS.ink60 }}>
          {t("Bu odam bilan bog'langan voqealar hali ko'rsatilmadi. Keyingi update'da bo'ladi.")}
        </div>
      )}

      {canEdit && (
        <>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={onEdit} style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {t("Tahrirlash")}
            </button>
            <button onClick={onLink} style={{ flex: 1, background: "transparent", color: TOKENS.ink, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {t("Bog'lash")}
            </button>
          </div>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ marginTop: 10, width: "100%", background: "transparent", color: TOKENS.danger, border: `1px solid ${TOKENS.danger}`, borderRadius: 8, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {t("O'chirish")}
            </button>
          ) : (
            <DeletePersonConfirm
              familySlug={familySlug}
              personId={selected.id}
              deletePersonAction={deletePersonAction}
              onCancel={() => setConfirmDelete(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export function EmptyFamilyTree({ familyName, canEdit, onAddPerson }) {
  return (
    <div className="fm-fade" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <TreePine size={26} color={TOKENS.gold} strokeWidth={1.4} />
        </div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 500, margin: "0 0 8px" }}>{familyName} {t("— oila daraxti hali bo'sh")}</h1>
        <p style={{ fontSize: 13.5, color: TOKENS.ink60, lineHeight: 1.6, margin: "0 0 24px" }}>
          {t("Hech qanday tayyor namuna yo'q — hikoyangizni o'zingizdan boshlang. Birinchi odam sifatida odatda o'zingizni qo'shasiz, keyin ota-onangiz, farzandlaringiz yoki turmush o'rtog'ingizni bog'laysiz.")}
        </p>
        {canEdit ? (
          <button onClick={onAddPerson} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> {t("Birinchi odamni qo'shish")}
          </button>
        ) : (
          <div style={{ fontSize: 12.5, color: TOKENS.ink40 }}>{t("Odam qo'shish uchun ruxsatingiz yo'q.")}</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Add Person modal ---------------- */

// Mockupdagi "Kimni qo'shmoqchisiz?" menyusi — har bir tugma tanlanganda
// relationType, tegishli savol matni va jinsni oldindan belgilaydi.
// "grandparent_of" — front-end'ga xos maxsus tur: submit paytida avtomatik
// "parent_of" + tegishli oraliq ota-ona ID'siga aylantiriladi (backend'da
// alohida grandparent tushunchasi yo'q, shunga hojat ham yo'q).
const RELATION_OPTIONS = [
  { key: "father", emoji: "👨", label: "Ota", relationType: "parent_of", gender: "male", question: "Kimning otasi bo'ladi?" },
  { key: "mother", emoji: "👩", label: "Ona", relationType: "parent_of", gender: "female", question: "Kimning onasi bo'ladi?" },
  { key: "son", emoji: "👦", label: "O'g'il", relationType: "child_of", gender: "male", question: "Kimning o'g'li bo'ladi?" },
  { key: "daughter", emoji: "👧", label: "Qiz", relationType: "child_of", gender: "female", question: "Kimning qizi bo'ladi?" },
  { key: "spouse", emoji: "💍", label: "Turmush o'rtog'i", relationType: "spouse_of", gender: "", question: "Kimning turmush o'rtog'i bo'ladi?" },
  { key: "grandfather", emoji: "👴", label: "Bobo", relationType: "grandparent_of", gender: "male", question: "Kimning bobosi bo'ladi?" },
  { key: "grandmother", emoji: "👵", label: "Buvi", relationType: "grandparent_of", gender: "female", question: "Kimning buvisi bo'ladi?" },
  { key: "other", emoji: "👤", label: "Boshqa / Aloqasiz", relationType: "none", gender: "", question: "" },
];

/** relatedPersonId'ning (nevarasi) hozirgi ota-onalarini qaytaradi — bobo/buvini
 * shu ota-onalardan biriga "parent_of" sifatida ulash uchun ishlatiladi. */
export function getParentsOf(personId, people, relationships) {
  return relationships
    .filter((r) => r.type === "parent" && r.person_b_id === personId)
    .map((r) => people.find((p) => p.id === r.person_a_id))
    .filter(Boolean);
}

/** personId'ning farzandlarini qaytaradi. */
export function getChildrenOf(personId, people, relationships) {
  return relationships
    .filter((r) => r.type === "parent" && r.person_a_id === personId)
    .map((r) => people.find((p) => p.id === r.person_b_id))
    .filter(Boolean);
}

/** personId'ning turmush o'rtog'ini (bo'lsa) qaytaradi. */
export function getSpouseOf(personId, people, relationships) {
  const rel = relationships.find(
    (r) => r.type === "spouse" && (r.person_a_id === personId || r.person_b_id === personId)
  );
  if (!rel) return null;
  const spouseId = rel.person_a_id === personId ? rel.person_b_id : rel.person_a_id;
  return people.find((p) => p.id === spouseId) || null;
}

/** PersonDetailPanel "Ma'lumot" tabidagi bosiladigan qarindoshlar ro'yxati
 * (Ota-onasi / Turmush o'rtog'i / Farzandlari) — har birini bosish
 * onSelectRelated(personId) orqali o'sha odamga o'tkazadi. */
export function RelatedPersonGroup({ icon: Icon, label, people: relatedPeople, onSelectRelated }) {
  if (!relatedPeople || relatedPeople.length === 0) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: TOKENS.ink40, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        <Icon size={12} /> {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {relatedPeople.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectRelated?.(p.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textAlign: "left",
              background: "transparent",
              border: "none",
              borderRadius: 6,
              padding: "5px 6px",
              cursor: onSelectRelated ? "pointer" : "default",
              fontSize: 12.5,
              color: TOKENS.ink,
            }}
            onMouseEnter={(e) => onSelectRelated && (e.currentTarget.style.background = TOKENS.parchment)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div
              style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: p.profile_photo_url ? undefined : TOKENS.parchmentDeep,
                backgroundImage: p.profile_photo_url ? `url(${p.profile_photo_url})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                display: p.profile_photo_url ? undefined : "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: TOKENS.ink60, fontFamily: "Fraunces, serif",
              }}
            >
              {!p.profile_photo_url && (personLabel(p)?.[0]?.toUpperCase() || "?")}
            </div>
            {personLabel(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AddPersonModal({ familySlug, people, relationships = [], addPersonAction, onClose }) {
  const [state, formAction, pending] = useActionState(addPersonAction, undefined);
  // Odam allaqachon mavjud bo'lsa, avval "kimni qo'shmoqchisiz" menyusini
  // ko'rsatamiz; aks holda (birinchi odam) to'g'ridan-to'g'ri forma.
  const [step, setStep] = useState(people.length > 0 ? "pick" : "form");
  const [chosen, setChosen] = useState(/** @type {typeof RELATION_OPTIONS[number] | null} */ (null));
  // Bobo/Buvi oqimi uchun: avval nevarasi tanlanadi, keyin (agar ikki
  // ota-onasi bo'lsa) qaysi tomondan ekani tanlanadi.
  const [grandchildId, setGrandchildId] = useState("");
  const [throughParentId, setThroughParentId] = useState("");

  const selectRelation = (opt) => {
    setChosen(opt);
    setGrandchildId("");
    setThroughParentId("");
    setStep("form");
  };

  const isGrandparent = chosen?.relationType === "grandparent_of";
  const grandchildParents = isGrandparent && grandchildId ? getParentsOf(grandchildId, people, relationships) : [];

  // Bitta ota-ona bo'lsa, avtomatik shu orqali ulanadi; ikkitasi bo'lsa —
  // foydalanuvchi tanlaydi; sizni yo'q bo'lsa — submit bloklanadi (pastda).
  const effectiveThroughParentId =
    grandchildParents.length === 1 ? grandchildParents[0].id : throughParentId;

  // Backend'ga yuboriladigan haqiqiy qiymatlar: bobo/buvi uchun bu doim
  // standart "parent_of" + oraliq ota-onaning ID'si.
  const submitRelationType = isGrandparent ? (effectiveThroughParentId ? "parent_of" : "") : (chosen ? chosen.relationType : "none");
  const submitRelatedPersonId = isGrandparent ? effectiveThroughParentId : undefined;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fm-panel-enter"
        style={{ width: "100%", maxWidth: 440, maxHeight: "88vh", overflow: "auto", background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {step === "form" && people.length > 0 && (
              <button
                type="button"
                onClick={() => setStep("pick")}
                style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40, padding: 4, display: "flex" }}
                title={t("Orqaga")}
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>
              {step === "pick" ? t("Kimni qo'shmoqchisiz?") : chosen ? t("Yangi odam — {0}", { 0: chosen.label }) : t("Yangi odam qo'shish")}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>

        {step === "pick" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {RELATION_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => selectRelation(opt)}
                className="fm-relation-option"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderRadius: 10, border: `1px solid ${TOKENS.parchmentDeep}`, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: TOKENS.ink, textAlign: "left" }}
              >
                <span style={{ fontSize: 19, lineHeight: 1 }}>{opt.emoji}</span> {t(opt.label)}
              </button>
            ))}
          </div>
        ) : (
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="hidden" name="familySlug" value={familySlug} />
            <input type="hidden" name="relationType" value={submitRelationType} />
            {submitRelatedPersonId !== undefined && <input type="hidden" name="relatedPersonId" value={submitRelatedPersonId} />}

            {isGrandparent ? (
              <>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60 }}>{t(chosen.question)}</div>
                <select value={grandchildId} onChange={(e) => { setGrandchildId(e.target.value); setThroughParentId(""); }} required style={inputStyle}>
                  <option value="" disabled>{t("Odamni tanlang")}</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{personLabel(p)}</option>
                  ))}
                </select>

                {grandchildId && grandchildParents.length === 0 && (
                  <div style={{ fontSize: 12, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6, lineHeight: 1.5 }}>
                    {t("Bu odamning hali ota-onasi daraxtga qo'shilmagan. Avval otasini yoki onasini qo'shing, keyin bobo/buvini shu orqali qo'sha olasiz.")}
                  </div>
                )}

                {grandchildId && grandchildParents.length === 1 && (
                  <div style={{ fontSize: 12, color: TOKENS.ink60 }}>
                    {personLabel(grandchildParents[0])} {t("orqali qo'shiladi.")}
                  </div>
                )}

                {grandchildId && grandchildParents.length >= 2 && (
                  <>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60 }}>{t("Qaysi tomondan?")}</div>
                    <select value={throughParentId} onChange={(e) => setThroughParentId(e.target.value)} required style={inputStyle}>
                      <option value="" disabled>{t("Ota-onani tanlang")}</option>
                      {grandchildParents.map((p) => (
                        <option key={p.id} value={p.id}>{personLabel(p)} {t("tomonidan")}</option>
                      ))}
                    </select>
                  </>
                )}
              </>
            ) : (
              chosen && chosen.relationType !== "none" && (
                <>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60 }}>{t(chosen.question)}</div>
                  <select name="relatedPersonId" defaultValue="" required style={inputStyle}>
                    <option value="" disabled>{t("Odamni tanlang")}</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>{personLabel(p)}</option>
                    ))}
                  </select>
                </>
              )
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <input name="firstName" placeholder={t("Ism")} required className="fm-modal-input" style={inputStyle} />
              <input name="lastName" placeholder={t("Familiya")} className="fm-modal-input" style={inputStyle} />
            </div>

            <select name="gender" defaultValue={chosen?.gender || ""} style={inputStyle}>
              <option value="">{t("Jinsi (ixtiyoriy)")}</option>
              <option value="female">{t("Ayol")}</option>
              <option value="male">{t("Erkak")}</option>
              <option value="other">{t("Boshqa")}</option>
            </select>

            <div style={{ display: "flex", gap: 10 }}>
              <input name="birthDate" placeholder={t("Tug'ilgan yil (masalan, 1980)")} style={inputStyle} />
              <input name="deathDate" placeholder={t("Vafot yili (agar bo'lsa)")} style={inputStyle} />
            </div>

            <textarea name="biography" placeholder={t("Qisqacha hikoya yoki biografiya (ixtiyoriy)")} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />

            {state?.error && (
              <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
                {t(state.error)}
              </div>
            )}

            <button
              type="submit"
              disabled={pending || (isGrandparent && !effectiveThroughParentId)}
              style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending || (isGrandparent && !effectiveThroughParentId) ? 0.6 : 1 }}
            >
              {pending ? t("Saqlanmoqda...") : t("Qo'shish")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Edit Person modal ---------------- */

export function EditPersonModal({ familySlug, person, editPersonAction, onClose }) {
  const [state, formAction, pending] = useActionState(editPersonAction, undefined);
  // `person` bu yerda daraxt uchun formatlangan obyekt (name/years), shuning
  // uchun asl ism/familiya/sana qiymatlarini uning `name`/`years`idan emas,
  // balki alohida saqlangan xom maydonlaridan olamiz (agar mavjud bo'lsa).
  const raw = person.raw || {};

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 55, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fm-panel-enter"
        style={{ width: "100%", maxWidth: 440, maxHeight: "88vh", overflow: "auto", background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 500, margin: 0 }}>{t("Ma'lumotlarni tahrirlash")}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input type="hidden" name="personId" value={person.id} />

          <div style={{ display: "flex", gap: 10 }}>
            <input name="firstName" placeholder={t("Ism")} defaultValue={raw.first_name || ""} required className="fm-modal-input" style={inputStyle} />
            <input name="lastName" placeholder={t("Familiya")} defaultValue={raw.last_name || ""} className="fm-modal-input" style={inputStyle} />
          </div>

          <select name="gender" defaultValue={raw.gender || ""} style={inputStyle}>
            <option value="">{t("Jinsi (ixtiyoriy)")}</option>
            <option value="female">{t("Ayol")}</option>
            <option value="male">{t("Erkak")}</option>
            <option value="other">{t("Boshqa")}</option>
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <input name="birthDate" placeholder={t("Tug'ilgan yil")} defaultValue={raw.birth_date || ""} style={inputStyle} />
            <input name="deathDate" placeholder={t("Vafot yili (agar bo'lsa)")} defaultValue={raw.death_date || ""} style={inputStyle} />
          </div>

          <textarea name="biography" placeholder={t("Qisqacha hikoya yoki biografiya")} defaultValue={raw.biography || ""} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />

          {state?.error && (
            <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
              {t(state.error)}
            </div>
          )}

          <button type="submit" disabled={pending} style={{ marginTop: 6, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
            {pending ? t("Saqlanmoqda...") : t("Saqlash")}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Link two existing people ---------------- */

export function LinkPersonModal({ familySlug, person, people, linkPersonAction, onClose }) {
  const [state, formAction, pending] = useActionState(linkPersonAction, undefined);
  const otherPeople = people.filter((p) => p.id !== person.id);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(30,38,33,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fm-panel-enter"
        style={{ width: "100%", maxWidth: 420, background: TOKENS.card, borderRadius: 16, padding: "26px 26px 24px", border: `1px solid ${TOKENS.parchmentDeep}`, boxShadow: "0 30px 70px rgba(30,38,33,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 19, fontWeight: 500, margin: 0 }}>{t("Bog'lash")}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: TOKENS.ink40 }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12.5, color: TOKENS.ink60, margin: "0 0 18px" }}>
          <strong>{person.name}</strong>{t("ni boshqa mavjud odamga bog'lang.")}
        </p>

        {otherPeople.length === 0 ? (
          <div style={{ fontSize: 12.5, color: TOKENS.ink40 }}>{t("Bog'lash uchun boshqa odam yo'q. Avval yana birortasini qo'shing.")}</div>
        ) : (
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="hidden" name="familySlug" value={familySlug} />
            <input type="hidden" name="personId" value={person.id} />

            <select name="otherPersonId" defaultValue="" required style={inputStyle}>
              <option value="" disabled>{t("Odamni tanlang")}</option>
              {otherPeople.map((p) => (
                <option key={p.id} value={p.id}>{personLabel(p)}</option>
              ))}
            </select>

            <select name="relationType" defaultValue="" required style={inputStyle}>
              <option value="" disabled>{t("Bog'lanish turi")}</option>
              <option value="other_is_parent">{t("Tanlangan odam —")} {person.name}{t("ning ota-onasi")}</option>
              <option value="other_is_child">{t("Tanlangan odam —")} {person.name}{t("ning farzandi")}</option>
              <option value="spouse">{t("Tanlangan odam —")} {person.name}{t("ning turmush o'rtog'i")}</option>
            </select>

            {state?.error && (
              <div style={{ fontSize: 12.5, color: TOKENS.danger, background: "rgba(168,69,58,0.08)", padding: "9px 12px", borderRadius: 6 }}>
                {t(state.error)}
              </div>
            )}

            <button type="submit" disabled={pending} style={{ marginTop: 4, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "12px", fontSize: 13.5, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
              {pending ? t("Bog'lanmoqda...") : t("Bog'lash")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- People (Odamlar) grid view ---------------- */

export function PersonGridCard({ person, onSelect, isMe }) {
  return (
    <div onClick={onSelect} className="fm-person-grid-card" style={{ textAlign: "center", cursor: "pointer" }}>
      <div
        style={{
          width: 76, height: 76, borderRadius: "50%", margin: "0 auto 10px",
          border: isMe ? `2px solid ${TOKENS.gold}` : `1px solid ${TOKENS.parchmentDeep}`,
          background: person.photoUrl ? undefined : TOKENS.parchmentDeep,
          backgroundImage: person.photoUrl ? `url(${person.photoUrl})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          display: person.photoUrl ? undefined : "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Fraunces, serif", fontSize: 24, color: TOKENS.ink60,
        }}
      >
        {!person.photoUrl && (person.name?.[0]?.toUpperCase() || "?")}
      </div>
      <div style={{ fontFamily: "Fraunces, serif", fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.name}</div>
      <div style={{ fontSize: 11, color: TOKENS.ink60, marginTop: 2 }}>{person.years}</div>
    </div>
  );
}

export function PeopleView({
  familyName,
  familySlug,
  people,
  relationships,
  canEdit,
  mePersonId,
  addPersonAction,
  linkPersonAction,
  editPersonAction,
  deletePersonAction,
  uploadPersonPhotoAction,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [query, setQuery] = useState("");

  // Bir xil "formatlangan" shakl — Family Tree'dagi bilan bir xil (name/years/
  // photoUrl/raw), shunda PersonDetailPanel va Edit/Link modallarini o'zgarishsiz
  // qayta ishlatish mumkin.
  const items = useMemo(
    () =>
      people
        .map((p) => ({
          id: p.id,
          name: personLabel(p),
          years: personYears(p),
          biography: p.biography,
          photoUrl: p.profile_photo_url,
          gender: p.gender,
          raw: p,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "uz")),
    [people]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => p.name.toLowerCase().includes(q));
  }, [items, query]);

  const selected = items.find((p) => p.id === selectedId) || null;

  const relationToMe = useMemo(() => {
    if (!selected || !mePersonId) return null;
    return relationLabelBetween(mePersonId, selected.id, people, relationships);
  }, [selected, mePersonId, people, relationships]);

  useEffect(() => {
    setPhotoError(null);
  }, [selectedId]);

  if (people.length === 0) {
    return (
      <>
        <EmptyFamilyTree familyName={familyName} canEdit={canEdit} onAddPerson={() => setShowAddModal(true)} />
        {showAddModal && (
          <AddPersonModal familySlug={familySlug} people={people} relationships={relationships} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="fm-fade" style={{ display: "flex", height: "100%", flexWrap: "wrap" }}>
      <div style={{ flex: 1, padding: "28px clamp(16px, 5vw, 48px) 60px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{t("Oila a'zolari")}</div>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>{t("Odamlar")}</h1>
            <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginTop: 6 }}>{items.length} {t("a'zo")}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 10, padding: "0 12px", height: 40 }}>
              <Search size={14} color={TOKENS.ink40} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Ism bo'yicha qidirish...")}
                style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, width: 170, color: TOKENS.ink, fontFamily: "Inter, sans-serif" }}
              />
            </div>
            {canEdit && (
              <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 7, background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 10, padding: "0 18px", height: 40, fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                <Plus size={14} /> {t("Odam qo'shish")}
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: TOKENS.ink40, fontSize: 13 }}>{t("Hech kim topilmadi.")}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "24px", padding: "0 12px" }}>
            {filtered.map((p) => (
              <PersonGridCard key={p.id} person={p} isMe={p.id === mePersonId} onSelect={() => setSelectedId(p.id)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PersonDetailPanel
          selected={selected}
          mePersonId={mePersonId}
          relationToMe={relationToMe}
          canEdit={canEdit}
          familySlug={familySlug}
          uploadPersonPhotoAction={uploadPersonPhotoAction}
          photoError={photoError}
          setPhotoError={setPhotoError}
          onClose={() => { setSelectedId(null); setConfirmDelete(false); }}
          onEdit={() => setShowEditModal(true)}
          onLink={() => setShowLinkModal(true)}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          deletePersonAction={deletePersonAction}
        />
      )}

      {showAddModal && (
        <AddPersonModal familySlug={familySlug} people={people} relationships={relationships} addPersonAction={addPersonAction} onClose={() => setShowAddModal(false)} />
      )}

      {showLinkModal && selected && (
        <LinkPersonModal
          familySlug={familySlug}
          person={selected}
          people={people}
          linkPersonAction={linkPersonAction}
          onClose={() => setShowLinkModal(false)}
        />
      )}

      {showEditModal && selected && (
        <EditPersonModal
          familySlug={familySlug}
          person={selected}
          editPersonAction={editPersonAction}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
