export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/lib/actions";
import { getSession } from "@/lib/session";
import { getFamiliesForUser } from "@/lib/family";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  let session = null;
  try {
    session = await getSession();
  } catch {}
  if (session) {
    try {
      const families = await getFamiliesForUser(session.id);
      redirect(families.length > 0 ? `/${families[0].slug}/dashboard` : "/onboarding");
    } catch {
      try {
        const { destroySession } = await import("@/lib/session");
        await destroySession();
      } catch {}
    }
  }

  return (
    <AuthForm
      action={loginAction}
      title="Xush kelibsiz"
      subtitle={invite ? "Sizni oilaga qo'shilishga taklif qilishdi. Davom etish uchun kiring." : "Oilaviy xotiralaringizga qaytish uchun kiring."}
      submitLabel="Kirish"
      hiddenFields={invite ? [{ name: "inviteCode", value: invite }] : []}
      fields={[
        { name: "email", label: "Email", type: "email", placeholder: "siz@example.com" },
        { name: "password", label: "Parol", type: "password", placeholder: "Parolingiz" },
      ]}
      footer={
        <>
          Akkountingiz yo'qmi?{" "}
          <Link className="fm-auth-link" href={invite ? `/register?invite=${invite}` : "/register"}>
            Ro'yxatdan o'tish
          </Link>
        </>
      }
    />
  );
}
