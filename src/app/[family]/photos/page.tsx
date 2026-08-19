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

  let session = null;
  try {
    session = await getSession();
  } catch {}
  if (!session) {
    try {
      redirect("/login");
    } catch {}
  }

  let photos: any[] = [];
  let locations: any[] = [];

  try {
    const family = await getFamilyBySlug(familySlug);
    if (!family) notFound();

    const membership = await getMembership(family.id, session!.id);
    if (!membership) notFound();

    [photos, locations] = await Promise.all([
      getPhotosForFamily(family.id),
      getPhotoLocations(family.id),
    ]);
  } catch {
    try {
      const { destroySession } = await import("@/lib/session");
      await destroySession();
    } catch {}
    try {
      redirect("/login");
    } catch {}
  }

  return <PhotoGallery photos={photos} locations={locations} />;
}
