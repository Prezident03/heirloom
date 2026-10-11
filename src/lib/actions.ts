"use server";

import { redirect } from "next/navigation";
import { revalidatePath, refresh } from "next/cache";
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
  setFamilyCover,
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
  createPhotoPage,
  deleteAlbum,
  updateAlbumTitle,
  setAlbumCover,
  getAlbumById,
  getPagesForAlbum,
  saveAlbumState,
  setCustomAlbumCover,
  resetAlbumCover,
  setAlbumSharing,
  type SaveAlbumInput,
} from "@/lib/albums";
import { addMedia } from "@/lib/media";
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
      await createRelationship(family.id, relatedPersonId, person.id, "parent");
    } else if (relationType === "parent_of") {
      await createRelationship(family.id, person.id, relatedPersonId, "parent");
    } else {
      await createRelationship(family.id, person.id, relatedPersonId, "spouse");
    }
  }

  if (String(formData.get("skipRedirect") || "") === "1") {
    return { ok: true };
  }

  redirect(`/${familySlug}/dashboard?view=tree`);
}

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
    await createRelationship(family.id, otherPersonId, personId, "parent");
  } else if (relationType === "other_is_child") {
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
  // Klient rasmni kesib, kichik JPEG (~800×800) qilib yuboradi — shuning uchun bu chegara yetarli.
  if (file.size > 4 * 1024 * 1024) {
    return { error: "Rasm hajmi juda katta." };
  }

  try {
    const blob = await put(`people/${personId}-${Date.now()}.jpg`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || "image/jpeg",
    });
    await updatePersonPhoto(personId, family.id, blob.url);
  } catch {
    return { error: "Rasm yuklashda xato yuz berdi. Vercel Blob sozlanganligini tekshiring." };
  }

  revalidatePath(`/${familySlug}/dashboard`);
  return { ok: true };
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

export async function renameAlbumAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Albom nomini kiriting." };

  if (title.length > 200) return { error: "Albom nomi juda uzun." };

  await updateAlbumTitle(albumId, check.family.id, title);
  revalidatePath(`/${familySlug}/dashboard`);
  return { ok: true };
}

/**
 * Album Editor holatini saqlaydi. Editor barcha o'zgarishlarni klientda
 * ushlab turadi va debounce bilan faqat o'zgargan sahifalarni yuboradi.
 * `refresh()` chaqirilmaydi — editor o'z holatini o'zi boshqaradi, sahifani
 * qayta yuklash foydalanuvchining ishini "sakratib" yuborardi.
 */
export async function saveAlbumAction(
  familySlug: string,
  albumId: string,
  payload: SaveAlbumInput
): Promise<{ ok?: boolean; error?: string }> {
  const check = await requireEditableFamily(String(familySlug || ""));
  if ("error" in check) return { error: check.error };
  if (!albumId) return { error: "Albom ID kerak." };

  try {
    await saveAlbumState(String(albumId), check.family.id, payload);
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Saqlashda xato yuz berdi." };
  }
}

function isBlobUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Brauzerdan to'g'ridan-to'g'ri Blob'ga yuklangan faylni oila kutubxonasiga qo'shadi. */
export async function registerMediaAction(
  familySlug: string,
  input: { url: string; kind: "photo" | "video"; width?: number; height?: number }
): Promise<{ ok?: boolean; error?: string; item?: { id: string; url: string; kind: string; width: number | null; height: number | null } }> {
  const check = await requireEditableFamily(String(familySlug || ""));
  if ("error" in check) return { error: check.error };
  const url = String(input?.url || "");
  if (!isBlobUrl(url)) return { error: "Fayl manzili noto'g'ri." };
  const kind = input?.kind === "video" ? "video" : "photo";
  try {
    const item = await addMedia(check.family.id, check.session.id, {
      url,
      kind,
      width: Number.isFinite(input?.width) ? Number(input.width) : null,
      height: Number.isFinite(input?.height) ? Number(input.height) : null,
    });
    return { ok: true, item: { id: item.id, url: item.url, kind: item.kind, width: item.width, height: item.height } };
  } catch {
    return { error: "Faylni kutubxonaga qo'shib bo'lmadi." };
  }
}

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
  let reuseEmptyFirstPage = false;

  if (!albumId) {
    if (!newAlbumTitle) return { error: "Albom tanlang yoki yangi albom nomini kiriting." };
    const newAlbum = await createAlbum(check.family.id, check.session.id, { title: newAlbumTitle });
    albumId = newAlbum.id;
    reuseEmptyFirstPage = true;
  }

  const album = await getAlbumById(albumId, check.family.id);
  if (!album) return { error: "Albom topilmadi." };

  // Yangi albom yaratilganda uning bo'sh birinchi sahifasini rasmli sahifa bilan almashtiramiz.
  const emptyFirstPages = reuseEmptyFirstPage ? await getPagesForAlbum(albumId) : [];

  let coverUrl = album.cover_url;
  for (const file of files) {
    try {
      const blob = await put(`albums/${albumId}/${Date.now()}-${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
      });
      await createPhotoPage(albumId, blob.url);
      await addMedia(check.family.id, check.session.id, { url: blob.url, kind: "photo" });
      if (!coverUrl) {
        coverUrl = blob.url;
        await setAlbumCover(albumId, blob.url);
      }
    } catch {
      return { error: "Rasm yuklashda xato yuz berdi. Vercel Blob sozlanganligini tekshiring." };
    }
  }

  if (emptyFirstPages.length > 0) {
    const pages = await getPagesForAlbum(albumId);
    const keep = pages.filter((p) => !emptyFirstPages.some((e) => e.id === p.id));
    if (keep.length > 0) {
      await saveAlbumState(albumId, check.family.id, { pageOrder: keep.map((p) => p.id), pages: [] });
    }
  }

  revalidatePath(`/${familySlug}/dashboard`);
  refresh();
  return { ok: true, albumId };
}

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
    refresh();
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
    refresh();
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
    refresh();
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Rasm yuklashda xato: " + String(e) };
  }
}

export async function deleteMemoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const check = await verifyFamilyAccess(formData, "member");
  if (!check.ok) return { error: check.error };

  const memoryId = String(formData.get("memoryId") || "").trim();
  if (!memoryId) return { error: "Xotira ID kerak." };

  try {
    await deleteMemory(memoryId, check.family.id);
    revalidatePath(`/${check.family.slug}/dashboard`);
    refresh();
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Xotira o'chirishda xato: " + String(e) };
  }
}

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
    refresh();
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
    refresh();
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
    refresh();
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
    refresh();
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Hikoya o'chirishda xato: " + String(e) };
  }
}

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
    refresh();
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
    refresh();
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
    refresh();
    return { ok: true, familySlug: check.family.slug };
  } catch (e) {
    return { error: "Joy o'chirishda xato: " + String(e) };
  }
}

// ============================================================
// Muqovalar: bosh sahifa banneri va albom muqovasi
// ============================================================

/** Klientda kesilgan JPEG'ni Blob'ga yuklaydi yoki mavjud Blob manzilini qabul qiladi. */
async function resolveCoverImage(formData: FormData, prefix: string): Promise<{ url?: string; error?: string }> {
  const file = formData.get("photo") as File | null;
  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) return { error: "Faqat rasm fayllari qabul qilinadi." };
    if (file.size > 4 * 1024 * 1024) return { error: "Rasm hajmi juda katta." };
    try {
      const blob = await put(`${prefix}-${Date.now()}.jpg`, file, { access: "public", addRandomSuffix: true, contentType: file.type });
      return { url: blob.url };
    } catch {
      return { error: "Rasm yuklashda xato yuz berdi. Vercel Blob sozlanganligini tekshiring." };
    }
  }
  const url = String(formData.get("url") || "");
  if (url && isBlobUrl(url)) return { url };
  return { error: "Rasm tanlanmadi." };
}

export async function setFamilyCoverAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  if (String(formData.get("reset") || "") === "1") {
    await setFamilyCover(check.family.id, null);
  } else {
    const res = await resolveCoverImage(formData, `families/${check.family.id}/cover`);
    if (res.error || !res.url) return { error: res.error };
    await setFamilyCover(check.family.id, res.url);
  }
  revalidatePath(`/${familySlug}/dashboard`);
  return { ok: true };
}

export async function setAlbumCoverAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const familySlug = String(formData.get("familySlug") || "").trim();
  const check = await requireEditableFamily(familySlug);
  if ("error" in check) return { error: check.error };

  const albumId = String(formData.get("albumId") || "").trim();
  const album = albumId ? await getAlbumById(albumId, check.family.id) : null;
  if (!album) return { error: "Albom topilmadi." };

  if (String(formData.get("reset") || "") === "1") {
    await resetAlbumCover(album.id, check.family.id);
  } else {
    const res = await resolveCoverImage(formData, `albums/${album.id}/cover`);
    if (res.error || !res.url) return { error: res.error };
    await setCustomAlbumCover(album.id, check.family.id, res.url);
  }
  revalidatePath(`/${familySlug}/dashboard`);
  return { ok: true };
}

/** Albom uchun faqat ko'rish huquqli havolani yoqadi yoki o'chiradi. */
export async function shareAlbumAction(
  familySlug: string,
  albumId: string,
  enabled: boolean
): Promise<{ ok?: boolean; error?: string; token?: string | null }> {
  const check = await requireEditableFamily(String(familySlug || ""));
  if ("error" in check) return { error: check.error };
  try {
    const token = await setAlbumSharing(String(albumId), check.family.id, !!enabled);
    revalidatePath(`/${check.family.slug}/dashboard`);
    return { ok: true, token };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ulashishni sozlab bo'lmadi." };
  }
}
