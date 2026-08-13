export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamilyBySlug, getMembership } from "@/lib/family";
import { getPeopleForFamily, getRelationshipsForFamily } from "@/lib/people";
import HeirloomApp from "@/components/HeirloomApp";
import { logoutAction, addPersonAction, linkPersonAction } from "@/lib/actions";

export default async function FamilyDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ family: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { family: familySlug } = await params;
  const { view } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const family = await getFamilyBySlug(familySlug);
  if (!family) notFound();

  const membership = await getMembership(family.id, session.id);
  if (!membership) notFound();

  const [people, relationships] = await Promise.all([
    getPeopleForFamily(family.id),
    getRelationshipsForFamily(family.id),
  ]);

  return (
    <HeirloomApp
      userName={session.name.split(" ")[0]}
      familyName={family.name}
      familySlug={family.slug}
      people={people}
      relationships={relationships}
      canEdit={membership.role !== "viewer"}
      initialView={view === "tree" ? "tree" : view === "albums" ? "albums" : "dashboard"}
      onLogout={logoutAction}
      addPersonAction={addPersonAction}
      linkPersonAction={linkPersonAction}
    />
  );
}
