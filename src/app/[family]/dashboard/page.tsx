export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFamilyBySlug, getMembership, getMembersForFamily, getActiveInvitesForFamily, getFamilyStats } from "@/lib/family";
import { getPeopleForFamily, getRelationshipsForFamily } from "@/lib/people";
import { getAlbumsForFamily, getPagesForAlbum, getElementsForPages } from "@/lib/albums";
import { getTimelineEventsForFamily } from "@/lib/timeline";
import { getMemoriesForFamily, getOnThisDayMemories } from "@/lib/memories";
import { getStoriesForFamily } from "@/lib/stories";
import { getPlacesForFamily } from "@/lib/places";
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
  applyPageTemplateAction,
  updatePageMetaAction,
  updateElementTextAction,
  saveElementPhotoUrlAction,
  deleteElementAction,
  reorderElementsAction,
  createPlaceAction,
  updatePlaceAction,
  deletePlaceAction,
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
  updateElementPositionAction,
  updateElementCaptionAction,
  updateElementPlaceAction,
  changeZIndexAction,
  duplicateElementAction,
  moveElementUpAction,
  moveElementDownAction,
  changePageBackgroundAction,
  updateElementFrameAction,
  updateElementTextStyleAction,
  updateElementStickerColorAction,
  addStickerElementAction,
  addTextElementAction,
  addPhotoElementAction,
  reorderAlbumPagesAction,
  duplicateAlbumPageAction,
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

  let session = null;
  try {
    session = await getSession();
  } catch {}
  if (!session) {
    try {
      redirect("/login");
    } catch {}
  }

  let family = null;
  let membership = null;
  let people: any[] = [];
  let relationships: any[] = [];
  let albums: any[] = [];
  let members: any[] = [];
  let invites: any[] = [];
  let timelineEvents: any[] = [];
  let memories: any[] = [];
  let onThisDayMemories: any[] = [];
  let stories: any[] = [];
  let places: any[] = [];
  let albumsWithPages: any[] = [];
  let stats: any = { peopleCount: 0, albumsCount: 0, pagesCount: 0, photosCount: 0, memoriesCount: 0, storiesCount: 0, eventsCount: 0, placesCount: 0, generationsCount: 0 };

  try {
    family = await getFamilyBySlug(familySlug);
    if (!family) notFound();

    membership = await getMembership(family!.id, session!.id);
    if (!membership) notFound();

    [people, relationships, albums, members, invites, timelineEvents, memories, stories, places, stats] = await Promise.all([
      getPeopleForFamily(family!.id),
      getRelationshipsForFamily(family!.id),
      getAlbumsForFamily(family!.id),
      getMembersForFamily(family!.id),
      getActiveInvitesForFamily(family!.id),
      getTimelineEventsForFamily(family!.id),
      getMemoriesForFamily(family!.id),
      getStoriesForFamily(family!.id),
      getPlacesForFamily(family!.id),
      getFamilyStats(family!.id),
    ]);

    onThisDayMemories = await getOnThisDayMemories(family!.id);

    albumsWithPages = await Promise.all(
      albums.map(async (album) => {
        try {
          const pages = await getPagesForAlbum(album.id);
          const elements = await getElementsForPages(pages.map((p) => p.id));
          return {
            ...album,
            pages: pages.map((page) => ({
              ...page,
              elements: elements.filter((e) => e.page_id === page.id).sort((a, b) => a.slot_index - b.slot_index),
            })),
          };
        } catch {
          return { ...album, pages: [] };
        }
      })
    );
  } catch (err) {
    try {
      const { destroySession } = await import("@/lib/session");
      await destroySession();
    } catch {}
    try {
      redirect("/login");
    } catch {}
  }

  const mePerson = people.find((p) => p.linked_user_id === session!.id) ?? null;

  return (
    <HeirloomApp
  userName={session!.name.split(" ")[0]}
  userEmail={session!.email}
  familyName={family!.name}
  familySince={new Date(family!.created_at).getFullYear()}
  familySlug={family!.slug}
  people={people}
  relationships={relationships}
  albums={albumsWithPages}
  members={members}
  invites={invites}
  timelineEvents={timelineEvents}
  memories={memories}
  onThisDayMemories={onThisDayMemories}
  stories={stories}
  places={places}
  stats={stats}
  activeAlbumId={activeAlbumId ?? null}
  canEdit={membership!.role !== "viewer"}
  isOwner={membership!.role === "owner"}
  canInvite={membership!.role === "owner" || membership!.role === "editor"}
  mePersonId={mePerson?.id ?? null}
  initialView={
    view === "tree" ? "tree"
    : view === "albums" ? "albums"
    : view === "people" ? "people"
    : view === "settings" ? "settings"
    : view === "timeline" ? "timeline"
    : view === "memories" ? "memories"
    : view === "stories" ? "stories"
    : view === "places" ? "places"
    : "dashboard"
  }
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
  applyPageTemplateAction={applyPageTemplateAction}
  updatePageMetaAction={updatePageMetaAction}
  updateElementTextAction={updateElementTextAction}
  saveElementPhotoUrlAction={saveElementPhotoUrlAction}
  deleteElementAction={deleteElementAction}
  reorderElementsAction={reorderElementsAction}
  updateElementPositionAction={updateElementPositionAction}
  updateElementCaptionAction={updateElementCaptionAction}
  updateElementPlaceAction={updateElementPlaceAction}
  changeZIndexAction={changeZIndexAction}
  duplicateElementAction={duplicateElementAction}
  moveElementUpAction={moveElementUpAction}
  moveElementDownAction={moveElementDownAction}
  changePageBackgroundAction={changePageBackgroundAction}
  updateElementFrameAction={updateElementFrameAction}
  updateElementTextStyleAction={updateElementTextStyleAction}
  updateElementStickerColorAction={updateElementStickerColorAction}
  addStickerElementAction={addStickerElementAction}
  addTextElementAction={addTextElementAction}
  addPhotoElementAction={addPhotoElementAction}
  createPlaceAction={createPlaceAction}
  updatePlaceAction={updatePlaceAction}
  deletePlaceAction={deletePlaceAction}
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
  reorderAlbumPagesAction={reorderAlbumPagesAction}
  duplicateAlbumPageAction={duplicateAlbumPageAction}
/>
  );
}