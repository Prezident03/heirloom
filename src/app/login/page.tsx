export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { loginAction } from "@/lib/actions";
import { getSession } from "@/lib/session";
import { getFamiliesForUser } from "@/lib/family";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    const families = await getFamiliesForUser(session.id);
    redirect(families.length > 0 ? `/${families[0].slug}/dashboard` : "/onboarding");
  }

  return (
    <AuthForm
      action={loginAction}
      title="Xush kelibsiz"
      subtitle="Oilaviy xotiralaringizga qaytish uchun kiring."
      submitLabel="Kirish"
      fields={[
        { name: "email", label: "Email", type: "email", placeholder: "siz@example.com" },
        { name: "password", label: "Parol", type: "password", placeholder: "Parolingiz" },
      ]}
      footer={
        <>
          Akkountingiz yo'qmi?{" "}
          <Link className="fm-auth-link" href="/register">
            Ro'yxatdan o'tish
          </Link>
        </>
      }
    />
  );
}
