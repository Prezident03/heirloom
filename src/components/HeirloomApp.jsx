"use client";

import React, { useState, useRef, useEffect, useActionState } from "react";
import {
  Home, BookImage, TreePine, Plus, X,
  MapPinned, Settings, LogOut, Camera, Users,
  History, Link2, Images,
} from "lucide-react";
import { TOKENS, FONT_IMPORT, inputStyle } from "@/lib/uiTokens";
import { relationLabelBetween, personLabel, personYears } from "@/lib/relationshipLabels";
import { MemoriesView, AddMemoryModal } from "./MemoriesView";
import { StoriesView, AddStoryModal } from "./StoriesView";
import { PlacesView, AddPlaceModal } from "./PlacesView";
import { SettingsView } from "./SettingsView";
import { DashboardView } from "./DashboardView";
import { VIEWS } from "./shared";
import { AlbumsView, CreateAlbumModal, UploadPhotosModal } from "./AlbumEditor";
import { TimelineView, AddTimelineEventModal } from "./TimelineView";
import { FamilyTreeView } from "./FamilyTreeView";
import { PersonDetailPanel, EmptyFamilyTree, AddPersonModal, EditPersonModal, LinkPersonModal, PeopleView } from "./PersonComponents";

const NAV_CONFIG = [
  { id: VIEWS.DASHBOARD, icon: Home, label: "Bosh sahifa" },
  { id: VIEWS.ALBUMS, icon: BookImage, label: "Albomlar" },
  { id: VIEWS.TREE, icon: TreePine, label: "Oila daraxti" },
  { id: VIEWS.PEOPLE, icon: Users, label: "Odamlar" },
  { id: VIEWS.TIMELINE, icon: History, label: "Vaqt chizig'i" },
  { id: VIEWS.MEMORIES, icon: Camera, label: "Xotiralar" },
  { id: VIEWS.STORIES, icon: Link2, label: "Hikoyalar" },
  { id: VIEWS.PLACES, icon: MapPinned, label: "Joylar" },
];

/* ---------------- shared bits ---------------- */

function GlobalStyle() {
  return (
    <style>{`
      ${FONT_IMPORT}
      * { box-sizing: border-box; }
      .fm-scroll::-webkit-scrollbar { height: 6px; }
      .fm-scroll::-webkit-scrollbar-thumb { background: ${TOKENS.goldSoft}; border-radius: 10px; }
      .fm-scroll { scrollbar-width: thin; scrollbar-color: ${TOKENS.goldSoft} transparent; }
      .fm-polaroid {
        background: ${TOKENS.card};
        padding: 8px 8px 4px;
        border-radius: 4px;
        box-shadow: 0 6px 16px rgba(30,38,33,0.12), 0 1px 2px rgba(30,38,33,0.08);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
        cursor: pointer;
      }
      .fm-polaroid:hover { transform: rotate(0deg) translateY(-4px) scale(1.02) !important; box-shadow: 0 14px 28px rgba(30,38,33,0.18); }
      .fm-nav-item {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px; border-radius: 8px;
        color: rgba(242,237,226,0.72);
        font-size: 13.5px; font-weight: 500;
        cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
        white-space: nowrap; position: relative;
      }
      .fm-nav-item:hover { background: rgba(242,237,226,0.08); color: ${TOKENS.parchment}; }
      .fm-nav-item.active { background: rgba(184,134,59,0.18); color: ${TOKENS.goldSoft}; }
      .fm-nav-item.soon { opacity: 0.45; cursor: default; }
      .fm-link { background: none; border: none; cursor: pointer; font-size: 12.5px; font-weight: 600; color: ${TOKENS.teal}; display: flex; align-items: center; }
      .fm-link:hover { color: ${TOKENS.gold}; }
      .fm-album-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
      .fm-album-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(30,38,33,0.14); }
      .fm-relation-option { transition: background 0.15s ease, border-color 0.15s ease; }
      .fm-relation-option:hover { background: ${TOKENS.parchment}; border-color: ${TOKENS.gold}; }
      .fm-person-grid-card { transition: opacity 0.15s ease; }
      .fm-person-grid-card:hover { opacity: 0.8; }
      .fm-person { display: flex; align-items: center; gap: 10px; background: ${TOKENS.card}; border-radius: 30px; padding: 5px 16px 5px 5px; cursor: pointer; box-shadow: 0 2px 6px rgba(30,38,33,0.07); transition: transform 0.18s ease, box-shadow 0.18s ease; max-width: 210px; }
      .fm-person.fm-person-highlight { animation: fm-highlight-pulse 1.4s ease-out 1; }
      @keyframes fm-highlight-pulse {
        0% { box-shadow: 0 0 0 0 rgba(184,134,59,0.55); }
        70% { box-shadow: 0 0 0 12px rgba(184,134,59,0); }
        100% { box-shadow: 0 2px 6px rgba(30,38,33,0.07); }
      }
      .fm-tree-viewport {
        background-image: radial-gradient(circle, ${TOKENS.parchmentDeep} 1px, transparent 1px);
        background-size: 22px 22px;
        cursor: grab;
      }
      .fm-tree-viewport.dragging { cursor: grabbing; }
      .fm-tree-zoom-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: ${TOKENS.card}; border: 1px solid ${TOKENS.parchmentDeep}; border-radius: 7px; cursor: pointer; color: ${TOKENS.ink}; font-size: 14px; font-weight: 600; user-select: none; }
      .fm-tree-zoom-btn:hover { background: ${TOKENS.parchment}; }
      .fm-tree-toolbar-btn { display: flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; background: ${TOKENS.card}; border: 1px solid ${TOKENS.parchmentDeep}; border-radius: 8px; cursor: pointer; color: ${TOKENS.ink}; font-size: 12.5px; font-weight: 600; }
      .fm-tree-toolbar-btn:hover { background: ${TOKENS.parchment}; }
      .fm-person:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(30,38,33,0.15); }
      .fm-couple { display: flex; align-items: center; gap: 8px; }
      .fm-couple-link { width: 14px; height: 1.5px; background: ${TOKENS.goldSoft}; flex-shrink: 0; }
      .fm-fade { animation: fm-fade-in 0.35s ease; }
      .fm-panel-enter { animation: fm-slide-in 0.28s ease; }
      @keyframes fm-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fm-slide-in { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @media (prefers-reduced-motion: reduce) {
        .fm-polaroid, .fm-album-card, .fm-person, .fm-fade, .fm-panel-enter { transition: none !important; animation: none !important; }
      }

      /* ---- Mobile: app-like bottom nav + top bar (360px'dan boshlab) ---- */
      .fm-mobile-topbar {
        display: none;
        align-items: center; justify-content: space-between;
        padding: 12px 16px;
        background: ${TOKENS.card};
        border-bottom: 1px solid ${TOKENS.parchmentDeep};
        position: sticky; top: 0; z-index: 20;
      }
      .fm-mobile-bottomnav {
        display: none;
        position: fixed; left: 0; right: 0; bottom: 0;
        background: ${TOKENS.ink};
        padding: 7px 4px calc(6px + env(safe-area-inset-bottom));
        z-index: 30;
        justify-content: space-around;
        align-items: center;
        box-shadow: 0 -6px 20px rgba(0,0,0,0.18);
      }
      .fm-mobile-nav-item {
        display: flex; flex-direction: column; align-items: center; gap: 3px;
        background: none; border: none; color: rgba(242,237,226,0.55);
        font-size: 9.5px; font-weight: 600; cursor: pointer; padding: 5px 12px;
      }
      .fm-mobile-nav-item.active { color: ${TOKENS.goldSoft}; }
      @media (max-width: 768px) {
        .fm-desktop-sidebar { display: none !important; }
        .fm-mobile-topbar { display: flex; }
        .fm-mobile-bottomnav { display: flex; }
        .fm-main { padding-bottom: 76px; }
      }
    `}</style>
  );
}

function Sidebar({ current, onNavigate, onLogout, familySlug }) {
  return (
    <aside className="fm-desktop-sidebar" style={{ width: 220, background: TOKENS.ink, padding: "26px 14px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 10px 28px" }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})` }} />
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: TOKENS.parchment, fontWeight: 600 }}>Heirloom</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_CONFIG.map((item) => (
          <div
            key={item.id}
            className={`fm-nav-item ${current === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={16} strokeWidth={2} />
            {item.label}
          </div>
        ))}
        <a href={`/${familySlug}/photos`} className="fm-nav-item" style={{ textDecoration: "none" }}>
          <Images size={16} strokeWidth={2} />
          Rasmlar
        </a>
      </nav>
      <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(242,237,226,0.1)" }}>
        <div
          className={`fm-nav-item ${current === VIEWS.SETTINGS ? "active" : ""}`}
          onClick={() => onNavigate(VIEWS.SETTINGS)}
        >
          <Settings size={16} /> Sozlamalar
        </div>
        <div className="fm-nav-item" onClick={onLogout}>
          <LogOut size={16} /> Chiqish
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Mobile top bar + bottom nav ---------------- */

function MobileTopBar({ familyName, familySlug, onLogout }) {
  return (
    <div className="fm-mobile-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: `linear-gradient(135deg, ${TOKENS.gold}, ${TOKENS.goldSoft})`, flexShrink: 0 }} />
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 15, fontWeight: 600, color: TOKENS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{familyName}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        <a href={`/${familySlug}/photos`} title="Rasmlar" style={{ background: "none", border: "none", color: TOKENS.ink60, cursor: "pointer", padding: 6, display: "flex" }}>
          <Images size={17} />
        </a>
        <button onClick={onLogout} title="Chiqish" style={{ background: "none", border: "none", color: TOKENS.ink60, cursor: "pointer", padding: 6 }}>
          <LogOut size={17} />
        </button>
      </div>
    </div>
  );
}

const MOBILE_NAV_ITEMS = [
  { id: VIEWS.DASHBOARD, icon: Home, label: "Bosh sahifa" },
  { id: VIEWS.ALBUMS, icon: BookImage, label: "Albomlar" },
  { id: VIEWS.TREE, icon: TreePine, label: "Oila" },
  { id: VIEWS.PEOPLE, icon: Users, label: "Odamlar" },
  { id: VIEWS.TIMELINE, icon: History, label: "Tarix" },
  { id: VIEWS.MEMORIES, icon: Camera, label: "Xotiralar" },
  { id: VIEWS.STORIES, icon: Link2, label: "Hikoyalar" },
  { id: VIEWS.PLACES, icon: MapPinned, label: "Joylar" },
];

function MobileBottomNav({ current, onNavigate }) {
  return (
    <nav className="fm-mobile-bottomnav">
      {MOBILE_NAV_ITEMS.map((it) => (
        <button key={it.id} onClick={() => onNavigate(it.id)} className={`fm-mobile-nav-item ${current === it.id ? "active" : ""}`}>
          <it.icon size={20} strokeWidth={current === it.id ? 2.3 : 1.8} />
          <span>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}



/* ---------------- Root app ---------------- */

/**
 * @param {{
 *   userName?: string,
 *   userEmail?: string,
 *   familyName?: string,
 *   familySince?: number | null,
 *   familySlug?: string,
 *   people?: any[],
 *   relationships?: any[],
 *   albums?: any[],
 *   members?: any[],
 *   invites?: any[],
 *   timelineEvents?: any[],
 *   memories?: any[],
 *   activeAlbumId?: string | null,
 *   canEdit?: boolean,
 *   isOwner?: boolean,
 *   canInvite?: boolean,
 *   mePersonId?: string | null,
 *   initialView?: string,
 *   onLogout?: any,
 *   updateFamilyNameAction?: any,
 *   updateMemberRoleAction?: any,
 *   removeMemberAction?: any,
 *   createInviteAction?: any,
 *   revokeInviteAction?: any,
 *   addPersonAction?: any,
 *   linkPersonAction?: any,
 *   editPersonAction?: any,
 *   deletePersonAction?: any,
 *   uploadPersonPhotoAction?: any,
 *   createAlbumAction?: any,
 *   deleteAlbumAction?: any,
 *   addAlbumPageAction?: any,
 *   deleteAlbumPageAction?: any,
 *   changePageLayoutAction?: any,
 *   updatePageMetaAction?: any,
 *   updateElementTextAction?: any,
 *   saveElementPhotoUrlAction?: any,
 *   bulkUploadPhotosAction?: any,
 *   createTimelineEventAction?: any,
 *   updateTimelineEventAction?: any,
 *   deleteTimelineEventAction?: any,
 *   uploadTimelineEventPhotoAction?: any,
 *   createMemoryAction?: any,
 *   updateMemoryAction?: any,
 *   updateMemoryPhotoAction?: any,
 *   deleteMemoryAction?: any,
 * }} props
 */
/**
 * @typedef {Object} HeirloomAppProps
 * @property {string} [userName]
 * @property {string} [userEmail]
 * @property {string} [familyName]
 * @property {number | null} [familySince]
 * @property {string} [familySlug]
 * @property {any[]} [people]
 * @property {any[]} [relationships]
 * @property {any[]} [albums]
 * @property {any[]} [members]
 * @property {any[]} [invites]
 * @property {any[]} [timelineEvents]
 * @property {any[]} [memories]
 * @property {any[]} [onThisDayMemories]
 * @property {any[]} [stories]
 * @property {any[]} [places]
 * @property {{peopleCount:number,albumsCount:number,pagesCount:number,photosCount:number,memoriesCount:number,storiesCount:number,eventsCount:number,placesCount:number,generationsCount:number}} [stats]
 * @property {string | null} [activeAlbumId]
 * @property {boolean} [canEdit]
 * @property {boolean} [isOwner]
 * @property {boolean} [canInvite]
 * @property {string | null} [mePersonId]
 * @property {string} [initialView]
 * @property {Function} [onLogout]
 * @property {Function} [updateFamilyNameAction]
 * @property {Function} [updateMemberRoleAction]
 * @property {Function} [removeMemberAction]
 * @property {Function} [createInviteAction]
 * @property {Function} [revokeInviteAction]
 * @property {Function} [addPersonAction]
 * @property {Function} [linkPersonAction]
 * @property {Function} [editPersonAction]
 * @property {Function} [deletePersonAction]
 * @property {Function} [uploadPersonPhotoAction]
 * @property {Function} [createAlbumAction]
 * @property {Function} [deleteAlbumAction]
 * @property {Function} [addAlbumPageAction]
 * @property {Function} [deleteAlbumPageAction]
 * @property {Function} [changePageLayoutAction]
 * @property {Function} [updatePageMetaAction]
 * @property {Function} [updateElementTextAction]
 * @property {Function} [saveElementPhotoUrlAction]
 * @property {Function} [deleteElementAction]
 * @property {Function} [reorderElementsAction]
 * @property {Function} [updateElementPositionAction]
 * @property {Function} [updateElementCaptionAction]
 * @property {Function} [updateElementPlaceAction]
 * @property {Function} [changeZIndexAction]
 * @property {Function} [duplicateElementAction]
 * @property {Function} [moveElementUpAction]
 * @property {Function} [moveElementDownAction]
 * @property {Function} [changePageBackgroundAction]
 * @property {Function} [updateElementFrameAction]
 * @property {Function} [updateElementTextStyleAction]
 * @property {Function} [updateElementStickerColorAction]
 * @property {Function} [addStickerElementAction]
 * @property {Function} [addTextElementAction]
 * @property {Function} [addPhotoElementAction]
 * @property {Function} [bulkUploadPhotosAction]
 * @property {Function} [createPlaceAction]
 * @property {Function} [updatePlaceAction]
 * @property {Function} [deletePlaceAction]
 * @property {Function} [createTimelineEventAction]
 * @property {Function} [updateTimelineEventAction]
 * @property {Function} [deleteTimelineEventAction]
 * @property {Function} [uploadTimelineEventPhotoAction]
 * @property {Function} [createMemoryAction]
 * @property {Function} [updateMemoryAction]
 * @property {Function} [updateMemoryPhotoAction]
 * @property {Function} [deleteMemoryAction]
 * @property {Function} [createStoryAction]
 * @property {Function} [updateStoryAction]
 * @property {Function} [updateStoryPhotoAction]
 * @property {Function} [deleteStoryAction]
 */

/**
 * @param {HeirloomAppProps} props
 */
export default function HeirloomApp({
  userName = "Foydalanuvchi",
  userEmail = "",
  familyName = "Mening oilam",
  familySince = null,
  familySlug = "",
  people = /** @type {any[]} */ ([]),
  relationships = /** @type {any[]} */ ([]),
  albums = /** @type {any[]} */ ([]),
  members = /** @type {any[]} */ ([]),
  invites = /** @type {any[]} */ ([]),
  timelineEvents = /** @type {any[]} */ ([]),
  memories = /** @type {any[]} */ ([]),
  onThisDayMemories = /** @type {any[]} */ ([]),
  stories = /** @type {any[]} */ ([]),
  places = /** @type {any[]} */ ([]),
  stats = /** @type {{peopleCount:number,albumsCount:number,pagesCount:number,photosCount:number,memoriesCount:number,storiesCount:number,eventsCount:number,placesCount:number,generationsCount:number}} */ ({peopleCount:0,albumsCount:0,pagesCount:0,photosCount:0,memoriesCount:0,storiesCount:0,eventsCount:0,placesCount:0,generationsCount:0}),
  activeAlbumId = null,
  canEdit = true,
  isOwner = false,
  canInvite = false,
  mePersonId = null,
  initialView = "dashboard",
  onLogout,
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
  saveElementPhotoUrlAction,
  deleteElementAction,
  reorderElementsAction,
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
  bulkUploadPhotosAction,
  createPlaceAction,
  updatePlaceAction,
  deletePlaceAction,
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
}) {
  const [view, setView] = useState(
    initialView === "tree" ? VIEWS.TREE
      : initialView === "albums" ? VIEWS.ALBUMS
      : initialView === "people" ? VIEWS.PEOPLE
      : initialView === "settings" ? VIEWS.SETTINGS
      : initialView === "timeline" ? VIEWS.TIMELINE
      : initialView === "memories" ? VIEWS.MEMORIES
      : initialView === "stories" ? VIEWS.STORIES
      : initialView === "places" ? VIEWS.PLACES
      : VIEWS.DASHBOARD
  );
  const [openAlbumId, setOpenAlbumId] = useState(null);
  // Dashboard'dagi "+ Yangi" menyusi qaysi view'da bo'lishidan qat'i nazar
  // ishlashi uchun, create modallarini root darajasida boshqaramiz.
  const [globalModal, setGlobalModal] = useState(/** @type {null | "addPerson" | "createAlbum" | "uploadPhotos" | "addEvent" | "addMemory" | "addStory" | "addPlace"} */ (null));

  const navigate = (target) => {
    if (target === VIEWS.ALBUMS) setOpenAlbumId(null);
    setView(target);
  };

  const openAlbumFromDashboard = (album) => {
    setOpenAlbumId(album.id);
    setView(VIEWS.ALBUMS);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: TOKENS.parchment, height: "100%", color: TOKENS.ink }}>
      <GlobalStyle />
      <div style={{ display: "flex", height: "100%" }}>
        <Sidebar current={view} onNavigate={navigate} onLogout={onLogout} familySlug={familySlug} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%" }}>
          <MobileTopBar familyName={familyName} familySlug={familySlug} onLogout={onLogout} />
          <main className="fm-main" style={{ flex: 1, overflow: "auto" }}>
            {view === VIEWS.DASHBOARD && (
              <DashboardView
                onNavigate={navigate}
                onOpenAlbum={openAlbumFromDashboard}
                onAddPerson={canEdit ? () => setGlobalModal("addPerson") : undefined}
                onCreateAlbum={canEdit ? () => setGlobalModal("createAlbum") : undefined}
                onUploadPhotos={canEdit ? () => setGlobalModal("uploadPhotos") : undefined}
                onAddEvent={canEdit ? () => setGlobalModal("addEvent") : undefined}
                onAddMemory={canEdit ? () => setGlobalModal("addMemory") : undefined}
                onAddStory={canEdit ? () => setGlobalModal("addStory") : undefined}
                onAddPlace={canEdit ? () => setGlobalModal("addPlace") : undefined}
                userName={userName}
                familyName={familyName}
                familySince={familySince}
                people={people}
                relationships={relationships}
                albums={albums}
                timelineEvents={timelineEvents}
                memories={memories}
                stats={stats}
              />
            )}
            {view === VIEWS.TREE && (
              <FamilyTreeView
                familyName={familyName}
                familySlug={familySlug}
                people={people}
                relationships={relationships}
                canEdit={canEdit}
                mePersonId={mePersonId}
                addPersonAction={addPersonAction}
                linkPersonAction={linkPersonAction}
                editPersonAction={editPersonAction}
                deletePersonAction={deletePersonAction}
                uploadPersonPhotoAction={uploadPersonPhotoAction}
              />
            )}
            {view === VIEWS.ALBUMS && (
              <AlbumsView
                albums={albums}
                activeAlbumId={activeAlbumId}
                openAlbumId={openAlbumId}
                setOpenAlbumId={setOpenAlbumId}
                familySlug={familySlug}
                canEdit={canEdit}
                createAlbumAction={createAlbumAction}
                deleteAlbumAction={deleteAlbumAction}
                addAlbumPageAction={addAlbumPageAction}
                deleteAlbumPageAction={deleteAlbumPageAction}
                changePageLayoutAction={changePageLayoutAction}
                saveElementPhotoUrlAction={saveElementPhotoUrlAction}
                updateElementTextAction={updateElementTextAction}
                reorderElementsAction={reorderElementsAction}
                deleteElementAction={deleteElementAction}
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
              />
            )}
            {view === VIEWS.PEOPLE && (
              <PeopleView
                familyName={familyName}
                familySlug={familySlug}
                people={people}
                relationships={relationships}
                canEdit={canEdit}
                mePersonId={mePersonId}
                addPersonAction={addPersonAction}
                linkPersonAction={linkPersonAction}
                editPersonAction={editPersonAction}
                deletePersonAction={deletePersonAction}
                uploadPersonPhotoAction={uploadPersonPhotoAction}
              />
            )}
            {view === VIEWS.TIMELINE && (
              <TimelineView
                familySlug={familySlug}
                people={people}
                timelineEvents={timelineEvents}
                canEdit={canEdit}
                createTimelineEventAction={createTimelineEventAction}
                updateTimelineEventAction={updateTimelineEventAction}
                deleteTimelineEventAction={deleteTimelineEventAction}
                uploadTimelineEventPhotoAction={uploadTimelineEventPhotoAction}
              />
            )}
            {view === VIEWS.MEMORIES && (
              <MemoriesView
                familySlug={familySlug}
                memories={memories}
                onThisDayMemories={onThisDayMemories}
                people={people}
                canEdit={canEdit}
                createMemoryAction={createMemoryAction}
                updateMemoryAction={updateMemoryAction}
                updateMemoryPhotoAction={updateMemoryPhotoAction}
                deleteMemoryAction={deleteMemoryAction}
              />
            )}
            {view === VIEWS.STORIES && (
              <StoriesView
                familySlug={familySlug}
                stories={stories}
                people={people}
                canEdit={canEdit}
                createStoryAction={createStoryAction}
                updateStoryAction={updateStoryAction}
                updateStoryPhotoAction={updateStoryPhotoAction}
                deleteStoryAction={deleteStoryAction}
              />
            )}
            {view === VIEWS.PLACES && (
              <PlacesView
                places={places}
                canEdit={canEdit}
                familySlug={familySlug}
                createPlaceAction={createPlaceAction}
                updatePlaceAction={updatePlaceAction}
                deletePlaceAction={deletePlaceAction}
              />
            )}
            {view === VIEWS.SETTINGS && (
              <SettingsView
                familyName={familyName}
                familySince={familySince}
                familySlug={familySlug}
                members={members}
                invites={invites}
                isOwner={isOwner}
                canInvite={canInvite}
                userEmail={userEmail}
                updateFamilyNameAction={updateFamilyNameAction}
                updateMemberRoleAction={updateMemberRoleAction}
                removeMemberAction={removeMemberAction}
                createInviteAction={createInviteAction}
                revokeInviteAction={revokeInviteAction}
              />
            )}
          </main>
        </div>
      </div>
      <MobileBottomNav current={view} onNavigate={navigate} />

      {globalModal === "addPerson" && (
        <AddPersonModal
          familySlug={familySlug}
          people={people}
          relationships={relationships}
          addPersonAction={addPersonAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "createAlbum" && (
        <CreateAlbumModal
          familySlug={familySlug}
          createAlbumAction={createAlbumAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "uploadPhotos" && (
        <UploadPhotosModal
          familySlug={familySlug}
          albums={albums}
          bulkUploadPhotosAction={bulkUploadPhotosAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "addEvent" && (
        <AddTimelineEventModal
          familySlug={familySlug}
          people={people}
          createTimelineEventAction={createTimelineEventAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "addMemory" && (
        <AddMemoryModal
          familySlug={familySlug}
          createMemoryAction={createMemoryAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "addStory" && (
        <AddStoryModal
          familySlug={familySlug}
          people={people}
          createStoryAction={createStoryAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
      {globalModal === "addPlace" && (
        <AddPlaceModal
          familySlug={familySlug}
          createPlaceAction={createPlaceAction}
          onClose={() => setGlobalModal(null)}
        />
      )}
    </div>
  );
}
