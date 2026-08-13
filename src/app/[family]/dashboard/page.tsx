export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamilyBySlug, getMembership } from "@/lib/family";
import HeirloomApp from "@/components/HeirloomApp";
import { logoutAction } from "@/lib/actions";

export default async function FamilyDashboardPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familySlug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const family = await getFamilyBySlug(familySlug);
  if (!family) notFound();

  const membership = await getMembership(family.id, session.id);
  if (!membership) notFound();

  return (
    <HeirloomApp
      userName={session.name.split(" ")[0]}
      familyName={family.name}
      onLogout={logoutAction}
    />
  );
}
