"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findUserByEmail, createUser } from "@/lib/user";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, getSession } from "@/lib/session";
import {
  createFamily,
  getFamiliesForUser,
  getFamilyBySlug,
  getMembership,
  updateFamilyName,
  updateMemberRole,
  removeMember,
  createInvite,
  revokeInvite,
  acceptInvite,
} from "@/lib/family";
import {
  createPerson,
  createRelationship,
  updatePerson,
  updatePersonPhoto,
  deletePerson,
} from "@/lib/people";
import {
  createAlbum,
  createAlbumPage,
  changePageLayout,
  updateElementPhoto,
  updateElementText,
  updatePageMeta,
  deletePage,
  deleteAlbum,
  setAlbumCover,
  getAlbumById,
  getPagesForAlbum,
  getElementsForPages,
  deleteElement,
  reorderPageElements,
  moveElementUp,
  moveElementDown,
  updateElementPosition,
  updateElementCaption,
  updateElementLocation,
  changeZIndex,
  duplicateElement,
  updatePageBackground,
  updateElementFrame,
  updateElementTextStyle,
  addStickerElement,
  updateElementStickerColor,
  addTextElement,
  addPhotoElement,
  STICKERS,
  type LayoutId,
  type BackgroundId,
  type FrameStyle,
  type StickerId,
  type TextAlign,
  type TextFont,
} from "@/lib/albums";
import {
  createTimelineEvent,
  updateTimelineEvent,
  updateTimelineEventPhoto,
  deleteTimelineEvent,
} from "@/lib/timeline";
import {
  createMemory,
  updateMemory,
  updateMemoryPhoto,
  deleteMemory,
} from "@/lib/memories";
import { createStory, updateStory, deleteStory, updateStoryPhoto } from "@/lib/stories";
import { createPlace, updatePlace, deletePlace } from "@/lib/places";
import { put } from "@vercel/blob";

export type ActionState = { error?: string; ok?: boolean; familySlug?: string; mePersonId?: string; albumId?: string; inviteCode?: string; elementId?: string; placeId?: string } | undefined;

async function verifyFamilyAccess(formData: FormData, minRole: "editor" | "owner" | "member" | "viewer" = "member") {
  const session = await getSession();
  if (!session) return { error: "Avtorizatsiya kerak." };

  const familySlug = String(formData.get("familySlug") || "").trim();
  if (!familySlug) return { error: "Oila topilmadi." };

  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  const roleHierarchy = { viewer: 0, member: 1, editor: 2, owner: 3 };
  const minRoleLevel = roleHierarchy[minRole as keyof typeof roleHierarchy] || 0;
  const userRoleLevel = membership ? roleHierarchy[membership.role as keyof typeof roleHierarchy] || 0 : -1;

  if (!membership || userRoleLevel < minRoleLevel) {
    return { error: "Sizda bu operatsiya uchun ruxsat yo'q." };
  }

  return { ok: true, session, family, membership };
}

export async function registerAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const inviteCode = String(formData.get("inviteCode") || "").trim();

    if (!name || !email || !password) {
      return { error: "Barcha maydonlarni to'ldiring." };
    }
    if (password.length < 6) {
      return { error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." };
    }
    if (await findUserByEmail(email)) {
      return { error: "Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan." };
    }

    const user = await createUser(email, password, name);
    const sessionResult = await createSession(user.id);
    if (!sessionResult.ok) {
      return { error: "Session yaratishda xato. Qaytadan urinib ko'ring." };
    }

    if (inviteCode) {
      try {
        const result = await acceptInvite(inviteCode, user.id);
        if ("family" in result) redirect(`/${result.family.slug}/dashboard`);
        return { error: result.error };
      } catch (e) {
        if ((e as Error).message?.includes("NEXT_REDIRECT")) throw e;
        return { error: "Taklifni qabul qilishda xato. Qaytadan urinib ko'ring." };
      }
    }

    redirect("/onboarding");
  } catch (e) {
    if ((e as Error).message?.includes("NEXT_REDIRECT")) throw e;
    console.error("[registerAction] error:", e);
    return { error: "Xatolik yuz berdi. Qaytadan urinib ko'ring." };
  }
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const inviteCode = String(formData.get("inviteCode") || "").trim();

    const user = await findUserByEmail(email);
    if (!user) {
      return { error: "Email yoki parol noto'g'ri." };
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return { error: "Email yoki parol noto'g'ri." };
    }

    const sessionResult = await createSession(user.id);
    if (!sessionResult.ok) {
      return { error: "Session yaratishda xato. Qaytadan urinib ko'ring." };
    }

    if (inviteCode) {
      try {
        const result = await acceptInvite(inviteCode, user.id);
        if ("family" in result) redirect(`/${result.family.slug}/dashboard`);
        return { error: result.error };
      } catch (e) {
        if ((e as Error).message?.includes("NEXT_REDIRECT")) throw e;
        return { error: "Taklifni qabul qilishda xato." };
      }
    }

    const families = await getFamiliesForUser(user.id);
    if (families.length === 0) {
      redirect("/onboarding");
    }
    redirect(`/${families[0].slug}/dashboard`);
  } catch (e) {
    if ((e as Error).message?.includes("NEXT_REDIRECT")) throw e;
    console.error("[loginAction] error:", e);
    return { error: "Xatolik yuz berdi. Qaytadan urinib ko'ring." };
  }
}

export async function createFamilyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session) redirect("/login");

    const familyName = String(formData.get("familyName") || "").trim();
    if (!familyName) {
      return { error: "Oila nomini kiriting." };
    }

    const family = await createFamily(familyName, session.id);

    const [firstName, ...rest] = session.name.trim().split(" ");
    const mePerson = await createPerson(
      family.id,
      { firstName: firstName || session.name, lastName: rest.join(" ") || undefined },
      session.id,
      session.id
    );

    return { ok: true, familySlug: family.slug, mePersonId: mePerson.id };
  } catch (e) {
    if ((e as Error).message?.includes("NEXT_REDIRECT")) throw e;
    console.error("[createFamilyAction] error:", e);
    return { error: "Oila yaratishda xato. Qaytadan urinib ko'ring." };
  }
}

export async function logoutAction() {
  try {
    await destroySession();
  } catch {}
  redirect("/login");
}

export async function updateFamilyNameAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role !== "owner") {
    return { error: "Faqat oila egasi nomini o'zgartira oladi." };
  }

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Oila nomini kiriting." };

  await updateFamilyName(family.id, name);
  return { ok: true };
}

/**
 * Faqat oila egasi (owner) boshqa a'zoning rolini o'zgartira oladi.
 * Owner'ning o'zi bu yerdan o'zgartirilmaydi (backend darajasida ham himoyalangan).
 */
export async function updateMemberRoleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role !== "owner") {
    return { error: "Faqat oila egasi a'zolarning rolini o'zgartira oladi." };
  }

  const targetUserId = String(formData.get("userId") || "").trim();
  if (!targetUserId) return { error: "A'zo topilmadi." };
  if (targetUserId === session.id) return { error: "O'zingizning rolingizni bu yerdan o'zgartira olmaysiz." };

  const roleRaw = String(formData.get("role") || "");
  const role = roleRaw === "editor" || roleRaw === "member" || roleRaw === "viewer" ? roleRaw : null;
  if (!role) return { error: "Noto'g'ri rol." };

  await updateMemberRole(family.id, targetUserId, role);
  return { ok: true };
}

/**
 * Faqat oila egasi a'zoni oiladan chiqarib yuborishi mumkin. Owner o'zini
 * chiqarib yubora olmaydi (backend darajasida ham himoyalangan).
 */
export async function removeMemberAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role !== "owner") {
    return { error: "Faqat oila egasi a'zoni chiqarib yubora oladi." };
  }

  const targetUserId = String(formData.get("userId") || "").trim();
  if (!targetUserId) return { error: "A'zo topilmadi." };
  if (targetUserId === session.id) return { error: "O'zingizni oiladan chiqarib yubora olmaysiz." };

  await removeMember(family.id, targetUserId);
  return { ok: true };
}

export async function createInviteAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || (membership.role !== "owner" && membership.role !== "editor")) {
    return { error: "Sizda taklif havolasi yaratish huquqi yo'q." };
  }

  const roleRaw = String(formData.get("role") || "member");
  const role = roleRaw === "editor" || roleRaw === "viewer" ? roleRaw : "member";

  const invite = await createInvite(family.id, role, session.id);
  return { ok: true, inviteCode: invite.code };
}

export async function revokeInviteAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const inviteId = String(formData.get("inviteId") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || (membership.role !== "owner" && membership.role !== "editor")) {
    return { error: "Sizda bu huquq yo'q." };
  }

  await revokeInvite(inviteId, family.id);
  return { ok: true };
}

export async function acceptInviteAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const code = String(formData.get("code") || "").trim();
  const result = await acceptInvite(code, session.id);
  if ("error" in result) return { error: result.error };

  redirect(`/${result.family.slug}/dashboard`);
}

// Oddiy <form action={...}> (useActionState'siz) uchun — invite sahifasida ishlatiladi.
export async function acceptInviteFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const code = String(formData.get("code") || "").trim();
  const result = await acceptInvite(code, session.id);
  if ("error" in result) redirect(`/invite/${code}`);

  redirect(`/${result.family.slug}/dashboard`);
}

export async function addPersonAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role === "viewer") {
    return { error: "Sizda odam qo'shish uchun ruxsat yo'q." };
  }

  const firstName = String(formData.get("firstName") || "").trim();
  if (!firstName) {
    return { error: "Ismni kiriting." };
  }

  const lastName = String(formData.get("lastName") || "");
  const gender = String(formData.get("gender") || "");
  const birthDate = String(formData.get("birthDate") || "");
  const deathDate = String(formData.get("deathDate") || "");
  const biography = String(formData.get("biography") || "");

  const person = await createPerson(
    family.id,
    { firstName, lastName, gender, birthDate, deathDate, biography },
    session.id
  );

  const relationType = String(formData.get("relationType") || "none");
  const relatedPersonId = String(formData.get("relatedPersonId") || "");

  if (relatedPersonId && (relationType === "child_of" || relationType === "spouse_of" || relationType === "parent_of")) {
    if (relationType === "child_of") {
      // relatedPerson — yangi odamning ota-onasi
      await createRelationship(family.id, relatedPersonId, person.id, "parent");
    } else if (relationType === "parent_of") {
      // yangi odam — relatedPerson'ning ota-onasi (masalan, "Ota"/"Ona" qo'shilganda)
      await createRelationship(family.id, person.id, relatedPersonId, "parent");
    } else {
      await createRelationship(family.id, person.id, relatedPersonId, "spouse");
    }
  }

  // Onboarding wizard'dagi kabi ko'p qadamli oqimlarda sahifani tark etmasdan
  // davom etish uchun ishlatiladi.
  if (String(formData.get("skipRedirect") || "") === "1") {
    return { ok: true };
  }

  redirect(`/${familySlug}/dashboard?view=tree`);
}

/**
 * Ikki ALLAQACHON MAVJUD odamni bir-biriga bog'laydi (ota-ona/farzand yoki turmush o'rtoqlik).
 * Bu — avval qo'shilgan, lekin daraxtda bog'lanmagan odamlarni tuzatish uchun.
 */
export async function linkPersonAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role === "viewer") {
    return { error: "Sizda bog'lash uchun ruxsat yo'q." };
  }

  const personId = String(formData.get("personId") || "").trim();
  const otherPersonId = String(formData.get("otherPersonId") || "").trim();
  const relationType = String(formData.get("relationType") || "");

  if (!personId || !otherPersonId) {
    return { error: "Bog'lanadigan odamni tanlang." };
  }
  if (personId === otherPersonId) {
    return { error: "Odamni o'ziga bog'lab bo'lmaydi." };
  }

  if (relationType === "other_is_parent") {
    // otherPerson — personning ota-onasi
    await createRelationship(family.id, otherPersonId, personId, "parent");
  } else if (relationType === "other_is_child") {
    // otherPerson — personning farzandi
    await createRelationship(family.id, personId, otherPersonId, "parent");
  } else if (relationType === "spouse") {
    await createRelationship(family.id, personId, otherPersonId, "spouse");
  } else {
    return { error: "Bog'lanish turini tanlang." };
  }

  redirect(`/${familySlug}/dashboard?view=tree`);
}

export async function editPersonAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const personId = String(formData.get("personId") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role === "viewer") {
    return { error: "Sizda tahrirlash uchun ruxsat yo'q." };
  }

  const firstName = String(formData.get("firstName") || "").trim();
  if (!firstName) {
    return { error: "Ismni kiriting." };
  }

  await updatePerson(personId, family.id, {
    firstName,
    lastName: String(formData.get("lastName") || ""),
    gender: String(formData.get("gender") || ""),
    birthDate: String(formData.get("birthDate") || ""),
    deathDate: String(formData.get("deathDate") || ""),
    biography: String(formData.get("biography") || ""),
  });

  redirect(`/${familySlug}/dashboard?view=tree`);
}

export async function deletePersonAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const personId = String(formData.get("personId") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role === "viewer") {
    return { error: "Sizda o'chirish uchun ruxsat yo'q." };
  }

  await deletePerson(personId, family.id);
  redirect(`/${familySlug}/dashboard?view=tree`);
}

export async function uploadPersonPhotoAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familySlug = String(formData.get("familySlug") || "").trim();
  const personId = String(formData.get("personId") || "").trim();
  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." };

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role === "viewer") {
    return { error: "Sizda rasm yuklash uchun ruxsat yo'q." };
  }

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) {
    return { error: "Rasm tanlanmadi." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Faqat rasm fayllari qabul qilinadi." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Rasm hajmi 5MB dan oshmasligi kerak." };
  }

  try {
    const blob = await put(`people/${personId}-${Date.now()}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    await updatePersonPhoto(personId, family.id, blob.url);
  } catch {
    return { error: "Rasm yuklashda xato yuz berdi. Vercel Blob sozlanganligini tekshiring." };
  }

  redirect(`/${familySlug}/dashboard?view=tree`);
}

async function requireEditableFamily(familySlug: string) {
  const session = await getSession();
  if (!session) redirect("/login");

  const family = await getFamilyBySlug(familySlug);
  if (!family) return { error: "Oila topilmadi." } as const;

  const membership = await getMembership(family.id, session.id);
  if (!membership || membership.role === "viewer") {
    return { error: "Sizda bu amal uchun ruxsat yo'q." } as const;
  }

  return { session, family } as const;
}

export async function createAlbumAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Albom nomini kiriting." };

  const album = await createAlbum(check.family.id, check.session.id, {
    title,
    description: String(formData.get("description") || ""),
    dateLabel: String(formData.get("dateLabel") || ""),
    location: String(formData.get("location") || ""),
  });

  if (String(formData.get("skipRedirect") || "") === "1") {
    return { ok: true, albumId: album.id };
  }

  redirect(`/${familySlug}/dashboard?view=albums&album=${album.id}`);
}

export async function deleteAlbumAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  await deleteAlbum(albumId, check.family.id);
  redirect(`/${familySlug}/dashboard?view=albums`);
}

export async function addAlbumPageAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  await createAlbumPage(albumId, "l1");
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function deleteAlbumPageAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  await deletePage(pageId);
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function changePageLayoutAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  const layoutId = String(formData.get("layoutId") || "l1") as LayoutId;
  await changePageLayout(pageId, layoutId);
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function updatePageMetaAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  await updatePageMeta(pageId, String(formData.get("dateLabel") || ""), String(formData.get("location") || ""));
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function updateElementTextAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const elementId = String(formData.get("elementId") || "").trim();
  await updateElementText(elementId, String(formData.get("text") || ""));
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function uploadElementPhotoAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const elementId = String(formData.get("elementId") || "").trim();
  const setCover = formData.get("setCover") === "1";

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "Rasm tanlanmadi." };
  if (!file.type.startsWith("image/")) return { error: "Faqat rasm fayllari qabul qilinadi." };
  if (file.size > 8 * 1024 * 1024) return { error: "Rasm hajmi 8MB dan oshmasligi kerak." };

  try {
    const blob = await put(`albums/${albumId}/${elementId}-${Date.now()}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    await updateElementPhoto(elementId, blob.url);

    if (setCover) {
      await setAlbumCover(albumId, blob.url);
    } else {
      const album = await getAlbumById(albumId, check.family.id);
      if (album && !album.cover_url) {
        await setAlbumCover(albumId, blob.url);
      }
    }
  } catch {
    return { error: "Rasm yuklashda xato yuz berdi. Vercel Blob sozlanganligini tekshiring." };
  }

  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

/**
 * Faylning o'zi endi bu funksiyadan o'tmaydi — brauzer uni to'g'ridan-to'g'ri
 * Vercel Blob'ga (@vercel/blob/client orqali, /api/blob-upload token'i bilan)
 * yuklaydi va bizga faqat tayyor URL'ni beradi. Bu Vercel funksiyasining
 * 4.5MB'lik qattiq chegarasini butunlay chetlab o'tadi. Bu — oddiy argumentli
 * (FormData emas) Server Action, PhotoSlot'dan to'g'ridan-to'g'ri chaqiriladi.
 */
export async function saveElementPhotoUrlAction(
  familySlug: string,
  albumId: string,
  elementId: string,
  photoUrl: string,
  setCover: boolean
): Promise<{ error?: string; ok?: boolean }> {
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };
  if (!elementId || !photoUrl) return { error: "Ma'lumot yetarli emas." };

  try {
    await updateElementPhoto(elementId, photoUrl);

    if (setCover) {
      await setAlbumCover(albumId, photoUrl);
    } else {
      const album = await getAlbumById(albumId, check.family.id);
      if (album && !album.cover_url) {
        await setAlbumCover(albumId, photoUrl);
      }
    }
    revalidatePath(`/${familySlug}/dashboard`);
    return { ok: true };
  } catch (e) {
    return { error: "Saqlashda xato: " + String(e) };
  }
}

/* ---------------- Timeline (Vaqt chizig'i) ---------------- */

export async function createTimelineEventAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Voqea nomini kiriting." };

  await createTimelineEvent(check.family.id, check.session.id, {
    title,
    description: String(formData.get("description") || ""),
    eventDate: String(formData.get("eventDate") || ""),
    location: String(formData.get("location") || ""),
    personId: String(formData.get("personId") || ""),
  });

  redirect(`/${familySlug}/dashboard?view=timeline`);
}

export async function updateTimelineEventAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const eventId = String(formData.get("eventId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Voqea nomini kiriting." };

  await updateTimelineEvent(eventId, check.family.id, {
    title,
    description: String(formData.get("description") || ""),
    eventDate: String(formData.get("eventDate") || ""),
    location: String(formData.get("location") || ""),
    personId: String(formData.get("personId") || ""),
  });

  redirect(`/${familySlug}/dashboard?view=timeline`);
}

export async function deleteTimelineEventAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const eventId = String(formData.get("eventId") || "").trim();
  await deleteTimelineEvent(eventId, check.family.id);
  redirect(`/${familySlug}/dashboard?view=timeline`);
}

export async function uploadTimelineEventPhotoAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const eventId = String(formData.get("eventId") || "").trim();
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "Rasm tanlanmadi." };
  if (!file.type.startsWith("image/")) return { error: "Faqat rasm fayllari qabul qilinadi." };
  if (file.size > 8 * 1024 * 1024) return { error: "Rasm hajmi 8MB dan oshmasligi kerak." };

  try {
    const blob = await put(`timeline/${eventId}-${Date.now()}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    await updateTimelineEventPhoto(eventId, check.family.id, blob.url);
  } catch {
    return { error: "Rasm yuklashda xato yuz berdi. Vercel Blob sozlanganligini tekshiring." };
  }

  redirect(`/${familySlug}/dashboard?view=timeline`);
}

/**
 * "+ Yangi" menyusidagi "Rasmlar yuklash" oqimi. Bir yoki bir nechta rasmni,
 * mavjud albomga (yoki tezkor ravishda yaratilgan yangi albomga) tezda
 * qo'shadi — har bir rasm uchun avtomatik "bitta katta" (l1) sahifa ochiladi,
 * to'liq scrapbook-editorni ochmasdan. Foydalanuvchi keyinroq shu sahifalarni
 * albom ichida oddiy tahrirlash bilan davom ettirishi mumkin.
 */
export async function bulkUploadPhotosAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const files = (formData.getAll("photos") as File[]).filter((f) => f && f.size > 0);
  if (files.length === 0) return { error: "Kamida bitta rasm tanlang." };
  for (const file of files) {
    if (!file.type.startsWith("image/")) return { error: "Faqat rasm fayllari qabul qilinadi." };
    if (file.size > 8 * 1024 * 1024) return { error: "Har bir rasm 8MB dan oshmasligi kerak." };
  }

  let albumId = String(formData.get("albumId") || "").trim();
  const newAlbumTitle = String(formData.get("newAlbumTitle") || "").trim();
  let reuseFirstPageId: string | null = null;

  if (!albumId) {
    if (!newAlbumTitle) return { error: "Albom tanlang yoki yangi albom nomini kiriting." };
    const newAlbum = await createAlbum(check.family.id, check.session.id, { title: newAlbumTitle });
    albumId = newAlbum.id;
    // createAlbum ichida avtomatik yaratilgan bo'sh birinchi sahifadan
    // birinchi yuklangan rasm uchun foydalanamiz — ortiqcha bo'sh sahifa qolmasin.
    const pages = await getPagesForAlbum(albumId);
    reuseFirstPageId = pages[0]?.id ?? null;
  }

  const album = await getAlbumById(albumId, check.family.id);
  if (!album) return { error: "Albom topilmadi." };

  let isFirstUpload = true;
  for (const file of files) {
    const pageId = reuseFirstPageId && isFirstUpload ? reuseFirstPageId : (await createAlbumPage(albumId, "l1")).id;
    isFirstUpload = false;

    const elements = await getElementsForPages([pageId]);
    const photoEl = elements.find((e) => e.type === "photo");
    if (!photoEl) continue;

    try {
      const blob = await put(`albums/${albumId}/${photoEl.id}-${Date.now()}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      await updateElementPhoto(photoEl.id, blob.url);

      const currentAlbum = await getAlbumById(albumId, check.family.id);
      if (currentAlbum && !currentAlbum.cover_url) {
        await setAlbumCover(albumId, blob.url);
      }
    } catch {
      return { error: "Rasm yuklashda xato yuz berdi. Vercel Blob sozlanganligini tekshiring." };
    }
  }

  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

// MUHIM: bu action'lar frontendda `useActionState(createMemoryAction, ...)`
// orqali chaqiriladi — React bunday holatda funksiyani
// `(oldingi_holat, formData)` tartibida chaqiradi. Shuning uchun birinchi
// parametr sifatida `_prevState` qabul qilinishi SHART — aks holda funksiya
// ichida `formData` o'rniga haqiqatda oldingi holat (odatda `undefined`)
// keladi va `.get()` chaqirilganda "formData.get is not a function" xatosi
// bilan yiqiladi (bu "Saqlash" bosilganda sodir bo'lardi).
export async function createMemoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const memoryDate = String(formData.get("memoryDate") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const personId = String(formData.get("personId") || "").trim() || null;
  const photoFile = formData.get("photo") as File | null;

  if (!title) return { error: "Xotira nomini kiriting." };

  try {
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const blob = await put(`memories/${check.family.id}/${crypto.randomUUID()}-${Date.now()}`, photoFile, {
        access: "public",
        addRandomSuffix: true,
      });
      photoUrl = blob.url;
    }

    await createMemory(
      check.family.id,
      title,
      description,
      memoryDate,
      photoUrl,
      location,
      personId || null,
      check.session.id
    );

    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Xotira yaratishda xato: " + String(e) };
  }
}

export async function updateMemoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const memoryId = String(formData.get("memoryId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const memoryDate = String(formData.get("memoryDate") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const personId = String(formData.get("personId") || "").trim() || null;

  if (!memoryId || !title) return { error: "Xotira ID va nomi kerak." };

  try {
    const updated = await updateMemory(memoryId, check.family.id, title, description, memoryDate, location, personId || null);
    if (!updated) return { error: "Xotira topilmadi." };
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Xotira yangilashda xato: " + String(e) };
  }
}

export async function updateMemoryPhotoAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const memoryId = String(formData.get("memoryId") || "").trim();
  const photoFile = formData.get("photo") as File | null;

  if (!memoryId || !photoFile || photoFile.size === 0) {
    return { error: "Xotira ID va rasm kerak." };
  }

  try {
    const blob = await put(`memories/${check.family.id}/${memoryId}-${Date.now()}`, photoFile, {
      access: "public",
      addRandomSuffix: true,
    });
    const updated = await updateMemoryPhoto(memoryId, check.family.id, blob.url);
    if (!updated) return { error: "Xotira topilmadi." };
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Rasm yuklashda xato: " + String(e) };
  }
}

// MUHIM: bu action MemoriesView'da `deleteMemoryAction(undefined, formData)`
// tarzida to'g'ridan-to'g'ri (useActionState orqali emas) chaqiriladi —
// shuning uchun ikki parametrli imzoga mos kelishi kerak.
export async function deleteMemoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const memoryId = String(formData.get("memoryId") || "").trim();
  if (!memoryId) return { error: "Xotira ID kerak." };

  try {
    await deleteMemory(memoryId, check.family.id);
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Xotira o'chirishda xato: " + String(e) };
  }
}

/* ============ Album Editor — Element Management ============ */

export async function deleteElementAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  const albumId = String(formData.get("albumId") || "").trim();

  if (!elementId || !pageId) return { error: "Element yoki page ID kerak." };

  try {
    await deleteElement(elementId, pageId);
    return { ok: true };
  } catch {
    return { error: "Element o'chirishda xato yuz berdi." };
  }
}

export async function reorderElementsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const pageId = String(formData.get("pageId") || "").trim();
  const albumId = String(formData.get("albumId") || "").trim();
  const elementIdsRaw = String(formData.get("elementIds") || "");

  if (!pageId || !elementIdsRaw) return { error: "Page ID va element IDlari kerak." };

  try {
    const elementIds = elementIdsRaw.split(",").filter(Boolean);
    await reorderPageElements(pageId, elementIds);
    return { ok: true };
  } catch {
    return { error: "Elementlarni qayta tartiblashda xato yuz berdi." };
  }
}

export async function moveElementUpAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();

  if (!elementId || !pageId) return { error: "Element yoki page ID kerak." };

  try {
    await moveElementUp(elementId, pageId);
    return { ok: true };
  } catch {
    return { error: "Element ko'chirishda xato yuz berdi." };
  }
}

export async function moveElementDownAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();

  if (!elementId || !pageId) return { error: "Element yoki page ID kerak." };

  try {
    await moveElementDown(elementId, pageId);
    return { ok: true };
  } catch {
    return { error: "Element ko'chirishda xato yuz berdi." };
  }
}

/* ============ Album Editor — Position / Caption / Free-form ============ */

export async function updateElementPositionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  const x = Number(formData.get("positionX"));
  const y = Number(formData.get("positionY"));
  const w = Number(formData.get("positionW"));
  const h = Number(formData.get("positionH"));
  const zRaw = formData.get("zIndex");
  const rRaw = formData.get("rotation");

  if (!elementId || !pageId) return { error: "Element yoki page ID kerak." };
  if ([x, y, w, h].some((v) => Number.isNaN(v))) return { error: "Joylashuv koordinatalari noto'g'ri." };

  try {
    await updateElementPosition(elementId, pageId, {
      x, y, w, h,
      zIndex: zRaw != null && zRaw !== "" ? Number(zRaw) : undefined,
      rotation: rRaw != null && rRaw !== "" ? Number(rRaw) : undefined,
    });
    return { ok: true };
  } catch {
    return { error: "Element joylashuvini saqlashda xato." };
  }
}

export async function updateElementCaptionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const caption = String(formData.get("caption") || "");

  if (!elementId) return { error: "Element ID kerak." };

  try {
    await updateElementCaption(elementId, caption);
    return { ok: true };
  } catch {
    return { error: "Caption saqlashda xato." };
  }
}

export async function updateElementPlaceAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const location = String(formData.get("location") || "");

  if (!elementId) return { error: "Element ID kerak." };

  try {
    await updateElementLocation(elementId, location);
    return { ok: true };
  } catch {
    return { error: "Joy (location) saqlashda xato." };
  }
}

export async function changeZIndexAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  const direction = formData.get("direction") === "down" ? "down" : "up";

  if (!elementId || !pageId) return { error: "Element yoki page ID kerak." };

  try {
    await changeZIndex(elementId, pageId, direction);
    return { ok: true };
  } catch {
    return { error: "Z-index o'zgartirishda xato." };
  }
}

export async function duplicateElementAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  const albumId = String(formData.get("albumId") || "").trim();

  if (!elementId || !pageId) return { error: "Element yoki page ID kerak." };

  try {
    const newId = await duplicateElement(elementId, pageId);
    return { ok: true, elementId: newId ?? undefined, albumId: albumId || undefined };
  } catch {
    return { error: "Elementni nusxalashda xato." };
  }
}

export async function changePageBackgroundAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  const backgroundId = String(formData.get("backgroundId") || "paper") as BackgroundId;
  if (!pageId) return { error: "Page ID kerak." };

  await updatePageBackground(pageId, backgroundId);
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function updateElementFrameAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const elementId = String(formData.get("elementId") || "").trim();
  const frameStyle = String(formData.get("frameStyle") || "polaroid") as FrameStyle;
  if (!elementId) return { error: "Element ID kerak." };

  await updateElementFrame(elementId, frameStyle);
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function updateElementTextStyleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  if (!elementId) return { error: "Element ID kerak." };

  const size = Math.max(10, Math.min(72, Number(formData.get("textSize")) || 22));
  const color = String(formData.get("textColor") || "#1E2621").trim();
  const align = String(formData.get("textAlign") || "left") as TextAlign;
  const font = String(formData.get("textFont") || "handwriting") as TextFont;

  await updateElementTextStyle(elementId, { size, color, align, font });
  return undefined;
}

export async function addStickerElementAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  const stickerId = String(formData.get("stickerId") || "leaf") as StickerId;
  if (!pageId) return { error: "Page ID kerak." };

  // Washi-lenta uzun-yupqa, boshqalari kvadrat shaklda joylashadi.
  const kind = STICKERS[stickerId]?.kind;
  const pos = kind === "tape" ? { x: 32, y: 40, w: 28, h: 8 } : { x: 38, y: 38, w: 16, h: 16 };

  await addStickerElement(pageId, stickerId, pos);
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function updateElementStickerColorAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const elementId = String(formData.get("elementId") || "").trim();
  const color = String(formData.get("color") || "").trim();
  if (!elementId) return { error: "Element ID kerak." };
  if (!color) return { error: "Rang kerak." };

  await updateElementStickerColor(elementId, color);
  return undefined;
}

export async function addTextElementAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  if (!pageId) return { error: "Page ID kerak." };

  await addTextElement(pageId, { x: 30, y: 40, w: 40, h: 20 });
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

export async function addPhotoElementAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const pageId = String(formData.get("pageId") || "").trim();
  if (!pageId) return { error: "Page ID kerak." };

  await addPhotoElement(pageId, { x: 30, y: 30, w: 32, h: 32 });
  redirect(`/${familySlug}/dashboard?view=albums&album=${albumId}`);
}

/* ============ Stories (Hikoyalar) ============ */

export async function createStoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const personId = String(formData.get("personId") || "").trim() || undefined;
  const location = String(formData.get("location") || "").trim() || undefined;
  const storyDate = String(formData.get("storyDate") || "").trim() || undefined;
  const photoFile = formData.get("photo") as File | null;

  if (!title || !content) return { error: "Hikoya nomi va mazmuni kerak." };

  try {
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const blob = await put(`stories/${check.family.id}/${crypto.randomUUID()}-${Date.now()}`, photoFile, {
        access: "public",
        addRandomSuffix: true,
      });
      photoUrl = blob.url;
    }

    await createStory(check.family.id, check.session.id, {
      title,
      content,
      personId,
      location,
      storyDate,
      photoUrl: photoUrl || undefined,
    });

    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Hikoya yaratishda xato: " + String(e) };
  }
}

export async function updateStoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const storyId = String(formData.get("storyId") || "").trim();
  const title = String(formData.get("title") || "").trim() || undefined;
  const content = String(formData.get("content") || "").trim() || undefined;
  const personId = String(formData.get("personId") || "").trim() || undefined;
  const location = String(formData.get("location") || "").trim() || undefined;
  const storyDate = String(formData.get("storyDate") || "").trim() || undefined;

  if (!storyId) return { error: "Hikoya ID kerak." };

  try {
    await updateStory(storyId, check.family.id, {
      title,
      content,
      personId,
      location,
      storyDate,
    });
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Hikoya yangilashda xato: " + String(e) };
  }
}

export async function updateStoryPhotoAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const storyId = String(formData.get("storyId") || "").trim();
  const photoFile = formData.get("photo") as File | null;

  if (!storyId || !photoFile || photoFile.size === 0) {
    return { error: "Hikoya ID va rasm kerak." };
  }

  try {
    const blob = await put(`stories/${check.family.id}/${storyId}-${Date.now()}`, photoFile, {
      access: "public",
      addRandomSuffix: true,
    });
    await updateStoryPhoto(storyId, blob.url);
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Rasm yuklashda xato: " + String(e) };
  }
}

export async function deleteStoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const storyId = String(formData.get("storyId") || "").trim();
  if (!storyId) return { error: "Hikoya ID kerak." };

  try {
    await deleteStory(storyId, check.family.id);
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Hikoya o'chirishda xato: " + String(e) };
  }
}

/* ============ Places (Joylar) ============ */

export async function createPlaceAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Joy nomi kerak." };

  const latitude = formData.get("latitude") ? parseFloat(String(formData.get("latitude"))) : undefined;
  const longitude = formData.get("longitude") ? parseFloat(String(formData.get("longitude"))) : undefined;

  try {
    await createPlace(check.family.id, check.session.id, {
      name,
      description: String(formData.get("description") || "").trim() || undefined,
      latitude,
      longitude,
      address: String(formData.get("address") || "").trim() || undefined,
    });
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Joy qo'shishda xato: " + String(e) };
  }
}

export async function updatePlaceAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const placeId = String(formData.get("placeId") || "").trim();
  if (!placeId) return { error: "Joy ID kerak." };

  const latitude = formData.get("latitude") ? parseFloat(String(formData.get("latitude"))) : undefined;
  const longitude = formData.get("longitude") ? parseFloat(String(formData.get("longitude"))) : undefined;

  try {
    await updatePlace(placeId, check.family.id, {
      name: String(formData.get("name") || "").trim() || undefined,
      description: String(formData.get("description") || "").trim() || undefined,
      latitude,
      longitude,
      address: String(formData.get("address") || "").trim() || undefined,
    });
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Joy yangilashda xato: " + String(e) };
  }
}

export async function deletePlaceAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const placeId = String(formData.get("placeId") || "").trim();
  if (!placeId) return { error: "Joy ID kerak." };

  try {
    await deletePlace(placeId, check.family.id);
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Joy o'chirishda xato: " + String(e) };
  }
}
