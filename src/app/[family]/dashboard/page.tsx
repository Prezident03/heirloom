<HeirloomApp
  userName={session!.name.split(" ")[0]}
  userEmail={session!.email}
  familyName={family!.name}
  familySince={new Date(family!.created_at).getFullYear()}
  familySlug={family!.slug}
  people={people as any}
  relationships={relationships as any}
  albums={albumsWithPages as any}
  members={members as any}
  invites={invites as any}
  timelineEvents={timelineEvents as any}
  memories={memories as any}
  onThisDayMemories={onThisDayMemories as any}
  stories={stories as any}
  places={places as any}
  stats={stats as any}
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