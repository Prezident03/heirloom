"use client";

import React, { useLayoutEffect, useRef, useState } from "react";
import {
  Crop, Replace, Frame, Wand2, Droplet, FlipHorizontal2, FlipVertical2, Layers, Lock, LockOpen, Copy, Trash2,
  Ellipsis, Bold, Italic, Underline, CaseUpper, AlignLeft, AlignCenter, AlignRight, Minus, Plus, Group, Ungroup,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, ArrowUpToLine, ArrowDownToLine, ChevronUp, ChevronDown,
  RotateCw, Check, X, Undo2, Volume2, VolumeX, ImagePlus, Upload, GripVertical, Image as ImageIcon, Type, Film,
  Baseline, LetterText,
} from "lucide-react";
import { FONTS, FONT_BY_ID, FRAMES, FILTER_PRESETS, DEFAULT_FILTER, PALETTE, filterCss } from "./constants";
import { elementLabel } from "./model";
import { stickerDef, StickerArt } from "./stickers";
import { PopButton, Swatches, Slider, C } from "./ui";
import { screenBounds } from "./Overlay";
import { PhotoFramePreview } from "./ElementView";

const SAMPLE_IMG =
  "data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 90'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9FC2C4'/><stop offset='1' stop-color='#E9D6B8'/></linearGradient></defs><rect width='120' height='90' fill='url(#g)'/><circle cx='88' cy='26' r='10' fill='#F7E3B0'/><path d='M0 90 L34 48 L58 72 L80 52 L120 90Z' fill='#5C7A73'/></svg>"
  );

export { SAMPLE_IMG };

function Btn({ icon: Icon, label, title, onClick, active, danger, disabled }) {
  return (
    <button type="button" className={`he-tb${active ? " active" : ""}${danger ? " danger" : ""}`} title={title || label} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={16} />}{label && <span>{label}</span>}
    </button>
  );
}

const Sep = () => <div className="he-tb-sep" />;

function OpacityPop({ els, api }) {
  const v = els[0]?.opacity ?? 1;
  return (
    <PopButton icon={<Droplet size={16} />} title="Shaffoflik" width={230}>
      <Slider
        label="Shaffoflik"
        value={Math.round(v * 100)}
        min={5}
        max={100}
        suffix="%"
        onChange={(n) => api.update(els.map((e) => e.id), { opacity: n / 100 }, { live: true })}
        onCommit={() => api.endLive()}
      />
    </PopButton>
  );
}

export function LayersList({ api, elements, selIds }) {
  const [dragId, setDragId] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const rows = [...elements].reverse();
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, margin: "2px 4px 8px", textTransform: "uppercase", letterSpacing: ".05em" }}>Qatlamlar</div>
      {rows.length === 0 && <div style={{ padding: 10, color: C.muted, fontSize: 12.5 }}>Sahifa bo&apos;sh</div>}
      {rows.map((el, i) => (
        <div
          key={el.id}
          className={`he-layer-row${selIds.has(el.id) ? " sel" : ""}${overIdx === i && dragId !== el.id ? " over" : ""}`}
          draggable
          onDragStart={(e) => { setDragId(el.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", el.id); }}
          onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
          onDragLeave={() => setOverIdx(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId) api.moveLayer(dragId, rows.length - 1 - i);
            setDragId(null); setOverIdx(null);
          }}
          onDragEnd={() => { setDragId(null); setOverIdx(null); }}
          onClick={(e) => api.selectIds([el.id], e.shiftKey)}
        >
          <GripVertical size={13} color={C.faint} style={{ cursor: "grab", flexShrink: 0 }} />
          <LayerThumb el={el} />
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{elementLabel(el)}</span>
          {el.groupId && <span title="Guruhda" style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>G</span>}
          <button
            type="button"
            className="he-tb"
            style={{ height: 24, minWidth: 24, padding: 0 }}
            title={el.locked ? "Qulfdan chiqarish" : "Qulflash"}
            onClick={(e) => { e.stopPropagation(); api.update([el.id], { locked: !el.locked }); }}
          >
            {el.locked ? <Lock size={13} /> : <LockOpen size={13} color={C.faint} />}
          </button>
        </div>
      ))}
    </div>
  );
}

function LayerThumb({ el }) {
  const box = { width: 28, height: 22, borderRadius: 4, flexShrink: 0, background: "#F2EDE2", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" };
  if ((el.type === "photo") && el.src) return <div style={{ ...box, backgroundImage: `url("${el.src}")`, backgroundSize: "cover", backgroundPosition: "center" }} />;
  if (el.type === "photo") return <div style={box}><ImageIcon size={13} color={C.faint} /></div>;
  if (el.type === "video") return <div style={{ ...box, background: "#2A2925" }}><Film size={13} color="#fff" /></div>;
  if (el.type === "text") return <div style={box}><Type size={13} color={C.muted} /></div>;
  return <div style={{ ...box, padding: 3 }}><StickerArt stickerId={el.stickerId} color={el.color} uid={`lt-${el.id}`} /></div>;
}

function LayerPop({ api, page, selIds }) {
  return (
    <PopButton icon={<Layers size={16} />} title="Qatlam tartibi" width={270}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 10 }}>
        <button type="button" className="he-menu-item" onClick={() => api.layer("forward")}><ChevronUp size={15} /> Oldinga</button>
        <button type="button" className="he-menu-item" onClick={() => api.layer("backward")}><ChevronDown size={15} /> Orqaga</button>
        <button type="button" className="he-menu-item" onClick={() => api.layer("front")}><ArrowUpToLine size={15} /> Eng oldiga</button>
        <button type="button" className="he-menu-item" onClick={() => api.layer("back")}><ArrowDownToLine size={15} /> Eng orqaga</button>
      </div>
      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
        <LayersList api={api} elements={page.elements} selIds={selIds} />
      </div>
    </PopButton>
  );
}

function AlignPop({ api, count }) {
  const items = [
    ["left", AlignStartVertical, "Chapga"], ["hcenter", AlignCenterVertical, "Markazga"], ["right", AlignEndVertical, "O'ngga"],
    ["top", AlignStartHorizontal, "Tepaga"], ["vcenter", AlignCenterHorizontal, "O'rtaga"], ["bottom", AlignEndHorizontal, "Pastga"],
  ];
  return (
    <PopButton icon={<AlignCenterVertical size={16} />} label="Tekislash" title="Tekislash" width={250}>
      <div style={{ fontSize: 11.5, color: C.muted, margin: "0 4px 6px" }}>{count > 1 ? "Tanlanganlarga nisbatan" : "Sahifaga nisbatan"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {items.map(([id, Icon, label]) => (
          <button key={id} type="button" className="he-menu-item" onClick={() => api.align(id)}><Icon size={15} /> {label}</button>
        ))}
      </div>
      {count > 2 && (
        <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 6, paddingTop: 6 }}>
          <button type="button" className="he-menu-item" onClick={() => api.distribute("x")}><AlignHorizontalDistributeCenter size={15} /> Gorizontal teng taqsimlash</button>
          <button type="button" className="he-menu-item" onClick={() => api.distribute("y")}><AlignVerticalDistributeCenter size={15} /> Vertikal teng taqsimlash</button>
        </div>
      )}
    </PopButton>
  );
}

function CommonTail({ api, els, page, selIds }) {
  const allLocked = els.every((e) => e.locked);
  return (
    <>
      <Sep />
      <LayerPop api={api} page={page} selIds={selIds} />
      <Btn icon={allLocked ? Lock : LockOpen} title={allLocked ? "Qulfdan chiqarish" : "Qulflash"} active={allLocked} onClick={api.toggleLock} />
      <Btn icon={Copy} title="Nusxalash (Ctrl+D)" onClick={api.duplicate} />
      <Btn icon={Trash2} title="O'chirish (Delete)" danger onClick={api.remove} disabled={allLocked} />
      <PopButton icon={<Ellipsis size={16} />} title="Ko'proq" width={230} align="end">
        {(close) => (
          <>
            <button type="button" className="he-menu-item" onClick={() => { api.copy(); close(); }}>Nusxa olish <span className="kbd">Ctrl+C</span></button>
            <button type="button" className="he-menu-item" onClick={() => { api.cut(); close(); }}>Kesib olish <span className="kbd">Ctrl+X</span></button>
            <button type="button" className="he-menu-item" onClick={() => { api.paste(); close(); }}>Joylashtirish <span className="kbd">Ctrl+V</span></button>
            <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
            <button type="button" className="he-menu-item" onClick={() => { api.align("hcenter", true); api.align("vcenter", true); close(); }}>Sahifa markaziga</button>
            {els.length > 1 && !els.every((e) => e.groupId && e.groupId === els[0].groupId) && (
              <button type="button" className="he-menu-item" onClick={() => { api.group(); close(); }}>Guruhlash <span className="kbd">Ctrl+G</span></button>
            )}
            {els.some((e) => e.groupId) && (
              <button type="button" className="he-menu-item" onClick={() => { api.ungroup(); close(); }}>Guruhdan chiqarish <span className="kbd">Ctrl+⇧+G</span></button>
            )}
            <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
            <button type="button" className="he-menu-item danger" onClick={() => { api.remove(); close(); }}>O&apos;chirish <span className="kbd">Del</span></button>
          </>
        )}
      </PopButton>
    </>
  );
}

function FramePop({ el, api }) {
  return (
    <PopButton icon={<Frame size={16} />} label="Ramka" title="Ramka" width={292}>
      <div className="he-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {FRAMES.map((f) => (
          <button key={f.id} type="button" className="he-tile" style={{ padding: 6, outline: el.frame === f.id ? `2px solid ${C.gold}` : undefined }} onClick={() => api.update([el.id], { frame: f.id })}>
            <FramePreview frame={f.id} />
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: C.ink }}>{f.name}</div>
          </button>
        ))}
      </div>
    </PopButton>
  );
}

export function FramePreview({ frame, size = 64 }) {
  return <PhotoFramePreview frame={frame} size={size} src={SAMPLE_IMG} />;
}

function FilterPop({ el, api }) {
  const f = { ...DEFAULT_FILTER, ...(el.filter || {}) };
  const set = (patch, live) => api.update([el.id], { filter: { ...f, ...patch } }, live ? { live: true } : undefined);
  return (
    <PopButton icon={<Wand2 size={16} />} label="Filtr" title="Filtr va sozlash" width={300}>
      <div className="he-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 12 }}>
        {FILTER_PRESETS.map((p) => {
          const active = Object.keys(DEFAULT_FILTER).every((k) => (p.values[k] ?? 0) === (f[k] ?? 0));
          return (
            <button key={p.id} type="button" className="he-tile" style={{ outline: active ? `2px solid ${C.gold}` : undefined }} onClick={() => api.update([el.id], { filter: { ...p.values } })}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={el.src} alt="" crossOrigin="anonymous" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", filter: filterCss(p.values) }} />
              <div style={{ fontSize: 10.5, fontWeight: 600, padding: "4px 0", color: C.ink }}>{p.name}</div>
            </button>
          );
        })}
      </div>
      <Slider label="Yorqinlik" value={f.brightness} min={40} max={160} onChange={(n) => set({ brightness: n }, true)} onCommit={api.endLive} />
      <Slider label="Kontrast" value={f.contrast} min={40} max={160} onChange={(n) => set({ contrast: n }, true)} onCommit={api.endLive} />
      <Slider label="To'yinganlik" value={f.saturate} min={0} max={200} onChange={(n) => set({ saturate: n }, true)} onCommit={api.endLive} />
      <Slider label="Iliqlik (sepiya)" value={f.sepia} min={0} max={100} onChange={(n) => set({ sepia: n }, true)} onCommit={api.endLive} />
      <Slider label="Rang tusi" value={f.hue} min={-180} max={180} suffix="°" onChange={(n) => set({ hue: n }, true)} onCommit={api.endLive} />
      <button type="button" className="he-btn soft" style={{ width: "100%" }} onClick={() => api.update([el.id], { filter: null })}><Undo2 size={14} /> Asl holatiga</button>
    </PopButton>
  );
}

function FlipPop({ els, api }) {
  return (
    <PopButton icon={<FlipHorizontal2 size={16} />} title="Ko'zgu aks" width={210}>
      <button type="button" className="he-menu-item" onClick={() => api.update(els.map((e) => e.id), (e) => ({ flipH: !e.flipH }))}><FlipHorizontal2 size={15} /> Gorizontal</button>
      <button type="button" className="he-menu-item" onClick={() => api.update(els.map((e) => e.id), (e) => ({ flipV: !e.flipV }))}><FlipVertical2 size={15} /> Vertikal</button>
    </PopButton>
  );
}

function PhotoTools({ el, api }) {
  if (!el.src) {
    return (
      <>
        <Btn icon={ImagePlus} label="Rasm tanlash" onClick={() => api.openReplace(el.id)} />
        <Btn icon={Upload} label="Yuklash" onClick={() => api.pickFile(el.id)} />
        <FramePop el={el} api={api} />
      </>
    );
  }
  return (
    <>
      <Btn icon={Crop} label="Kesish" title="Kesish (ikki marta bosing)" onClick={() => api.enterCrop(el.id)} disabled={el.locked} />
      <PopButton icon={<Replace size={16} />} label="Almashtirish" title="Rasmni almashtirish" width={220}>
        {(close) => (
          <>
            <button type="button" className="he-menu-item" onClick={() => { api.openReplace(el.id); close(); }}><ImageIcon size={15} /> Kutubxonadan tanlash</button>
            <button type="button" className="he-menu-item" onClick={() => { api.pickFile(el.id); close(); }}><Upload size={15} /> Kompyuterdan yuklash</button>
          </>
        )}
      </PopButton>
      <FramePop el={el} api={api} />
      {el.type === "photo" && <FilterPop el={el} api={api} />}
      {el.type === "video" && (
        <Btn icon={el.muted === false ? Volume2 : VolumeX} title={el.muted === false ? "Ovozni o'chirish" : "Ovozni yoqish (ko'rish rejimida)"} onClick={() => api.update([el.id], { muted: el.muted === false })} />
      )}
      <FlipPop els={[el]} api={api} />
      <OpacityPop els={[el]} api={api} />
    </>
  );
}

function TextTools({ els, api }) {
  const el = els[0];
  const ids = els.map((e) => e.id);
  const font = FONT_BY_ID[el.font] || FONT_BY_ID.sans;
  const setSize = (n) => api.update(ids, (e) => {
    const k = Math.max(6, Math.min(400, n)) / e.fontSize;
    return { fontSize: e.fontSize * k };
  }, { coalesce: "fontsize" });
  const nextAlign = { left: "center", center: "right", right: "left" }[el.align || "left"];
  const AlignIcon = { left: AlignLeft, center: AlignCenter, right: AlignRight }[el.align || "left"];
  return (
    <>
      <PopButton
        className="he-tb"
        label={<span style={{ fontFamily: font.css, fontSize: 14, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", display: "inline-block", verticalAlign: "middle" }}>{font.name}</span>}
        title="Shrift"
        width={240}
      >
        {(close) => FONTS.map((f) => (
          <button key={f.id} type="button" className={`he-menu-item${f.id === el.font ? " active" : ""}`} style={{ fontFamily: f.css, fontSize: 17, background: f.id === el.font ? "rgba(184,134,59,0.12)" : undefined }} onClick={() => { api.update(ids, { font: f.id }); close(); }}>
            {f.name}
          </button>
        ))}
      </PopButton>
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.line}`, borderRadius: 8, height: 32, margin: "0 2px", flexShrink: 0 }}>
        <button type="button" className="he-tb" style={{ minWidth: 26, height: 30, padding: 0 }} title="Kichraytirish" onClick={() => setSize(Math.round(el.fontSize) - (el.fontSize > 40 ? 4 : 2))}><Minus size={14} /></button>
        <input
          key={Math.round(el.fontSize)}
          defaultValue={Math.round(el.fontSize)}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") e.currentTarget.blur(); }}
          onBlur={(e) => { const n = Number(e.currentTarget.value); if (Number.isFinite(n) && n > 0) setSize(n); }}
          style={{ width: 38, border: "none", textAlign: "center", fontSize: 13, fontWeight: 600, background: "transparent", outline: "none", color: C.ink }}
          aria-label="Shrift o'lchami"
        />
        <button type="button" className="he-tb" style={{ minWidth: 26, height: 30, padding: 0 }} title="Kattalashtirish" onClick={() => setSize(Math.round(el.fontSize) + (el.fontSize >= 40 ? 4 : 2))}><Plus size={14} /></button>
      </div>
      <PopButton icon={<Baseline size={16} color={el.color} strokeWidth={2.4} />} title="Matn rangi" width={250}>
        <Swatches colors={PALETTE} value={el.color} onChange={(c) => api.update(ids, { color: c }, { coalesce: "textcolor" })} />
      </PopButton>
      <Btn icon={Bold} title="Qalin" active={el.bold} onClick={() => api.update(ids, { bold: !el.bold })} />
      <Btn icon={Italic} title="Kursiv" active={el.italic} onClick={() => api.update(ids, { italic: !el.italic })} />
      <Btn icon={Underline} title="Tagiga chizilgan" active={el.underline} onClick={() => api.update(ids, { underline: !el.underline })} />
      <Btn icon={CaseUpper} title="Bosh harflar" active={el.uppercase} onClick={() => api.update(ids, { uppercase: !el.uppercase })} />
      <Btn icon={AlignIcon} title="Tekislash" onClick={() => api.update(ids, { align: nextAlign })} />
      <PopButton icon={<LetterText size={16} />} title="Oraliqlar" width={240}>
        <Slider label="Harflar oralig'i" value={el.letterSpacing || 0} min={-5} max={40} step={0.5} onChange={(n) => api.update(ids, { letterSpacing: n }, { live: true })} onCommit={api.endLive} />
        <Slider label="Qator balandligi" value={el.lineHeight || 1.3} min={0.8} max={2.6} step={0.05} onChange={(n) => api.update(ids, { lineHeight: n }, { live: true })} onCommit={api.endLive} />
      </PopButton>
      <OpacityPop els={els} api={api} />
    </>
  );
}

function StickerTools({ els, api }) {
  const el = els[0];
  const def = stickerDef(el.stickerId);
  return (
    <>
      <PopButton icon={<span style={{ width: 18, height: 18, borderRadius: "50%", background: el.color || def.color, border: "1px solid rgba(0,0,0,0.15)", display: "inline-block" }} />} title="Rang" width={250}>
        <Swatches colors={[def.color, ...PALETTE.filter((c) => c !== def.color)]} value={el.color} onChange={(c) => api.update(els.map((e) => e.id), { color: c }, { coalesce: "stickercolor" })} />
      </PopButton>
      <FlipPop els={els} api={api} />
      <OpacityPop els={els} api={api} />
    </>
  );
}

function CropTools({ el, api }) {
  return (
    <>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, padding: "0 6px" }}>Kattalik</span>
      <input
        type="range"
        className="he-range"
        style={{ width: 120 }}
        min={100}
        max={500}
        value={Math.round((el.crop?.s || 1) * 100)}
        onChange={(e) => api.cropUpdate({ s: Number(e.target.value) / 100 })}
      />
      <Sep />
      <Btn icon={RotateCw} title="90° burish" onClick={() => api.cropUpdate({}, { imgRot: ((el.imgRot || 0) + 90) % 360 })} />
      <Btn icon={FlipHorizontal2} title="Gorizontal aks" onClick={() => api.cropUpdate({}, { flipH: !el.flipH })} />
      <Btn icon={FlipVertical2} title="Vertikal aks" onClick={() => api.cropUpdate({}, { flipV: !el.flipV })} />
      <Btn icon={Undo2} title="Qayta tiklash" onClick={() => api.cropUpdate({ s: 1, cx: 0.5, cy: 0.5 }, { imgRot: 0, flipH: false, flipV: false })} />
      <Sep />
      <Btn icon={X} label="Bekor" onClick={() => api.exitCrop(false)} />
      <button type="button" className="he-tb" style={{ background: C.ink, color: "#F2EDE2" }} onClick={() => api.exitCrop(true)}><Check size={16} /> Tayyor</button>
    </>
  );
}

export function ContextToolbar({ api, els, page, view, stage, cropEl, hidden }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const target = cropEl ? [cropEl] : els;
  const bounds = screenBounds(target, view);

  // Har renderdan keyin o'lchaymiz: toolbar kengligi tarkibiga qarab o'zgaradi.
  // setPos faqat qiymat o'zgarganda holatni yangilaydi, shuning uchun sikl bo'lmaydi.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !bounds) return;
    const tw = node.offsetWidth, th = node.offsetHeight;
    const cx = (bounds.left + bounds.right) / 2;
    let left = Math.max(8, Math.min(stage.w - tw - 8, cx - tw / 2));
    let top = bounds.top - th - 16;
    if (top < 8) top = bounds.bottom + 50;
    if (top > stage.h - th - 8) top = 8;
    setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }));
  });

  if (!target.length || hidden || !bounds) return null;
  const selIds = new Set(els.map((e) => e.id));
  const types = new Set(els.map((e) => e.type));
  const sameGroup = els.length > 1 && els[0].groupId && els.every((e) => e.groupId === els[0].groupId);

  const multiHead = els.length > 1 ? (
    <>
      {sameGroup
        ? <Btn icon={Ungroup} label="Ajratish" title="Guruhdan chiqarish (Ctrl+Shift+G)" onClick={api.ungroup} />
        : <Btn icon={Group} label="Guruhlash" title="Guruhlash (Ctrl+G)" onClick={api.group} />}
      <AlignPop api={api} count={els.length} />
    </>
  ) : null;

  let content;
  if (cropEl) {
    content = <CropTools el={cropEl} api={api} />;
  } else if (els.length === 1 && (els[0].type === "photo" || els[0].type === "video")) {
    content = <><PhotoTools el={els[0]} api={api} /><CommonTail api={api} els={els} page={page} selIds={selIds} /></>;
  } else if (types.size === 1 && types.has("text")) {
    content = <>{multiHead}{multiHead && <Sep />}<TextTools els={els} api={api} /><CommonTail api={api} els={els} page={page} selIds={selIds} /></>;
  } else if (types.size === 1 && types.has("sticker")) {
    content = <>{multiHead}{multiHead && <Sep />}<StickerTools els={els} api={api} /><CommonTail api={api} els={els} page={page} selIds={selIds} /></>;
  } else {
    content = <>{multiHead}<OpacityPop els={els} api={api} /><CommonTail api={api} els={els} page={page} selIds={selIds} /></>;
  }

  return (
    <div
      ref={ref}
      className="he-toolbar"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {content}
    </div>
  );
}

