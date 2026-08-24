'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Type,
  Sticker,
  Palette,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Heart,
  Star,
  Bookmark,
  Sun,
  Smile,
  Award,
  Crown,
  Gift,
  Coffee,
  Camera,
  Music,
  Compass,
  MapPin,
  Feather,
  X,
  Upload
} from 'lucide-react';

// Actions import (Safe Import with Fallbacks)
import * as Actions from '@/lib/actions';

const updateElementPositionAction = Actions.updateElementPositionAction || (async () => ({ success: true }));
const duplicateElementAction = Actions.duplicateElementAction || (async () => ({ success: true }));
const changeZIndexAction = Actions.changeZIndexAction || (async () => ({ success: true }));
const deleteElementAction = Actions.deleteElementAction || (async () => ({ success: true }));
const updatePageBackgroundAction = Actions.updatePageBackgroundAction || (async () => ({ success: true }));
const addPhotoToPageAction = Actions.addPhotoToPageAction || (async (id, url) => ({ success: true, element: { id: Date.now().toString(), type: 'photo', content: url, x: 50, y: 50, w: 150, h: 150 } }));
const addTextToPageAction = Actions.addTextToPageAction || (async (id, text) => ({ success: true, element: { id: Date.now().toString(), type: 'text', content: text, x: 100, y: 100, w: 200, h: 50 } }));
const addStickerToPageAction = Actions.addStickerToPageAction || (async (id, stId) => ({ success: true, element: { id: Date.now().toString(), type: 'sticker', content: stId, x: 120, y: 120, w: 80, h: 80 } }));
const createPageAction = Actions.createPageAction || (async () => ({ success: true, page: { id: Date.now().toString(), elements: [] } }));
const deletePageAction = Actions.deletePageAction || (async () => ({ success: true }));

// Sticker collections
const STICKER_GROUPS = [
  {
    name: 'Xotiralar & Bezuk',
    stickers: [
      { id: 'heart', label: 'Yurak', icon: Heart, color: '#f43f5e' },
      { id: 'star', label: 'Yulduz', icon: Star, color: '#eab308' },
      { id: 'bookmark', label: 'Xatcho\'p', icon: Bookmark, color: '#8b5cf6' },
      { id: 'sparkles', label: 'Nurlar', icon: Sparkles, color: '#ec4899' },
      { id: 'crown', label: 'Toj', icon: Crown, color: '#f59e0b' },
      { id: 'gift', label: 'Sovg\'a', icon: Gift, color: '#06b6d4' }
    ]
  },
  {
    name: 'Kayfiyat & Hayot',
    stickers: [
      { id: 'sun', label: 'Quyosh', icon: Sun, color: '#f97316' },
      { id: 'smile', label: 'Tabassum', icon: Smile, color: '#84cc16' },
      { id: 'coffee', label: 'Kofe', icon: Coffee, color: '#78350f' },
      { id: 'award', label: 'Mukofot', icon: Award, color: '#3b82f6' }
    ]
  },
  {
    name: 'Sayohat & San\'at',
    stickers: [
      { id: 'camera', label: 'Kamera', icon: Camera, color: '#64748b' },
      { id: 'music', label: 'Musiqa', icon: Music, color: '#a855f7' },
      { id: 'compass', label: 'Kompas', icon: Compass, color: '#0d9488' },
      { id: 'pin', label: 'Manzil', icon: MapPin, color: '#ef4444' },
      { id: 'feather', label: 'Patsiz qalam', icon: Feather, color: '#d97706' }
    ]
  }
];

// Preset backgrounds
const BACKGROUNDS = [
  { id: 'white', name: 'Toza oq', style: '#ffffff' },
  { id: 'cream', name: 'Krem (Klassik)', style: '#fdfbf7' },
  { id: 'warm', name: 'Iliq bej', style: '#fef3c7' },
  { id: 'rose', name: 'Pushti pastel', style: '#ffe4e6' },
  { id: 'lavender', name: 'Lavant pastel', style: '#f3e8ff' },
  { id: 'mint', name: 'Yalpiz pastel', style: '#ecfdf5' },
  { id: 'sky', name: 'Osmon pastel', style: '#e0f2fe' },
  { id: 'dark', name: 'To\'q shokolad', style: '#1c1917' }
];

// 1. MAIN ALBUM EDITOR COMPONENT
export default function AlbumEditor({ album, familyId, photos = [] }) {
  const [pages, setPages] = useState(album?.pages || [{ id: '1', elements: [] }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('photos');
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [zoom, setZoom] = useState(1);

  const currentPage = pages[currentPageIndex] || pages[0];

  useEffect(() => {
    if (album?.pages) {
      setPages(album.pages);
    }
  }, [album]);

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      setSelectedElementId(null);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      setSelectedElementId(null);
    }
  };

  const handleAddPage = async () => {
    try {
      const res = await createPageAction(album?.id);
      if (res?.success && res?.page) {
        setPages((prev) => [...prev, res.page]);
        setCurrentPageIndex(pages.length);
      }
    } catch (err) {
      console.error("Page add error:", err);
    }
  };

  const handleAddPhoto = async (photo) => {
    if (!currentPage) return;
    try {
      const res = await addPhotoToPageAction(currentPage.id, photo.url);
      if (res?.success && res?.element) {
        setPages((prev) =>
          prev.map((p) =>
            p.id === currentPage.id
              ? { ...p, elements: [...(p.elements || []), res.element] }
              : p
          )
        );
        setSelectedElementId(res.element.id);
      }
    } catch (err) {
      console.error("Add photo error:", err);
    }
  };

  const handleAddText = async (presetText = 'Matn kiriting') => {
    if (!currentPage) return;
    try {
      const res = await addTextToPageAction(currentPage.id, presetText);
      if (res?.success && res?.element) {
        setPages((prev) =>
          prev.map((p) =>
            p.id === currentPage.id
              ? { ...p, elements: [...(p.elements || []), res.element] }
              : p
          )
        );
        setSelectedElementId(res.element.id);
      }
    } catch (err) {
      console.error("Add text error:", err);
    }
  };

  const handleAddSticker = async (stickerId) => {
    if (!currentPage) return;
    try {
      const res = await addStickerToPageAction(currentPage.id, stickerId);
      if (res?.success && res?.element) {
        setPages((prev) =>
          prev.map((p) =>
            p.id === currentPage.id
              ? { ...p, elements: [...(p.elements || []), res.element] }
              : p
          )
        );
        setSelectedElementId(res.element.id);
      }
    } catch (err) {
      console.error("Add sticker error:", err);
    }
  };

  const handleDuplicateElement = async (elId) => {
    try {
      const res = await duplicateElementAction(elId);
      if (res?.success) {
        const elToDup = currentPage.elements.find(e => e.id === elId);
        if (elToDup) {
          const newEl = { ...elToDup, id: Date.now().toString(), x: (elToDup.x || 0) + 20, y: (elToDup.y || 0) + 20 };
          setPages((prev) =>
            prev.map((p) =>
              p.id === currentPage.id
                ? { ...p, elements: [...p.elements, newEl] }
                : p
            )
          );
          setSelectedElementId(newEl.id);
        }
      }
    } catch (err) {
      console.error("Duplicate element error:", err);
    }
  };

  const handleDeleteElement = async (elId) => {
    try {
      await deleteElementAction(elId);
      setPages((prev) =>
        prev.map((p) =>
          p.id === currentPage.id
            ? { ...p, elements: p.elements.filter((e) => e.id !== elId) }
            : p
        )
      );
      setSelectedElementId(null);
    } catch (err) {
      console.error("Delete element error:", err);
    }
  };

  const handleChangeZIndex = async (elId, direction) => {
    try {
      await changeZIndexAction(elId, direction);
      setPages((prev) =>
        prev.map((p) => {
          if (p.id !== currentPage.id) return p;
          const els = [...p.elements];
          const idx = els.findIndex((e) => e.id === elId);
          if (idx < 0) return p;
          if (direction === 'up' && idx < els.length - 1) {
            const tmp = els[idx];
            els[idx] = els[idx + 1];
            els[idx + 1] = tmp;
          } else if (direction === 'down' && idx > 0) {
            const tmp = els[idx];
            els[idx] = els[idx - 1];
            els[idx - 1] = tmp;
          }
          return { ...p, elements: els };
        })
      );
    } catch (err) {
      console.error("ZIndex change error:", err);
    }
  };

  const handleUpdateBackground = async (bgStyle) => {
    if (!currentPage) return;
    try {
      await updatePageBackgroundAction(currentPage.id, bgStyle);
      setPages((prev) =>
        prev.map((p) => (p.id === currentPage.id ? { ...p, background: bgStyle } : p))
      );
    } catch (err) {
      console.error("Background update error:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden select-none">
      {/* Top Bar */}
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
            {album?.title || "Albom Muharriri"}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-medium">
            Canva Mode
          </span>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 ml-1"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Tabs */}
        <div className="w-16 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-4 gap-4 z-10">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              activeTab === 'photos'
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Rasmlar</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              activeTab === 'text'
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Type className="w-5 h-5" />
            <span className="text-[10px] font-medium">Matn</span>
          </button>

          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              activeTab === 'stickers'
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Sticker className="w-5 h-5" />
            <span className="text-[10px] font-medium">Stikerlar</span>
          </button>

          <button
            onClick={() => setActiveTab('backgrounds')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              activeTab === 'backgrounds'
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span className="text-[10px] font-medium">Fonlar</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto z-10 shadow-sm">
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                Rasmlar ({photos.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo) => (
                  <button
                    key={photo.id || photo.url}
                    onClick={() => handleAddPhoto(photo)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-purple-500 transition-all hover:shadow-md"
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                Matn qo'shish
              </h3>
              <button
                onClick={() => handleAddText('Sarlavha')}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg transition-colors shadow-sm"
              >
                + Sarlavha qo'shish
              </button>
              <button
                onClick={() => handleAddText('Matn yozing...')}
                className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
              >
                + Oddiy matn
              </button>
            </div>
          )}

          {activeTab === 'stickers' && (
            <div className="space-y-6">
              {STICKER_GROUPS.map((group) => (
                <div key={group.name} className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {group.name}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {group.stickers.map((st) => {
                      const Icon = st.icon;
                      return (
                        <button
                          key={st.id}
                          onClick={() => handleAddSticker(st.id)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors group"
                        >
                          <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ color: st.color }} />
                          <span className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">
                            {st.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'backgrounds' && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                Sahifa foni
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => handleUpdateBackground(bg.style)}
                    className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all"
                  >
                    <div
                      className="w-full h-12 rounded-lg border border-slate-200 shadow-inner mb-1"
                      style={{ background: bg.style }}
                    />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {bg.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-slate-200/60 dark:bg-slate-950 overflow-auto flex items-center justify-center p-8 relative">
          {currentPage ? (
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="transition-transform duration-75"
            >
              <PageCanvas
                page={currentPage}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onDuplicateEl={handleDuplicateElement}
                onDeleteEl={handleDeleteElement}
                onChangeZIndex={handleChangeZIndex}
                setPages={setPages}
              />
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Sahifa topilmadi</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="h-14 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Sahifa {currentPageIndex + 1} / {pages.length}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleAddPage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Yangi sahifa
        </button>
      </footer>
    </div>
  );
}

// 2. PAGE CANVAS WITH CANVA HANDLES
function PageCanvas({
  page,
  selectedElementId,
  onSelectElement,
  onDuplicateEl,
  onDeleteEl,
  onChangeZIndex,
  setPages
}) {
  const canvasRef = useRef(null);
  const dragState = useRef(null);
  const [, forceRender] = useState(0);

  const elements = page.elements || [];

  const onPointerDownElement = (e, el) => {
    e.stopPropagation();
    onSelectElement(el.id);

    dragState.current = {
      type: 'drag',
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x || 0,
      initialY: el.y || 0,
      x: el.x || 0,
      y: el.y || 0,
      w: el.w || 100,
      h: el.h || 100,
      r: el.r || 0
    };
  };

  const onPointerDownHandle = (e, handle, el) => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();

    dragState.current = {
      type: handle === 'rotate' ? 'rotate' : 'resize',
      handle,
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x || 0,
      initialY: el.y || 0,
      initialW: el.w || 100,
      initialH: el.h || 100,
      initialR: el.r || 0,
      x: el.x || 0,
      y: el.y || 0,
      w: el.w || 100,
      h: el.h || 100,
      r: el.r || 0,
      centerX: rect.left + (el.x || 0) + (el.w || 100) / 2,
      centerY: rect.top + (el.y || 0) + (el.h || 100) / 2
    };
  };

  const onPointerMoveCanvas = (e) => {
    if (!dragState.current) return;
    const st = dragState.current;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;

    if (st.type === 'drag') {
      st.x = st.initialX + dx;
      st.y = st.initialY + dy;
    } else if (st.type === 'resize') {
      if (st.handle.includes('e')) st.w = Math.max(30, st.initialW + dx);
      if (st.handle.includes('s')) st.h = Math.max(30, st.initialH + dy);
      if (st.handle.includes('w')) {
        const nw = Math.max(30, st.initialW - dx);
        st.x = st.initialX + (st.initialW - nw);
        st.w = nw;
      }
      if (st.handle.includes('n')) {
        const nh = Math.max(30, st.initialH - dy);
        st.y = st.initialY + (st.initialH - nh);
        st.h = nh;
      }
    } else if (st.type === 'rotate') {
      const rad = Math.atan2(e.clientY - st.centerY, e.clientX - st.centerX);
      st.r = Math.round((rad * 180) / Math.PI);
    }

    forceRender((n) => n + 1);
  };

  const onPointerUpCanvas = async () => {
    if (!dragState.current) return;
    const st = { ...dragState.current };
    dragState.current = null;

    setPages((prev) =>
      prev.map((p) =>
        p.id === page.id
          ? {
              ...p,
              elements: p.elements.map((el) =>
                el.id === st.id
                  ? { ...el, x: st.x, y: st.y, w: st.w, h: st.h, r: st.r }
                  : el
              )
            }
          : p
      )
    );

    try {
      await updateElementPositionAction(st.id, {
        x: st.x,
        y: st.y,
        w: st.w,
        h: st.h,
        r: st.r
      });
    } catch (err) {
      console.error("Position save error:", err);
    }
  };

  return (
    <div
      ref={canvasRef}
      onPointerMove={onPointerMoveCanvas}
      onPointerUp={onPointerUpCanvas}
      onClick={() => onSelectElement(null)}
      style={{ background: page.background || '#ffffff' }}
      className="w-[700px] h-[500px] relative rounded-xl shadow-2xl overflow-hidden border border-slate-300 dark:border-slate-700"
    >
      {elements.map((el) => {
        const isSelected = selectedElementId === el.id;
        const live = dragState.current?.id === el.id;
        const src = live ? dragState.current : el;

        const posX = src.x ?? el.x ?? 0;
        const posY = src.y ?? el.y ?? 0;
        const posW = src.w ?? el.w ?? 100;
        const posH = src.h ?? el.h ?? 100;
        const posR = src.r ?? el.r ?? 0;

        return (
          <div
            key={el.id}
            onPointerDown={(e) => onPointerDownElement(e, el)}
            style={{
              position: 'absolute',
              left: `${posX}px`,
              top: `${posY}px`,
              width: `${posW}px`,
              height: `${posH}px`,
              transform: `rotate(${posR}deg)`,
              transformOrigin: 'center center'
            }}
            className="group cursor-move"
          >
            {el.type === 'photo' && (
              <img
                src={el.content}
                alt=""
                className="w-full h-full object-cover rounded-md shadow-sm pointer-events-none"
              />
            )}

            {el.type === 'text' && (
              <div className="w-full h-full flex items-center justify-center p-2 text-center break-words font-medium text-slate-800">
                {el.content}
              </div>
            )}

            {el.type === 'sticker' && (
              <div className="w-full h-full flex items-center justify-center pointer-events-none">
                <Sparkles className="w-3/4 h-3/4 text-purple-500" />
              </div>
            )}

            {/* CANVA STYLE SELECTION BOX */}
            {isSelected && (
              <div
                className="absolute inset-0 pointer-events-none border-2 border-[#8B5CF6] rounded-sm"
                style={{ margin: -2 }}
              >
                {/* Canva Quick Action Menu */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-1 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 z-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateEl(el.id);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200"
                    title="Nusxalash"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeZIndex(el.id, 'up');
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200"
                    title="Oldinga"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeZIndex(el.id, 'down');
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200"
                    title="Orqaga"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEl(el.id);
                    }}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded text-rose-600"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Corner Resize Handles */}
                {['nw', 'ne', 'se', 'sw'].map((handle) => (
                  <div
                    key={handle}
                    onPointerDown={(e) => onPointerDownHandle(e, handle, el)}
                    className="absolute w-3.5 h-3.5 bg-white border-2 border-[#8B5CF6] rounded-full pointer-events-auto shadow-md hover:scale-125 transition-transform cursor-pointer"
                    style={{
                      top: handle.includes('n') ? -7 : 'auto',
                      bottom: handle.includes('s') ? -7 : 'auto',
                      left: handle.includes('w') ? -7 : 'auto',
                      right: handle.includes('e') ? -7 : 'auto',
                    }}
                  />
                ))}

                {/* Rotation Handle */}
                <div
                  onPointerDown={(e) => onPointerDownHandle(e, 'rotate', el)}
                  className="absolute -bottom-9 left-1/2 -translate-x-1/2 w-7 h-7 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full pointer-events-auto shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110"
                >
                  <RotateCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 3. EXPORT MISSING COMPONENTS FOR OTHER MODULES (FIX FOR BUILD ERRORS)
export function AlbumsView({ albums = [], onSelectAlbum, onCreateClick }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Albomlar</h2>
        <button
          onClick={onCreateClick}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" /> Yangi albom
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {albums.map((a) => (
          <div
            key={a.id}
            onClick={() => onSelectAlbum && onSelectAlbum(a)}
            className="p-4 border rounded-xl bg-white dark:bg-slate-800 cursor-pointer hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg">{a.title || 'Nomsiz albom'}</h3>
            <p className="text-xs text-slate-500 mt-1">{a.pages?.length || 0} ta sahifa</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreateAlbumModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Yangi albom yaratish</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <input
          type="text"
          placeholder="Albom nomi..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2.5 border rounded-xl dark:bg-slate-700"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm">Bekor qilish</button>
          <button
            onClick={() => { onCreate && onCreate({ title }); onClose(); }}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium"
          >
            Yaratish
          </button>
        </div>
      </div>
    </div>
  );
}

export function UploadPhotosModal({ isOpen, onClose, onUpload }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Rasm yuklash</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Upload className="w-8 h-8" />
          <span className="text-sm">Rasmlarni tanlang yoki shu yerga tashlang</span>
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-sm rounded-xl">Yopish</button>
        </div>
      </div>
    </div>
  );
}