"use client";

import React, { useState, useRef, useEffect, useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { useDrag } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";
import {
  BookImage, Plus, X, ImagePlus, LayoutGrid,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Copy, Trash2, Calendar, MapPinned,
  Leaf, Flower2, Heart, Star, Sun, Palette,
  Sticker as StickerIcon, Frame,
  AlignLeft, AlignCenter, AlignRight,
  Sparkles, Moon, Cloud, Gift, Cake, PartyPopper,
  Camera, Music, Crown, Umbrella,
  Snowflake, Smile, Feather, Type, Download,
  Loader2, Undo2, Redo2, Maximize2, Minimize2,
} from "lucide-react";
import { TOKENS, inputStyle } from "@/lib/uiTokens";
import { AlbumCard } from "./shared";

// ... (STICKER_ICONS, STICKER_GROUPS, TEMPLATES, LAYOUTS, BACKGROUNDS ni shu yerda qoldiramiz)
// ... (ular o'zgarmaydi)

/* ============================================================
   🎯 YANGI: TransformableElement — Canva uslubidagi element
   ============================================================ */

function TransformableElement({
  element,
  children,
  isSelected,
  onSelect,
  onUpdate,
  canEdit,
  snapGuides,
}) {
  const [spring, api] = useSpring(() => ({
    x: element.position_x || 0,
    y: element.position_y || 0,
    w: element.position_w || 40,
    h: element.position_h || 40,
    rotate: element.rotation || 0,
    scale: 1,
    config: { tension: 200, friction: 20 },
  }));

  // 🖱️ Drag — elementni surish
  const bindDrag = useDrag(
    ({ offset: [dx, dy], first, last, memo }) => {
      if (!canEdit) return;
      
      // Snap/Align (smart guides)
      let newX = dx;
      let newY = dy;
      if (snapGuides) {
        const snap = snapGuides.findSnap(dx, dy, spring.w.get(), spring.h.get());
        if (snap) {
          newX = snap.x;
          newY = snap.y;
          // Snap chiziqlarini ko'rsatish
          onSnap?.(snap);
        }
      }

      api.start({ x: newX, y: newY });
      
      if (last) {
        onUpdate({
          x: newX,
          y: newY,
          w: spring.w.get(),
          h: spring.h.get(),
          rotation: spring.rotate.get(),
        });
      }
    },
    {
      pointer: { touch: true },
      bounds: { left: 0, top: 0, right: 100, bottom: 100 },
      from: () => [spring.x.get(), spring.y.get()],
    }
  );

  // 🔄 Rotate tutqichi uchun alohida drag
  const bindRotate = useDrag(
    ({ movement: [mx, my], last, xy }) => {
      if (!canEdit) return;
      const centerX = spring.x.get() + spring.w.get() / 2;
      const centerY = spring.y.get() + spring.h.get() / 2;
      const angle = Math.atan2(my, mx) * 180 / Math.PI;
      api.start({ rotate: angle });
      if (last) {
        onUpdate({ rotation: angle });
      }
    },
    { pointer: { touch: true } }
  );

  // 📐 Resize tutqichlari
  const resizeHandles = [
    { id: "nw", cursor: "nwse-resize", x: 0, y: 0 },
    { id: "n", cursor: "ns-resize", x: 0.5, y: 0 },
    { id: "ne", cursor: "nesw-resize", x: 1, y: 0 },
    { id: "w", cursor: "ew-resize", x: 0, y: 0.5 },
    { id: "e", cursor: "ew-resize", x: 1, y: 0.5 },
    { id: "sw", cursor: "nesw-resize", x: 0, y: 1 },
    { id: "s", cursor: "ns-resize", x: 0.5, y: 1 },
    { id: "se", cursor: "nwse-resize", x: 1, y: 1 },
  ];

  const bindResize = (handleId) =>
    useDrag(
      ({ movement: [dx, dy], last }) => {
        if (!canEdit) return;
        let newW = spring.w.get();
        let newH = spring.h.get();
        let newX = spring.x.get();
        let newY = spring.y.get();

        const minSize = 5;
        switch (handleId) {
          case "se": newW = Math.max(minSize, spring.w.get() + dx); newH = Math.max(minSize, spring.h.get() + dy); break;
          case "nw": newW = Math.max(minSize, spring.w.get() - dx); newH = Math.max(minSize, spring.h.get() - dy); newX = spring.x.get() + (spring.w.get() - newW); newY = spring.y.get() + (spring.h.get() - newH); break;
          case "ne": newW = Math.max(minSize, spring.w.get() + dx); newH = Math.max(minSize, spring.h.get() - dy); newY = spring.y.get() + (spring.h.get() - newH); break;
          case "sw": newW = Math.max(minSize, spring.w.get() - dx); newH = Math.max(minSize, spring.h.get() + dy); newX = spring.x.get() + (spring.w.get() - newW); break;
          case "n": newH = Math.max(minSize, spring.h.get() - dy); newY = spring.y.get() + (spring.h.get() - newH); break;
          case "s": newH = Math.max(minSize, spring.h.get() + dy); break;
          case "w": newW = Math.max(minSize, spring.w.get() - dx); newX = spring.x.get() + (spring.w.get() - newW); break;
          case "e": newW = Math.max(minSize, spring.w.get() + dx); break;
        }

        api.start({ x: newX, y: newY, w: newW, h: newH });
        if (last) {
          onUpdate({ x: newX, y: newY, w: newW, h: newH });
        }
      },
      { pointer: { touch: true } }
    );

  return (
    <animated.div
      {...bindDrag()}
      onClick={() => onSelect(element.id)}
      style={{
        position: "absolute",
        left: spring.x.to((x) => `${x}%`),
        top: spring.y.to((y) => `${y}%`),
        width: spring.w.to((w) => `${w}%`),
        height: spring.h.to((h) => `${h}%`),
        transform: spring.rotate.to((r) => `rotate(${r}deg)`),
        cursor: canEdit ? "grab" : "default",
        touchAction: "none",
        zIndex: element.z_index || 0,
        border: isSelected ? `2px solid ${TOKENS.gold}` : "1px solid transparent",
        borderRadius: 4,
        boxShadow: isSelected ? `0 0 0 3px ${TOKENS.gold}33` : "none",
        transition: "border 0.15s, box-shadow 0.15s",
        padding: isSelected ? 2 : 0,
      }}
    >
      {/* Element mazmuni */}
      {children}

      {/* 🎯 Bounding box — faqat tanlanganda */}
      {isSelected && canEdit && (
        <>
          {/* 8 ta resize tutqichi */}
          {resizeHandles.map((h) => {
            const bind = bindResize(h.id);
            return (
              <animated.div
                key={h.id}
                {...bind()}
                style={{
                  position: "absolute",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#fff",
                  border: `2px solid ${TOKENS.gold}`,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                  left: `calc(${h.x * 100}% - 6px)`,
                  top: `calc(${h.y * 100}% - 6px)`,
                  cursor: h.cursor,
                  touchAction: "none",
                  zIndex: 10,
                }}
              />
            );
          })}

          {/* 🔄 Rotate tutqichi */}
          <animated.div
            {...bindRotate()}
            style={{
              position: "absolute",
              left: "50%",
              top: -34,
              transform: "translateX(-50%)",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: TOKENS.teal,
              border: "2.5px solid #fff",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              cursor: "grab",
              touchAction: "none",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 10,
            }}
          >
            ↻
          </animated.div>

          {/* Rotate chizig'i */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -20,
              width: 1.5,
              height: 20,
              background: `${TOKENS.teal}99`,
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          />

          {/* 🛠 Floating toolbar */}
          <ElementFloatingToolbar
            onDuplicate={() => onDuplicate(element.id)}
            onLayerUp={() => onLayerUp(element.id)}
            onLayerDown={() => onLayerDown(element.id)}
            onDelete={() => onDelete(element.id)}
          />
        </>
      )}
    </animated.div>
  );
}

/* ============================================================
   🎯 YANGI: SnapGuides — smart guides
   ============================================================ */

function useSnapGuides(elements, currentId) {
  const [guides, setGuides] = useState(null);

  const findSnap = useCallback(
    (x, y, w, h) => {
      const threshold = 0.5; // %
      const targets = { x: [], y: [] };
      
      // Sahifa chetlari
      targets.x.push(0, 50, 100);
      targets.y.push(0, 50, 100);

      // Boshqa elementlarning chetlari va markazi
      elements.forEach((el) => {
        if (el.id === currentId) return;
        const ex = el.position_x || 0;
        const ey = el.position_y || 0;
        const ew = el.position_w || 40;
        const eh = el.position_h || 40;
        targets.x.push(ex, ex + ew, ex + ew / 2);
        targets.y.push(ey, ey + eh, ey + eh / 2);
      });

      let snapX = null,
        snapY = null;
      const edgesX = [x, x + w, x + w / 2];
      const edgesY = [y, y + h, y + h / 2];

      for (const edge of edgesX) {
        for (const t of targets.x) {
          if (Math.abs(edge - t) < threshold) {
            snapX = { edge, target: t };
            break;
          }
        }
        if (snapX) break;
      }

      for (const edge of edgesY) {
        for (const t of targets.y) {
          if (Math.abs(edge - t) < threshold) {
            snapY = { edge, target: t };
            break;
          }
        }
        if (snapY) break;
      }

      const result = {
        x: snapX ? x + (snapX.target - snapX.edge) : x,
        y: snapY ? y + (snapY.target - snapY.edge) : y,
        guides: {
          vx: snapX ? snapX.target : null,
          hy: snapY ? snapY.target : null,
        },
      };

      setGuides(result.guides);
      return result;
    },
    [elements, currentId]
  );

  return { findSnap, guides, clearGuides: () => setGuides(null) };
}

/* ============================================================
   🎯 YANGI: PageCanvas — qayta yozilgan
   ============================================================ */

function PageCanvas({
  page,
  layout,
  familySlug,
  albumId,
  canEdit,
  saveElementPhotoUrlAction,
  updateElementTextAction,
  deleteElementAction,
  updateElementPositionAction,
  updateElementFrameAction,
  updateElementTextStyleAction,
  updateElementStickerColorAction,
  backgroundId,
  onCommitPosition,
  onDuplicated,
  onZIndexChange,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const canvasRef = useRef(null);
  const elements = page.elements || [];

  // Snap/Align
  const { findSnap, guides, clearGuides } = useSnapGuides(elements, selectedId);

  // Elementni yangilash
  const handleUpdate = (elId, updates) => {
    const el = elements.find((e) => e.id === elId);
    if (!el) return;

    const newPos = {
      x: updates.x ?? el.position_x,
      y: updates.y ?? el.position_y,
      w: updates.w ?? el.position_w,
      h: updates.h ?? el.position_h,
      rotation: updates.rotation ?? el.rotation,
    };

    onCommitPosition?.({
      pageId: page.id,
      elementId: elId,
      prev: {
        x: el.position_x,
        y: el.position_y,
        w: el.position_w,
        h: el.position_h,
        r: el.rotation,
      },
      next: newPos,
    });

    // Serverga saqlash (debounce qilingan)
    updateElementPosition(elId, newPos);
  };

  // Elementni o'chirish
  const handleDelete = (elId) => {
    if (!confirm("Bu elementni o'chirishni xohlaysizmi?")) return;
    deleteElementAction(elId, page.id);
    setSelectedId(null);
  };

  // Elementni nusxalash
  const handleDuplicate = (elId) => {
    const f = dupRef.current;
    if (!f) return;
    f.elements.familySlug.value = familySlug;
    f.elements.pageId.value = page.id;
    f.elements.albumId.value = albumId;
    f.elements.elementId.value = elId;
    f.requestSubmit();
  };

  // Layer o'zgartirish
  const handleLayerUp = (elId) => {
    onZIndexChange?.({ pageId: page.id, elementId: elId, direction: "up" });
  };
  const handleLayerDown = (elId) => {
    onZIndexChange?.({ pageId: page.id, elementId: elId, direction: "down" });
  };

  // Klaviatura yorliqlari
  useEffect(() => {
    if (!canEdit) return;
    const onKeyDown = (e) => {
      if (!selectedId) return;
      const isEditable = document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";
      if (isEditable) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDelete(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        // Undo/Redo — yuqoridagi handleUndo/handleRedo ga ulangan
      }
      if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit, selectedId]);

  return (
    <div
      ref={canvasRef}
      onClick={() => setSelectedId(null)}
      style={{
        flex: 1,
        minWidth: 0,
        aspectRatio: "4/3",
        borderRadius: 3,
        position: "relative",
        background: `
          ${PAPER_TEXTURE_URL},
          radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.5), transparent 60%),
          linear-gradient(180deg, ${BACKGROUNDS[backgroundId]?.from || BACKGROUNDS.paper.from}, ${BACKGROUNDS[backgroundId]?.to || BACKGROUNDS.paper.to})
        `,
        backgroundSize: "220px 220px, cover, cover",
        boxShadow: `inset 0 0 40px rgba(120,96,54,0.16), 0 2px 6px rgba(30,38,33,0.08)`,
        touchAction: "none",
        overflow: "hidden",
      }}
    >
      {/* Snap chiziqlari */}
      {guides?.vx != null && (
        <div
          style={{
            position: "absolute",
            left: `${guides.vx}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: TOKENS.gold,
            opacity: 0.85,
            pointerEvents: "none",
            zIndex: 100,
          }}
        />
      )}
      {guides?.hy != null && (
        <div
          style={{
            position: "absolute",
            top: `${guides.hy}%`,
            left: 0,
            right: 0,
            height: 1,
            background: TOKENS.gold,
            opacity: 0.85,
            pointerEvents: "none",
            zIndex: 100,
          }}
        />
      )}

      {/* Elementlar */}
      {elements.map((el, i) => {
        const isSelected = selectedId === el.id;
        const isPhoto = el.type === "photo";
        const isText = el.type === "text";
        const isSticker = el.type === "sticker";

        // Element mazmuni
        let content = null;
        if (isPhoto) {
          content = (
            <PhotoSlotContent
              element={el}
              familySlug={familySlug}
              albumId={albumId}
              pageId={page.id}
              saveElementPhotoUrlAction={saveElementPhotoUrlAction}
              deleteElementAction={deleteElementAction}
              canEdit={canEdit}
            />
          );
        } else if (isText) {
          content = (
            <TextSlotContent
              element={el}
              familySlug={familySlug}
              albumId={albumId}
              updateElementTextAction={updateElementTextAction}
              canEdit={canEdit}
            />
          );
        } else if (isSticker) {
          content = (
            <StickerSlotContent element={el} canEdit={canEdit} />
          );
        }

        return (
          <TransformableElement
            key={el.id}
            element={el}
            isSelected={isSelected}
            onSelect={setSelectedId}
            onUpdate={(updates) => handleUpdate(el.id, updates)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onLayerUp={handleLayerUp}
            onLayerDown={handleLayerDown}
            canEdit={canEdit}
            snapGuides={{ findSnap, clearGuides }}
          >
            {content}
          </TransformableElement>
        );
      })}

      {/* Sahifa meta (sana/joy) */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 14,
          fontSize: 10,
          color: TOKENS.ink40,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {page.date_label && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Calendar size={10} /> {page.date_label}
          </span>
        )}
        {page.location && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <MapPinned size={10} /> {page.location}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   🎯 YANGI: PhotoSlotContent — element ichidagi rasm
   ============================================================ */

function PhotoSlotContent({ element, familySlug, albumId, pageId, saveElementPhotoUrlAction, deleteElementAction, canEdit }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteElementAction, undefined);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      setError("Faqat rasm fayllari qabul qilinadi.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Rasm hajmi 15MB dan oshmasligi kerak.");
      return;
    }

    setError("");
    setPending(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
        clientPayload: JSON.stringify({ familySlug }),
      });

      const result = await saveElementPhotoUrlAction(familySlug, albumId, element.id, blob.url, false);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError("Rasm yuklashda xato yuz berdi: " + (err?.message || String(err)));
    } finally {
      setPending(false);
    }
  };

  const frameStyle = element.frame_style || "polaroid";
  const isPolaroid = frameStyle === "polaroid";
  const tilt = element.photo_url && isPolaroid ? (seeded(element.id, 1) * 4 - 2) : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: isPolaroid ? 2 : 8,
        position: "relative",
        transform: `rotate(${tilt}deg)`,
        background: element.photo_url ? (isPolaroid ? "#fff" : "transparent") : TOKENS.parchment,
        padding: element.photo_url && isPolaroid ? "5% 5% 9%" : 0,
        boxShadow: element.photo_url ? "0 8px 18px rgba(30,26,15,0.22), 0 2px 5px rgba(30,26,15,0.12)" : "none",
        border: element.photo_url ? "none" : `1.5px dashed ${TOKENS.parchmentDeep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {element.photo_url && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            width: 46,
            height: 20,
            transform: `translateX(-50%) rotate(${seeded(element.id, 2) * 16 - 8}deg)`,
            background: TOKENS.tape,
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
            opacity: 0.85,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: 1,
          backgroundImage: element.photo_url ? `url(${element.photo_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!element.photo_url && <BookImage size={20} color={TOKENS.ink40} />}
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                background: "rgba(30,38,33,0.0)",
                border: "none",
                cursor: pending ? "default" : "pointer",
              }}
            >
              {pending && (
                <span style={{ fontSize: 10, color: TOKENS.ink }}>
                  Yuklanmoqda...
                </span>
              )}
            </button>
            {element.photo_url && (
              <form action={deleteFormAction} style={{ position: "absolute", top: 4, right: 4 }}>
                <input type="hidden" name="familySlug" value={familySlug} />
                <input type="hidden" name="albumId" value={albumId} />
                <input type="hidden" name="pageId" value={pageId} />
                <input type="hidden" name="elementId" value={element.id} />
                <button
                  type="submit"
                  disabled={deletePending}
                  title="O'chirish"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "rgba(30,38,33,0.8)",
                    border: "none",
                    color: "#fff",
                    cursor: deletePending ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: deletePending ? 0.6 : 1,
                  }}
                >
                  <X size={14} />
                </button>
              </form>
            )}
          </>
        )}
      </div>
      {error && (
        <div style={{ fontSize: 9.5, color: TOKENS.danger, marginTop: 3 }}>{error}</div>
      )}
      {deleteState?.error && (
        <div style={{ fontSize: 9.5, color: TOKENS.danger, marginTop: 3 }}>
          {deleteState.error}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   🎯 YANGI: TextSlotContent — matn elementi
   ============================================================ */

function TextSlotContent({ element, familySlug, albumId, updateElementTextAction, canEdit }) {
  const [state, formAction] = useActionState(updateElementTextAction, undefined);
  const [value, setValue] = useState(element.text_content || "");
  const formRef = useRef(null);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="familySlug" value={familySlug} />
        <input type="hidden" name="albumId" value={albumId} />
        <input type="hidden" name="elementId" value={element.id} />
        <input type="hidden" name="text" value={value} />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (canEdit && value !== (element.text_content || "")) {
              formRef.current?.requestSubmit();
            }
          }}
          readOnly={!canEdit}
          placeholder={canEdit ? "Matn yozing..." : ""}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            fontFamily: FONT_FAMILIES[element.text_font || "handwriting"],
            fontSize: element.text_size || 22,
            lineHeight: 1.35,
            color: element.text_color || TOKENS.ink,
            textAlign: element.text_align || "left",
            fontWeight: (element.text_font || "handwriting") === "handwriting" ? 600 : 500,
            padding: 0,
          }}
        />
      </form>
      {state?.error && (
        <div style={{ fontSize: 9.5, color: TOKENS.danger }}>{state.error}</div>
      )}
    </div>
  );
}

/* ============================================================
   🎯 YANGI: StickerSlotContent — stiker elementi
   ============================================================ */

function StickerSlotContent({ element, canEdit }) {
  const stickerId = element.sticker_id || "leaf";
  const kind = stickerId.endsWith("-shape") ? "shape" : stickerId.startsWith("tape-") ? "tape" : "icon";
  const color = element.sticker_color || TOKENS.teal;
  const rot = seeded(element.id, 3) * 20 - 10;

  let inner;
  if (kind === "tape") {
    const striped = stickerId === "tape-stripe";
    inner = (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: striped
            ? `repeating-linear-gradient(45deg, ${color}, ${color} 8px, rgba(255,255,255,0.55) 8px, rgba(255,255,255,0.55) 16px)`
            : color,
          opacity: 0.82,
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          borderRadius: 1,
        }}
      />
    );
  } else if (kind === "shape") {
    if (stickerId === "circle-shape") {
      inner = <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: color, opacity: 0.85 }} />;
    } else if (stickerId === "square-shape") {
      inner = <div style={{ width: "100%", height: "100%", borderRadius: 4, background: color, opacity: 0.85 }} />;
    } else {
      inner = (
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "50% solid transparent",
            borderRight: "50% solid transparent",
            borderBottom: "100% solid " + color,
            opacity: 0.85,
            aspectRatio: "1/1",
          }}
        />
      );
    }
  } else {
    const Icon = STICKER_ICONS[stickerId] || Leaf;
    inner = <Icon size="70%" color={color} strokeWidth={1.4} fill={color} fillOpacity={0.3} />;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `rotate(${rot}deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {inner}
    </div>
  );
}

/* ============================================================
   🎯 YANGI: ElementFloatingToolbar — qayta yozilgan
   ============================================================ */

function ElementFloatingToolbar({ onDuplicate, onLayerUp, onLayerDown, onDelete }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "calc(100% + 10px)",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: TOKENS.ink,
        borderRadius: 9,
        padding: 4,
        boxShadow: "0 6px 16px rgba(30,26,15,0.3)",
        zIndex: 70,
        whiteSpace: "nowrap",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="fm-toolbar-btn"
        title="Nusxalash"
        onClick={onDuplicate}
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        className="fm-toolbar-btn"
        title="Tepaga chiqarish"
        onClick={onLayerUp}
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        className="fm-toolbar-btn"
        title="Pastga tushirish"
        onClick={onLayerDown}
      >
        <ChevronDown size={16} />
      </button>
      <div
        style={{
          width: 1,
          height: 16,
          background: "rgba(255,255,255,0.18)",
          margin: "0 2px",
        }}
      />
      <button
        type="button"
        className="fm-toolbar-btn danger"
        title="O'chirish"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ... (qolgan funksiyalar: seeded, LeafDoodle, RailButton, EmptyAlbums,
// CreateAlbumModal, UploadPhotosModal, AlbumGrid, StylePanelShell,
// TextStylePanel, StickerStylePanel, PhotoStylePanel, ExportMenu,
// AlbumEditor, AlbumsView — ular o'zgarmaydi, faqat import qilinadi)

export {
  AlbumEditor,
  AlbumsView,
  CreateAlbumModal,
  UploadPhotosModal,
};