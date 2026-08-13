"use server";

import { redirect } from "next/navigation";
import { findUserByEmail, createUser } from "@/lib/user";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, getSession } from "@/lib/session";
import { createFamily, getFamiliesForUser, getFamilyBySlug, getMembership } from "@/lib/family";
import {
  createPerson,
  createRelationship,
  updatePerson,
  updatePersonPhoto,
  deletePerson,
  type RelationshipType,
} from "@/lib/people";
import { put } from "@vercel/blob";

export type ActionState = { error?: string } | undefined;

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
  await createPerson(
    family.id,
    { firstName: firstName || session.name, lastName: rest.join(" ") || undefined },
    session.id,
    session.id
  );

  redirect(`/${family.slug}/dashboard`);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
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

  if (relatedPersonId && (relationType === "child_of" || relationType === "spouse_of")) {
    const type: RelationshipType = relationType === "child_of" ? "parent" : "spouse";
    if (type === "parent") {
      // relatedPerson is the parent, new person is the child
      await createRelationship(family.id, relatedPersonId, person.id, "parent");
    } else {
      await createRelationship(family.id, person.id, relatedPersonId, "spouse");
    }
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
