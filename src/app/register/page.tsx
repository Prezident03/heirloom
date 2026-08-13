export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { registerAction } from "@/lib/actions";
import { getSession } from "@/lib/session";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/onboarding");

  return (
    <AuthForm
      action={registerAction}
      title="Oilangiz tarixini boshlang"
      subtitle="Heirloom'da hisob yarating — bir necha daqiqada."
      submitLabel="Ro'yxatdan o'tish"
      fields={[
        { name: "name", label: "Ismingiz", type: "text", placeholder: "Abdurasul Zokirov" },
        { name: "email", label: "Email", type: "email", placeholder: "siz@example.com" },
        { name: "password", label: "Parol", type: "password", placeholder: "Kamida 6 ta belgi" },
      ]}
      footer={
        <>
          Akkountingiz bormi?{" "}
          <Link className="fm-auth-link" href="/login">
            Kirish
          </Link>
        </>
      }
    />
  );
}
