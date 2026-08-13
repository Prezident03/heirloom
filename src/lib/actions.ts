"use server";

import { redirect } from "next/navigation";
import { findUserByEmail, createUser } from "@/lib/user";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession, getSession } from "@/lib/session";
import { createFamily, getFamiliesForUser } from "@/lib/family";

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
  redirect(`/${family.slug}/dashboard`);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
