export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamiliesForUser } from "@/lib/family";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const families = await getFamiliesForUser(session.id);
  if (families.length > 0) {
    redirect(`/${families[0].slug}/dashboard`);
  }

  return <OnboardingForm userName={session.name.split(" ")[0]} />;
}
