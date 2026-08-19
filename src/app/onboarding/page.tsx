export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamiliesForUser } from "@/lib/family";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  let session = null;
  try {
    session = await getSession();
  } catch {}
  if (!session) {
    try {
      redirect("/login");
    } catch {}
  }

  try {
    const families = await getFamiliesForUser(session!.id);
    if (families.length > 0) {
      redirect(`/${families[0].slug}/dashboard`);
    }
  } catch {
    try {
      const { destroySession } = await import("@/lib/session");
      await destroySession();
      redirect("/login");
    } catch {}
  }

  return <OnboardingForm userName={session!.name.split(" ")[0]} />;
}
