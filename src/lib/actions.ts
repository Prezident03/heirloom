"use server";

import { redirect } from "next/navigation";
import { findUserByEmail, createUser } from "@/lib/user";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, getSession } from "@/lib/session";
import { createFamily, getFamiliesForUser, getFamilyBySlug, getMembership, updateFamilyName } from "@/lib/family";
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
  type LayoutId,
} from "@/lib/albums";
import { put } from "@vercel/blob";

export type ActionState = { error?: string; ok?: boolean; familySlug?: string; mePersonId?: string; albumId?: string } | undefined;

export async function registerAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

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
  await createSession(user.id);
  redirect("/onboarding");
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const user = await findUserByEmail(email);
  if (!user) {
    return { error: "Email yoki parol noto'g'ri." };
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "Email yoki parol noto'g'ri." };
  }

  await createSession(user.id);

  const families = await getFamiliesForUser(user.id);
  if (families.length === 0) {
    redirect("/onboarding");
  }
  redirect(`/${families[0].slug}/dashboard`);
}

export async function createFamilyAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const familyName = String(formData.get("familyName") || "").trim();
  if (!familyName) {
    return { error: "Oila nomini kiriting." };
  }

  const family = await createFamily(familyName, session.id);

  // Foydalanuvchining o'zini oila daraxtiga "Men" sifatida avtomatik qo'shamiz —
  // shunda daraxt boshidanoq ankor nuqtaga ega bo'ladi va qarindoshlik
  // nomlari (Otasi, Akasi va h.k.) shu nuqtadan hisoblanadi.
  const [firstName, ...rest] = session.name.trim().split(" ");
  const mePerson = await createPerson(
    family.id,
    { firstName: firstName || session.name, lastName: rest.join(" ") || undefined },
    session.id,
    session.id
  );

  // Onboarding wizard shu natijadan foydalanib, sahifani tark etmasdan
  // keyingi qadamga (oila a'zosi qo'shish) o'tadi.
  return { ok: true, familySlug: family.slug, mePersonId: mePerson.id };
}

export async function logoutAction() {
  await destroySession();
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
