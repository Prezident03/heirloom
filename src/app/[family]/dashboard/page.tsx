export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamilyBySlug, getMembership, getMembersForFamily, getActiveInvitesForFamily } from "@/lib/family";
import { getPeopleForFamily, getRelationshipsForFamily } from "@/lib/people";
import { getAlbumsForFamily, getPagesForAlbum, getElementsForPages } from "@/lib/albums";
import { getTimelineEventsForFamily } from "@/lib/timeline";
import { getMemoriesForFamily } from "@/lib/memories";
import { getStoriesForFamily } from "@/lib/stories";
import HeirloomApp from "@/components/HeirloomApp";
import {
  logoutAction,
  updateFamilyNameAction,
  updateMemberRoleAction,
  removeMemberAction,
  createInviteAction,
  revokeInviteAction,
  addPersonAction,
  linkPersonAction,
  editPersonAction,
  deletePersonAction,
  uploadPersonPhotoAction,
  createAlbumAction,
  deleteAlbumAction,
  addAlbumPageAction,
  deleteAlbumPageAction,
  changePageLayoutAction,
  updatePageMetaAction,
  updateElementTextAction,
  uploadElementPhotoAction,
  deleteElementAction,
  bulkUploadPhotosAction,
  createTimelineEventAction,
  updateTimelineEventAction,
  deleteTimelineEventAction,
  uploadTimelineEventPhotoAction,
  createMemoryAction,
  updateMemoryAction,
  updateMemoryPhotoAction,
  deleteMemoryAction,
  createStoryAction,
  updateStoryAction,
  updateStoryPhotoAction,
  deleteStoryAction,
} from "@/lib/actions";

export default async function FamilyDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ family: string }>;
  searchParams: Promise<{ view?: string; album?: string }>;
}) {
  const { family: familySlug } = await params;
  const { view, album: activeAlbumId } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const family = await getFamilyBySlug(familySlug);
  if (!family) notFound();

  const membership = await getMembership(family.id, session.id);
  if (!membership) notFound();

  const [people, relationships, albums, members, invites, timelineEvents, memories, stories] = await Promise.all([
    getPeopleForFamily(family.id),
    getRelationshipsForFamily(family.id),
    getAlbumsForFamily(family.id),
    getMembersForFamily(family.id),
    getActiveInvitesForFamily(family.id),
    getTimelineEventsForFamily(family.id),
    getMemoriesForFamily(family.id),
    getStoriesForFamily(family.id),
  ]);

  // Har bir albom uchun sahifa va elementlarni yig'amiz (nested struktura,
  // shunda client komponentda alohida so'rov qilishning hojati yo'q).
  const albumsWithPages = await Promise.all(
    albums.map(async (album) => {
      const pages = await getPagesForAlbum(album.id);
      const elements = await getElementsForPages(pages.map((p) => p.id));
      return {
        ...album,
        pages: pages.map((page) => ({
          ...page,
          elements: elements.filter((e) => e.page_id === page.id).sort((a, b) => a.slot_index - b.slot_index),
        })),
      };
    })
  );

  const mePerson = people.find((p) => p.linked_user_id === session.id) ?? null;

  return (
    <HeirloomApp
      userName={session.name.split(" ")[0]}
      userEmail={session.email}
      familyName={family.name}
      familySince={new Date(family.created_at).getFullYear()}
      familySlug={family.slug}
      people={people}
      relationships={relationships}
      albums={albumsWithPages}
      members={members}
      invites={invites}
      timelineEvents={timelineEvents}
      memories={memories}
      stories={stories}
      activeAlbumId={activeAlbumId ?? null}
      canEdit={membership.role !== "viewer"}
      isOwner={membership.role === "owner"}
      canInvite={membership.role === "owner" || membership.role === "editor"}
      mePersonId={mePerson?.id ?? null}
      initialView={view === "tree" ? "tree" : view === "albums" ? "albums" : view === "people" ? "people" : view === "settings" ? "settings" : view === "timeline" ? "timeline" : "dashboard"}
      onLogout={logoutAction}
      updateFamilyNameAction={updateFamilyNameAction}
      updateMemberRoleAction={updateMemberRoleAction}
      removeMemberAction={removeMemberAction}
      createInviteAction={createInviteAction}
      revokeInviteAction={revokeInviteAction}
      addPersonAction={addPersonAction}
      linkPersonAction={linkPersonAction}
      editPersonAction={editPersonAction}
      deletePersonAction={deletePersonAction}
      uploadPersonPhotoAction={uploadPersonPhotoAction}
      createAlbumAction={createAlbumAction}
      deleteAlbumAction={deleteAlbumAction}
      addAlbumPageAction={addAlbumPageAction}
      deleteAlbumPageAction={deleteAlbumPageAction}
      changePageLayoutAction={changePageLayoutAction}
      updatePageMetaAction={updatePageMetaAction}
      updateElementTextAction={updateElementTextAction}
      uploadElementPhotoAction={uploadElementPhotoAction}
      deleteElementAction={deleteElementAction}
      bulkUploadPhotosAction={bulkUploadPhotosAction}
      createTimelineEventAction={createTimelineEventAction}
      updateTimelineEventAction={updateTimelineEventAction}
      deleteTimelineEventAction={deleteTimelineEventAction}
      uploadTimelineEventPhotoAction={uploadTimelineEventPhotoAction}
      createMemoryAction={createMemoryAction}
      updateMemoryAction={updateMemoryAction}
      updateMemoryPhotoAction={updateMemoryPhotoAction}
      deleteMemoryAction={deleteMemoryAction}
      createStoryAction={createStoryAction}
      updateStoryAction={updateStoryAction}
      updateStoryPhotoAction={updateStoryPhotoAction}
      deleteStoryAction={deleteStoryAction}
    />
  );
}
