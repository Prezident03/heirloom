"use client";

import React, { memo, useLayoutEffect, useRef, useEffect, useState } from "react";
import { ImagePlus, Play, Film } from "lucide-react";
import { PAGE_W, PAGE_H, FONT_BY_ID, backgroundCss, frameLayout, filterCss } from "./constants";
import { StickerArt, stickerDef } from "./stickers";
import { t as tr } from "@/lib/i18n";

// ============================================================
// Rasm joylashuvi (crop) hisoblash
// Rasm ramka ichidagi maydonni doim to'liq qoplaydi ("cover"), keyin
// crop.s marta kattalashtiriladi va crop.cx/cy (rasmdagi 0..1 nuqta)
// maydon markaziga to'g'ri keladigan qilib suriladi.
// ============================================================
export function photoInnerBox(el) {
  const lay = frameLayout(el.frame, el.w, el.h);
  const { top, right, bottom, left } = lay.inset;
  return { lay, ix: left, iy: top, iw: Math.max(1, el.w - left - right), ih: Math.max(1, el.h - top - bottom) };
}

export function clampCrop(crop, iw, ih, aspect, imgRot = 0) {
  const box = imageBox({ s: crop.s, cx: 0.5, cy: 0.5 }, iw, ih, aspect, imgRot);
  const hx = Math.min(0.5, iw / (2 * box.W));
  const hy = Math.min(0.5, ih / (2 * box.H));
  return {
    s: Math.max(1, Math.min(10, crop.s)),
    cx: Math.max(hx, Math.min(1 - hx, crop.cx)),
    cy: Math.max(hy, Math.min(1 - hy, crop.cy)),
  };
}

/** Rasmning (aylantirishdan keyingi) qutisi — ramka ichki maydoniga nisbatan px'da. */
export function imageBox(crop, iw, ih, aspect, imgRot = 0) {
  let a = aspect || iw / ih;
  if (imgRot % 180 !== 0) a = 1 / a;
  const frameA = iw / ih;
  let baseW, baseH;
  if (a >= frameA) { baseH = ih; baseW = ih * a; } else { baseW = iw; baseH = iw / a; }
  const s = Math.max(1, crop?.s || 1);
  const W = baseW * s, H = baseH * s;
  const cx = crop?.cx ?? 0.5, cy = crop?.cy ?? 0.5;
  return { W, H, left: iw / 2 - cx * W, top: ih / 2 - cy * H };
}

function MediaImage({ el, iw, ih, mode, videoFrame, onAspect }) {
  // Nisbat bazada saqlanmagan bo'lishi mumkin (eski yoki ommaviy yuklangan rasmlar) —
  // shunda uni rasm yuklangach o'zimiz aniqlaymiz, aks holda rasm cho'zilib ketadi.
  const [natAspect, setNatAspect] = useState(null);
  const aspect = el.aspect || natAspect;
  const crop = clampCrop(el.crop || { s: 1, cx: 0.5, cy: 0.5 }, iw, ih, aspect, el.imgRot);
  const box = imageBox(crop, iw, ih, aspect, el.imgRot);
  const rotated = el.imgRot % 180 !== 0;
  const innerW = rotated ? box.H : box.W;
  const innerH = rotated ? box.W : box.H;
  const tf = [`rotate(${el.imgRot || 0}deg)`, el.flipH ? "scaleX(-1)" : "", el.flipV ? "scaleY(-1)" : ""].join(" ");
  const common = {
    position: "absolute",
    left: (box.W - innerW) / 2,
    top: (box.H - innerH) / 2,
    width: innerW,
    height: innerH,
    transform: tf,
    filter: filterCss(el.filter),
    maxWidth: "none",
    userSelect: "none",
    pointerEvents: "none",
    display: "block",
    // Nisbat hali noma'lum bo'lsa — cho'zmasdan, "cover" rejimida ko'rsatamiz.
    ...(aspect ? null : { left: 0, top: 0, width: iw, height: ih, objectFit: "cover" }),
  };
  const reportAspect = (t) => {
    if (!t) return;
    const nw = t.naturalWidth || t.videoWidth, nh = t.naturalHeight || t.videoHeight;
    if (!nw || !nh) return;
    if (!el.aspect && (!natAspect || Math.abs(natAspect - nw / nh) > 0.001)) setNatAspect(nw / nh);
    onAspect?.(el.id, nw / nh);
  };
  const handleImgLoad = (e) => reportAspect(e.currentTarget);
  // Server render'dan keyin rasm hidratsiyadan oldin yuklanib bo'lgan bo'lsa,
  // onLoad chaqirilmaydi — shuning uchun ref orqali ham tekshiramiz.
  const imgRef = (node) => { if (node && node.complete && node.naturalWidth && !aspect) reportAspect(node); };
  let media;
  if (el.type === "video" && mode !== "export") {
    media = (
      <VideoTag
        src={el.src}
        style={common}
        playing={mode === "preview"}
        muted={el.muted !== false}
        onLoadedMetadata={handleImgLoad}
      />
    );
  } else {
    const src = el.type === "video" ? videoFrame : el.src;
    media = src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img ref={imgRef} src={src} alt="" draggable={false} crossOrigin="anonymous" onLoad={handleImgLoad} style={common} />
    ) : (
      <div style={{ ...common, background: "#2A2925", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Film size={Math.min(iw, ih) * 0.3} color="rgba(255,255,255,0.5)" />
      </div>
    );
  }
  if (!aspect) return <div style={{ position: "absolute", inset: 0 }}>{media}</div>;
  return (
    <div style={{ position: "absolute", left: box.left, top: box.top, width: box.W, height: box.H }}>
      {media}
    </div>
  );
}

function VideoTag({ src, style, playing, muted, onLoadedMetadata }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    if (playing) v.play().catch(() => {});
    else { v.pause(); }
  }, [playing, muted, src]);
  return (
    <video
      ref={ref}
      src={src ? `${src}#t=0.1` : undefined}
      crossOrigin="anonymous"
      playsInline
      loop
      muted={muted}
      preload="metadata"
      onLoadedMetadata={onLoadedMetadata}
      style={style}
    />
  );
}

function FrameDecor({ lay, w, h }) {
  if (lay.film) {
    const band = lay.filmBand;
    const holes = Math.max(4, Math.round(w / 34));
    const hole = (i, top) => (
      <div key={`${top}-${i}`} style={{ position: "absolute", top: top ? band * 0.3 : h - band * 0.7, left: (i + 0.5) * (w / holes) - band * 0.18, width: band * 0.36, height: band * 0.4, background: "#E9E1D0", opacity: 0.85, borderRadius: 2 }} />
    );
    return <>{Array.from({ length: holes }, (_, i) => hole(i, true))}{Array.from({ length: holes }, (_, i) => hole(i, false))}</>;
  }
  if (lay.vintage) {
    const p = lay.pad * 0.45;
    return <div style={{ position: "absolute", inset: p, border: "1.5px solid rgba(110,80,40,0.35)", borderRadius: 2, pointerEvents: "none" }} />;
  }
  if (lay.tape) {
    const tw = Math.max(30, w * 0.28), th = Math.max(12, tw * 0.28);
    const tape = (left, rot) => (
      <div style={{ position: "absolute", top: -th * 0.45, left, width: tw, height: th, transform: `rotate(${rot}deg)`, background: "rgba(217,188,133,0.72)", boxShadow: "0 1px 2px rgba(0,0,0,0.12)" }} />
    );
    return <>{tape(-tw * 0.25, -32)}{tape(w - tw * 0.75, 32)}</>;
  }
  return null;
}

const PhotoContent = memo(function PhotoContent({ el, mode, isDropTarget, videoFrame, onAspect }) {
  const { lay, ix, iy, iw, ih } = photoInnerBox(el);
  const empty = !el.src;
  const showPlaceholder = empty && mode === "edit";
  return (
    <div
      style={{
        position: "absolute", inset: 0,
        background: empty ? undefined : lay.bg,
        borderRadius: lay.radius,
        boxShadow: empty ? "none" : lay.shadow,
        border: empty ? undefined : lay.border,
      }}
    >
      {!empty && <FrameDecor lay={lay} w={el.w} h={el.h} />}
      <div
        style={{
          position: "absolute", left: ix, top: iy, width: iw, height: ih,
          overflow: "hidden", borderRadius: lay.innerRadius,
          background: empty ? (isDropTarget ? "rgba(184,134,59,0.22)" : "rgba(233,225,208,0.75)") : "#E9E1D0",
          outline: showPlaceholder ? `${isDropTarget ? 3 : 2}px dashed ${isDropTarget ? "#B8863B" : "rgba(30,38,33,0.28)"}` : undefined,
          outlineOffset: showPlaceholder ? -2 : undefined,
        }}
      >
        {!empty && <MediaImage el={el} iw={iw} ih={ih} mode={mode} videoFrame={videoFrame} onAspect={onAspect} />}
        {!empty && isDropTarget && <div style={{ position: "absolute", inset: 0, background: "rgba(184,134,59,0.28)", outline: "3px solid #B8863B", outlineOffset: -3 }} />}
        {empty && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: Math.min(iw, ih) * 0.04, color: "rgba(30,38,33,0.45)", textAlign: "center", padding: 8 }}>
            <ImagePlus size={Math.max(16, Math.min(iw, ih) * 0.16)} strokeWidth={1.4} />
            {showPlaceholder && Math.min(iw, ih) > 140 && (
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: Math.max(14, Math.min(iw, ih) * 0.06), fontWeight: 500 }}>{tr("Rasmni shu yerga tashlang")}</span>
            )}
          </div>
        )}
        {el.type === "video" && mode === "edit" && !empty && (
          <div style={{ position: "absolute", right: 10, bottom: 10, width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <Play size={20} color="#fff" fill="#fff" />
          </div>
        )}
      </div>
    </div>
  );
});

export function textStyle(el) {
  const font = FONT_BY_ID[el.font] || FONT_BY_ID.sans;
  return {
    fontFamily: font.css,
    fontSize: el.fontSize,
    fontWeight: el.bold ? 700 : font.weight,
    fontStyle: el.italic ? "italic" : "normal",
    textDecoration: el.underline ? "underline" : "none",
    textTransform: el.uppercase ? "uppercase" : "none",
    letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
    lineHeight: el.lineHeight || 1.3,
    color: el.color,
    textAlign: el.align || "left",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  };
}

const TextContent = memo(function TextContent({ el, mode, editing, onTextCommit, onMeasure }) {
  const ref = useRef(null);

  // Matn balandligini o'lchab, editor holatiga qaytaramiz (resize/snap uchun kerak).
  useLayoutEffect(() => {
    if (mode !== "edit" || !onMeasure || el.autoHeight === false) return undefined;
    const node = ref.current;
    if (!node) return undefined;
    const report = () => {
      const h = node.offsetHeight;
      if (h > 0 && Math.abs(h - el.h) > 0.5) onMeasure(el.id, h);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(node);
    return () => ro.disconnect();
  }, [mode, onMeasure, el.id, el.h, el.autoHeight]);

  // Tahrirlash rejimi: kontentni bir marta yozamiz va hammasini belgilaymiz.
  useLayoutEffect(() => {
    if (!editing) return;
    const node = ref.current;
    if (!node) return;
    node.textContent = el.text || "";
    node.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const style = {
    ...textStyle(el),
    position: "absolute", left: 0, top: 0, width: "100%",
    minHeight: el.autoHeight === false ? "100%" : undefined,
    height: el.autoHeight === false ? "100%" : undefined,
    overflow: el.autoHeight === false ? "hidden" : undefined,
    outline: "none",
    cursor: editing ? "text" : undefined,
    caretColor: editing ? "#B8863B" : undefined,
    userSelect: editing ? "text" : "none",
    WebkitUserSelect: editing ? "text" : "none",
  };

  if (editing) {
    return (
      <div
        ref={ref}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        data-text-editor="1"
        spellCheck={false}
        style={style}
        onPointerDown={(e) => e.stopPropagation()}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
        onBlur={(e) => onTextCommit?.(el.id, e.currentTarget.innerText.replace(/\n$/, ""))}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") { e.preventDefault(); e.currentTarget.blur(); }
        }}
      />
    );
  }
  return (
    <div ref={ref} style={style}>
      {el.text || (mode === "edit" ? <span style={{ opacity: 0.35 }}>{tr("Matn yozing")}</span> : "")}
    </div>
  );
});

const StickerContent = memo(function StickerContent({ el }) {
  const def = stickerDef(el.stickerId);
  const flip = [el.flipH ? "scaleX(-1)" : "", el.flipV ? "scaleY(-1)" : ""].join(" ").trim();
  return (
    <div style={{ position: "absolute", inset: 0, transform: flip || undefined, filter: def.group === "tape" || def.group === "paper" ? "drop-shadow(0 1px 1.5px rgba(0,0,0,0.18))" : undefined }}>
      <StickerArt stickerId={el.stickerId} color={el.color} uid={el.id} />
    </div>
  );
});

export const ElementView = memo(function ElementView({ el, mode, editing, hidden, isDropTarget, videoFrame, onTextCommit, onMeasure, onAspect }) {
  const isText = el.type === "text";
  return (
    <div
      data-el-id={mode === "edit" ? el.id : undefined}
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.w,
        height: isText && el.autoHeight !== false ? el.h : el.h,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        opacity: hidden ? 0 : el.opacity ?? 1,
        cursor: mode === "edit" ? (el.locked ? "default" : "move") : undefined,
      }}
    >
      {(el.type === "photo" || el.type === "video") && <PhotoContent el={el} mode={mode} isDropTarget={isDropTarget} videoFrame={videoFrame} onAspect={onAspect} />}
      {isText && <TextContent el={el} mode={mode} editing={editing} onTextCommit={onTextCommit} onMeasure={onMeasure} />}
      {el.type === "sticker" && <StickerContent el={el} />}
    </div>
  );
});

/**
 * Bitta sahifani mantiqiy o'lchamda (PAGE_W × PAGE_H) chizadi.
 * mode: "edit" | "static" | "preview" | "export"
 */
export const PageView = memo(function PageView({ page, mode = "static", editingId, hiddenIds, dropTargetId, videoFrames, onTextCommit, onMeasure, onAspect, pageRef }) {
  return (
    <div
      ref={pageRef}
      data-page-surface={mode === "edit" ? "1" : undefined}
      style={{
        position: "relative",
        width: PAGE_W,
        height: PAGE_H,
        overflow: "hidden",
        ...backgroundCss(page.background, page.bgImage),
      }}
    >
      {page.elements.map((el) => (
        <ElementView
          key={el.id}
          el={el}
          mode={mode}
          editing={editingId === el.id}
          hidden={hiddenIds?.has(el.id)}
          isDropTarget={dropTargetId === el.id}
          videoFrame={videoFrames?.[el.src]}
          onTextCommit={onTextCommit}
          onMeasure={onMeasure}
          onAspect={onAspect}
        />
      ))}
    </div>
  );
});

/** Sahifani berilgan kenglikka kichraytirib ko'rsatadi (thumbnail, preview). */
export function ScaledPage({ page, width, mode = "static", style, className }) {
  const s = width / PAGE_W;
  return (
    <div className={className} style={{ width, height: PAGE_H * s, overflow: "hidden", position: "relative", flexShrink: 0, ...style }}>
      <div style={{ transform: `scale(${s})`, transformOrigin: "0 0", width: PAGE_W, height: PAGE_H, pointerEvents: "none" }}>
        <PageView page={page} mode={mode} />
      </div>
    </div>
  );
}

/** Ramka namunasini kichik ko'rinishda chizadi (panel va toolbar uchun). */
export function PhotoFramePreview({ frame, size = 64, src }) {
  const w = 240, h = frame === "circle" ? 240 : 280;
  const el = { id: `fp-${frame}`, type: "photo", x: 20, y: 20, w, h, rotation: 0, frame, src, crop: { s: 1, cx: 0.5, cy: 0.5 }, aspect: 4 / 3, imgRot: 0, filter: null };
  const box = w + 40;
  const s = size / Math.max(box, h + 40);
  return (
    <div style={{ width: size, height: size, margin: "0 auto", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: (size - box * s) / 2, top: (size - (h + 40) * s) / 2, width: box, height: h + 40, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <ElementView el={el} mode="static" />
      </div>
    </div>
  );
}
