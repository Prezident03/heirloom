export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamilyBySlug, getMembership } from "@/lib/family";
import { getPhotosForFamily, getPhotoLocations } from "@/lib/photos";
import { PhotoGallery } from "@/components/PhotoGallery";

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ family: string }>;
}) {
  const { family: familySlug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const family = await getFamilyBySlug(familySlug);
  if (!family) notFound();

  const membership = await getMembership(family.id, session.id);
  if (!membership) notFound();

  const [photos, locations] = await Promise.all([
    getPhotosForFamily(family.id),
    getPhotoLocations(family.id),
  ]);

  return <PhotoGallery photos={photos} locations={locations} />;
}
