import React, { useState, useRef, useEffect, useActionState } from "react";
import { AppearanceSettings } from "./ThemeLangControls";
import { useRouter } from "next/navigation";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { t } from "@/lib/i18n";

const ROLE_LABELS = {
  owner: "Egasi",
  editor: "Muharrir",
  member: "A'zo",
  viewer: "Kuzatuvchi",
};

function RoleBadge({ role }) {
  const isOwner = role === "owner";
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
        background: isOwner ? "rgba(184,134,59,0.16)" : TOKENS.parchment,
        color: isOwner ? TOKENS.gold : TOKENS.ink60,
        border: isOwner ? "none" : `1px solid ${TOKENS.parchmentDeep}`,
      }}
    >
      {t(ROLE_LABELS[role]) || role}
    </span>
  );
}

function FamilyNameForm({ familySlug, familyName, updateFamilyNameAction }) {
  const [state, formAction, pending] = useActionState(updateFamilyNameAction, undefined);
  return (
    <form action={formAction} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
      <input type="hidden" name="familySlug" value={familySlug} />
      <div style={{ flex: "1 1 220px", minWidth: 180 }}>
        <input name="name" defaultValue={familyName} required style={inputStyle} />
        {state?.error && <div style={{ fontSize: 12, color: TOKENS.danger, marginTop: 6 }}>{t(state.error)}</div>}
        {state?.ok && <div style={{ fontSize: 12, color: TOKENS.teal, marginTop: 6 }}>{t("Saqlandi. O'zgarish sahifani yangilaganda hamma joyda ko'rinadi.")}</div>}
      </div>
      <button type="submit" disabled={pending} style={{ background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1, flexShrink: 0 }}>
        {pending ? t("Saqlanmoqda...") : t("Saqlash")}
      </button>
    </form>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div style={{ background: TOKENS.card, border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
      <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 500, margin: "0 0 16px" }}>{title}</h2>
      {children}
    </div>
  );
}

function InviteLinkRow({ invite, familySlug, revokeInviteAction }) {
  const [copied, setCopied] = useState(false);
  const [revokeState, revokeFormAction, revokePending] = useActionState(revokeInviteAction, undefined);
  const url = typeof window !== "undefined" ? `${window.location.origin}/invite/${invite.code}` : `/invite/${invite.code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard ruxsati bo'lmasa jim o'tkazib yuboramiz
    }
  };

  if (revokeState?.ok) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: `1px solid ${TOKENS.parchmentDeep}`, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0, flex: "1 1 220px" }}>
        <div style={{ fontSize: 12.5, fontFamily: "monospace", color: TOKENS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</div>
        <div style={{ fontSize: 11, color: TOKENS.ink40, marginTop: 2 }}>{t("Rol:")} {t(ROLE_LABELS[invite.role]) || invite.role}</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button type="button" onClick={copy} style={{ background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: TOKENS.ink }}>
          {copied ? t("Nusxalandi ✓") : t("Nusxalash")}
        </button>
        <form action={revokeFormAction}>
          <input type="hidden" name="familySlug" value={familySlug} />
          <input type="hidden" name="inviteId" value={invite.id} />
          <button type="submit" disabled={revokePending} style={{ background: "transparent", border: `1px solid ${TOKENS.danger}`, color: TOKENS.danger, borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: revokePending ? "default" : "pointer", opacity: revokePending ? 0.6 : 1 }}>
            {t("Bekor qilish")}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateInviteForm({ familySlug, createInviteAction, onCreated }) {
  const [state, formAction, pending] = useActionState(createInviteAction, undefined);
  const [role, setRole] = useState("member");
  const lastCode = useRef(null);

  useEffect(() => {
    if (state?.ok && state.inviteCode && state.inviteCode !== lastCode.current) {
      lastCode.current = state.inviteCode;
      onCreated?.();
    }
  }, [state, onCreated]);

  return (
    <form action={formAction} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
      <input type="hidden" name="familySlug" value={familySlug} />
      <select name="role" value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputStyle, flex: "0 0 auto", width: "auto" }}>
        <option value="member">{t("A'zo")}</option>
        <option value="editor">{t("Muharrir")}</option>
        <option value="viewer">{t("Kuzatuvchi")}</option>
      </select>
      <button type="submit" disabled={pending} style={{ background: TOKENS.ink, color: TOKENS.parchment, border: "none", borderRadius: 8, padding: "11px 18px", fontSize: 13, fontWeight: 600, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1 }}>
        {pending ? t("Yaratilmoqda...") : t("Taklif havolasi yaratish")}
      </button>
      {state?.error && <div style={{ width: "100%", fontSize: 12, color: TOKENS.danger }}>{t(state.error)}</div>}
    </form>
  );
}

function MemberRow({ member: m, familySlug, userEmail, isOwner, updateMemberRoleAction, removeMemberAction }) {
  const isMe = m.email === userEmail;
  const canManage = isOwner && !isMe && m.role !== "owner";

  const [roleState, roleFormAction, rolePending] = useActionState(updateMemberRoleAction, undefined);
  const [removeState, removeFormAction, removePending] = useActionState(removeMemberAction, undefined);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [role, setRole] = useState(m.role === "owner" ? "member" : m.role);

  if (removeState?.ok) return null;

  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${TOKENS.parchmentDeep}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: TOKENS.ink, display: "flex", alignItems: "center", gap: 6 }}>
            {m.name}
            {isMe && <span style={{ fontSize: 11, color: TOKENS.ink40, fontWeight: 400 }}>{t("(siz)")}</span>}
          </div>
          <div style={{ fontSize: 12, color: TOKENS.ink60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
        </div>

        {canManage ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <form action={roleFormAction} onChange={(e) => e.currentTarget.requestSubmit()}>
              <input type="hidden" name="familySlug" value={familySlug} />
              <input type="hidden" name="userId" value={m.user_id} />
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={rolePending}
                style={{ fontSize: 12, fontWeight: 600, padding: "5px 8px", borderRadius: 7, border: `1px solid ${TOKENS.parchmentDeep}`, background: TOKENS.parchment, color: TOKENS.ink, cursor: rolePending ? "default" : "pointer" }}
              >
                <option value="editor">{ROLE_LABELS.editor}</option>
                <option value="member">{ROLE_LABELS.member}</option>
                <option value="viewer">{ROLE_LABELS.viewer}</option>
              </select>
            </form>
            {!confirmRemove ? (
              <button type="button" onClick={() => setConfirmRemove(true)} style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.danger, background: "transparent", border: `1px solid ${TOKENS.danger}`, borderRadius: 7, padding: "6px 10px", cursor: "pointer" }}>
                {t("Chiqarish")}
              </button>
            ) : (
              <form action={removeFormAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="hidden" name="familySlug" value={familySlug} />
                <input type="hidden" name="userId" value={m.user_id} />
                <span style={{ fontSize: 11, color: TOKENS.danger }}>{t("Rostdan?")}</span>
                <button type="submit" disabled={removePending} style={{ fontSize: 11.5, fontWeight: 600, color: "#fff", background: TOKENS.danger, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
                  {t("Ha")}
                </button>
                <button type="button" onClick={() => setConfirmRemove(false)} style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60, background: "transparent", border: `1px solid ${TOKENS.parchmentDeep}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
                  {t("Yo'q")}
                </button>
              </form>
            )}
          </div>
        ) : (
          <RoleBadge role={m.role} />
        )}
      </div>
      {roleState?.error && <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 4 }}>{t(roleState.error)}</div>}
      {removeState?.error && <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 4 }}>{t(removeState.error)}</div>}
    </div>
  );
}

export function SettingsView({ familyName, familySince, familySlug, members, invites, isOwner, canInvite, userEmail, updateFamilyNameAction, updateMemberRoleAction, removeMemberAction, createInviteAction, revokeInviteAction }) {
  const router = useRouter();
  return (
    <div className="fm-fade" style={{ padding: "28px clamp(16px, 5vw, 48px) 60px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", color: TOKENS.gold, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{t("Boshqaruv")}</div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 30, fontWeight: 500, margin: 0 }}>{t("Sozlamalar")}</h1>
      </div>

      <SettingsCard title={t("Ko'rinish va til")}>
        <AppearanceSettings tokens={TOKENS} />
      </SettingsCard>

      <SettingsCard title={t("Oila ma'lumotlari")}>
        {isOwner ? (
          <FamilyNameForm familySlug={familySlug} familyName={familyName} updateFamilyNameAction={updateFamilyNameAction} />
        ) : (
          <div style={{ fontSize: 14, color: TOKENS.ink }}>{familyName}</div>
        )}
        <div style={{ fontSize: 12, color: TOKENS.ink40, marginTop: 12 }}>
          {familySince ? t("{0}-yildan buyon", { 0: familySince }) : ""} {t("· manzil:")} <span style={{ fontFamily: "monospace" }}>/{familySlug}</span>
        </div>
        {!isOwner && (
          <div style={{ fontSize: 12, color: TOKENS.ink40, marginTop: 8 }}>{t("Oila nomini faqat egasi o'zgartira oladi.")}</div>
        )}
      </SettingsCard>

      <SettingsCard title={t("Oila a'zolari ({0})", { 0: members.length })}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {members.map((m) => (
            <MemberRow
              key={m.user_id}
              member={m}
              familySlug={familySlug}
              userEmail={userEmail}
              isOwner={isOwner}
              updateMemberRoleAction={updateMemberRoleAction}
              removeMemberAction={removeMemberAction}
            />
          ))}
        </div>
        {!isOwner && (
          <div style={{ fontSize: 12, color: TOKENS.ink40, marginTop: 14 }}>
            {t("A'zolarning rolini faqat oila egasi o'zgartira oladi.")}
          </div>
        )}
      </SettingsCard>

      {canInvite && (
        <SettingsCard title={t("Oilaga taklif qilish")}>
          <div style={{ fontSize: 12.5, color: TOKENS.ink60, marginBottom: 14, lineHeight: 1.6 }}>
            {t("Havola yarating va oila a'zosiga yuboring. Havola bir marta ishlatiladi — u orqali qo'shilgan odam tanlangan rol bilan kiradi.")}
          </div>
          <CreateInviteForm familySlug={familySlug} createInviteAction={createInviteAction} onCreated={() => router.refresh()} />

          {invites.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.ink60, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Faol havolalar")}</div>
              {invites.map((inv) => (
                <InviteLinkRow key={inv.id} invite={inv} familySlug={familySlug} revokeInviteAction={revokeInviteAction} />
              ))}
            </div>
          )}
        </SettingsCard>
      )}
    </div>
  );
}
