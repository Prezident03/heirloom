"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Undo2, Redo2, Check, Loader2, CloudOff, AlertTriangle, Eye, Download, Maximize2, Minimize2, Ellipsis,
  Keyboard, Trash2, FileImage, FileText, X,
} from "lucide-react";
import { PAGE_W, PAGE_H, EDITOR_FONT_IMPORT, TEXT_PRESETS, ZOOM_LEVELS, ZOOM_MIN, ZOOM_MAX, isDarkBackground, setPageFormat, LEGACY_FORMAT, DEFAULT_FORMAT, PAGE_FORMATS } from "./constants";
import { convertDocFormat, albumToDoc, blankPage, clonePage, cloneElements, coverFromDoc, pageToRow, uid, aabb, unionBounds, rotatePoint } from "./model";
import { TEMPLATE_BY_ID, buildTemplateElements } from "./templates";
import { stickerDef } from "./stickers";
import { snapMove, resizeElement, scaleGroup, angleBetween, normalizeAngle, snapAngle } from "./geometry";
import { PageView, photoInnerBox, imageBox, clampCrop } from "./ElementView";
import { SelectionOverlay, GuidesOverlay, MarqueeOverlay, CropOverlay } from "./Overlay";
import { ContextToolbar } from "./Toolbar";
import { Rail, Drawer, readDrag, isEditorDrag, currentDrag } from "./Panels";
import { PagesBar } from "./PagesBar";
import { Preview } from "./Preview";
import { EDITOR_CSS, PopButton, C } from "./ui";
import { uploadMediaFile, readDimensions, mediaKind, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "./media";
import { exportPageImage, exportAlbumPdf, slugify } from "./exporter";
import { SharePopover } from "./SharePopover";
import { t as tr, localeCode } from "@/lib/i18n";

const DRAFT_PREFIX = "heirloom:album-draft:";
const clock = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const HISTORY_LIMIT = 200;

// ------------------------------------------------------------
// Sof (pure) yordamchilar — hujjatni o'zgarmas (immutable) tarzda yangilaydi.
// O'zgarmagan sahifalar o'sha obyekt bo'lib qoladi: shu tufayli qaysi
// sahifa saqlanishi kerakligini oddiy `!==` bilan aniqlaymiz.
// ------------------------------------------------------------
function mapPage(d, pid, fn) {
  let changed = false;
  const pages = d.pages.map((p) => {
    if (p.id !== pid) return p;
    const np = fn(p);
    if (np !== p) changed = true;
    return np;
  });
  return changed ? { ...d, pages } : d;
}

function patchEls(p, ids, patch) {
  const set = ids instanceof Set ? ids : new Set(ids);
  let changed = false;
  const elements = p.elements.map((e) => {
    if (!set.has(e.id)) return e;
    const pt = typeof patch === "function" ? patch(e) : patch;
    if (!pt) return e;
    changed = true;
    return { ...e, ...pt };
  });
  return changed ? { ...p, elements } : p;
}

function mapAllSrc(d, from, to) {
  if (!d) return d;
  let changed = false;
  const pages = d.pages.map((p) => {
    const hit = p.bgImage === from || p.elements.some((e) => e.src === from);
    if (!hit) return p;
    changed = true;
    return {
      ...p,
      bgImage: p.bgImage === from ? to : p.bgImage,
      elements: p.elements.map((e) => (e.src === from ? { ...e, src: to } : e)),
    };
  });
  return changed ? { ...d, pages } : d;
}

function isField(target) {
  return !!target?.closest?.("input, textarea, select, [contenteditable='true'], [contenteditable='plaintext-only']");
}

function readDraft(albumId) {
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + albumId);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d?.doc?.pages?.length ? d : null;
  } catch {
    return null;
  }
}
function writeDraft(albumId, doc) {
  try { window.localStorage.setItem(DRAFT_PREFIX + albumId, JSON.stringify({ t: Date.now(), doc })); } catch { /* joy yetmasa — e'tiborsiz */ }
}
function clearDraft(albumId) {
  try { window.localStorage.removeItem(DRAFT_PREFIX + albumId); } catch { /* ignore */ }
}

const SHORTCUTS = [
  ["Ushlab surish", "Sichqoncha bilan"], ["Bir nechtasini tanlash", "Shift + bosish"], ["Hammasini tanlash", "Ctrl + A"],
  ["O'chirish", "Delete / Backspace"], ["Bekor qilish / Qaytarish", "Ctrl + Z / Ctrl + Shift + Z"],
  ["Nusxa olish / Joylash", "Ctrl + C / Ctrl + V"], ["Dublikat", "Ctrl + D"], ["Guruhlash / Ajratish", "Ctrl + G / Ctrl + Shift + G"],
  ["1px / 10px surish", "Strelkalar / Shift + Strelka"], ["Matnni tahrirlash, rasmni kesish", "Ikki marta bosish"],
  ["Erkin o'lcham (rasm)", "Shift + burchak"], ["15° qadam bilan burish", "Shift + aylantirish"],
  ["Tekislashsiz surish", "Ctrl + surish"], ["Canvasni surish", "Probel + sudrash"], ["Masshtab", "Ctrl + g'ildirak / Ctrl + −/+"],
  ["Ekranga moslash", "Ctrl + 0"], ["Saqlash", "Ctrl + S"], ["Qatlam oldinga / orqaga", "Ctrl + ] / Ctrl + ["],
  ["Tanlovni bekor qilish", "Esc"],
];

export default function Editor({
  album, familySlug, canEdit, photos = [], media = [],
  saveAlbumAction, renameAlbumAction, deleteAlbumAction, registerMediaAction, shareAlbumAction,
  isPremium = false,
  onBack, initialPanel = null,
}) {
  const router = useRouter();

  // ========================== Hujjat va tarix ==========================
  // Bazadagi holat va editor boshlang'ich holati. Bo'sh eski (4:3) albom darhol keng formatga o'tkaziladi.
  const [serverDoc, initialDoc] = useMemo(() => {
    const d = albumToDoc(album);
    const empty = d.pages.every((p) => p.elements.length === 0);
    return [d, d.format === LEGACY_FORMAT && empty ? { ...d, format: DEFAULT_FORMAT } : d];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [doc, setDocState] = useState(initialDoc);
  // Sahifa balandligi hujjat formatiga bog'liq — bolalar render bo'lishidan oldin o'rnatamiz.
  setPageFormat(doc.format || LEGACY_FORMAT);
  const docRef = useRef(initialDoc);
  const savedRef = useRef(serverDoc);
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const liveBaseRef = useRef(null);
  const coalesceRef = useRef(null);
  const [hist, setHist] = useState({ undo: false, redo: false });
  const bump = () => setHist({ undo: pastRef.current.length > 0 || !!liveBaseRef.current, redo: futureRef.current.length > 0 });
  const latest = useRef({});

  const setDoc = useCallback((d) => {
    docRef.current = d;
    setDocState(d);
    latest.current.onDocChanged?.(d);
  }, []);
  const pushPast = (d) => {
    pastRef.current.push(d);
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
    futureRef.current = [];
  };
  const endLive = useCallback(() => {
    const base = liveBaseRef.current;
    if (!base) return;
    liveBaseRef.current = null;
    if (base !== docRef.current) { pushPast(base); coalesceRef.current = null; bump(); }
  }, []);
  const cancelLive = () => {
    const base = liveBaseRef.current;
    if (!base) return;
    liveBaseRef.current = null;
    setDoc(base);
  };
  const commit = (updater, opts = {}) => {
    endLive();
    const prev = docRef.current;
    const next = updater(prev);
    if (!next || next === prev) return prev;
    const now = clock();
    const c = coalesceRef.current;
    if (opts.coalesce && c && c.key === opts.coalesce && now - c.t < 1200) { c.t = now; futureRef.current = []; }
    else { pushPast(prev); coalesceRef.current = opts.coalesce ? { key: opts.coalesce, t: now } : null; }
    setDoc(next);
    bump();
    return next;
  };
  const live = (updater) => {
    if (!liveBaseRef.current) { liveBaseRef.current = docRef.current; setHist((h) => (h.undo ? h : { ...h, undo: true })); }
    const next = updater(docRef.current);
    if (next && next !== docRef.current) setDoc(next);
  };
  const silent = useCallback((updater) => {
    const next = updater(docRef.current);
    if (next && next !== docRef.current) setDoc(next);
  }, [setDoc]);

  // ========================== Tanlov va rejimlar ==========================
  const [pageId, setPageIdState] = useState(initialDoc.pages[0].id);
  const [sel, setSel] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [cropId, setCropId] = useState(null);
  const [enteredGroup, setEnteredGroup] = useState(null);
  const [panel, setPanel] = useState(canEdit ? initialPanel : null);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [draft, setDraft] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [sessionMedia, setSessionMedia] = useState([]);
  const [exporting, setExporting] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [title, setTitle] = useState(album.title);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [space, setSpace] = useState(false);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [guides, setGuides] = useState(null);
  const [marquee, setMarquee] = useState(null);
  const [badge, setBadge] = useState(null);
  const [gestureKind, setGestureKind] = useState(null);

  const page = doc.pages.find((p) => p.id === pageId) || doc.pages[0];
  const pageIndex = doc.pages.indexOf(page);
  const selSet = useMemo(() => new Set(sel), [sel]);
  const selEls = useMemo(() => page.elements.filter((e) => selSet.has(e.id)), [page, selSet]);
  const cropEl = cropId ? page.elements.find((e) => e.id === cropId) : null;
  const groupMode = selEls.length > 1 && !!selEls[0].groupId && enteredGroup !== selEls[0].groupId
    && selEls.every((e) => e.groupId === selEls[0].groupId)
    && page.elements.filter((e) => e.groupId === selEls[0].groupId).length === selEls.length;

  const toastTimer = useRef(null);
  const toastSeq = useRef(0);
  const showToast = (text, action) => {
    clearTimeout(toastTimer.current);
    toastSeq.current += 1;
    setToast({ text, action, id: toastSeq.current });
    toastTimer.current = setTimeout(() => setToast(null), action ? 5000 : 3200);
  };

  const setPageId = (id) => {
    if (id === pageId) return;
    if (cropId) exitCrop(true);
    setEditingId(null);
    setSel([]);
    setEnteredGroup(null);
    setPageIdState(id);
  };

  // ========================== Ko'rinish (zoom / pan) ==========================
  const stageRef = useRef(null);
  const rootRef = useRef(null);
  const [stage, setStage] = useState({ w: 900, h: 600 });
  const [zoom, setZoom] = useState("fit");
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const measure = () => setStage({ w: node.clientWidth, h: node.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const compact = stage.w < 640;
  const pad = compact || stage.h < 420 ? 8 : 24;
  const fit = Math.max(0.05, Math.min((stage.w - pad * 2) / PAGE_W, (stage.h - pad * 2) / PAGE_H));
  const s = zoom === "fit" ? fit : zoom;
  const effPan = zoom === "fit" ? { x: 0, y: 0 } : pan;
  const ox = stage.w / 2 + effPan.x - (PAGE_W * s) / 2;
  const oy = stage.h / 2 + effPan.y - (PAGE_H * s) / 2;
  const view = useMemo(() => ({ s, ox, oy }), [s, ox, oy]);

  const clampPan = (p, scale) => {
    const st = latest.current.stage;
    const mx = Math.max(0, (PAGE_W * scale) / 2 + st.w / 2 - 80);
    const my = Math.max(0, (PAGE_H * scale) / 2 + st.h / 2 - 80);
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) };
  };

  const zoomTo = (ns, anchor) => {
    const v = latest.current.view;
    const st = latest.current.stage;
    const scale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, ns));
    const ax = anchor ? anchor.x : st.w / 2;
    const ay = anchor ? anchor.y : st.h / 2;
    const px = (ax - v.ox) / v.s, py = (ay - v.oy) / v.s;
    const nox = ax - px * scale, noy = ay - py * scale;
    setZoom(scale);
    setPan(clampPan({ x: nox - st.w / 2 + (PAGE_W * scale) / 2, y: noy - st.h / 2 + (PAGE_H * scale) / 2 }, scale));
  };

  const onZoom = (cmd) => {
    const cur = latest.current.view.s;
    if (cmd === "fit") { setZoom("fit"); setPan({ x: 0, y: 0 }); return; }
    if (cmd === "in") { const n = ZOOM_LEVELS.find((z) => z > cur * 1.01); zoomTo(n ?? ZOOM_MAX); return; }
    if (cmd === "out") { const n = [...ZOOM_LEVELS].reverse().find((z) => z < cur * 0.99); zoomTo(n ?? ZOOM_MIN); return; }
    if (typeof cmd === "number") zoomTo(cmd);
  };

  const toPage = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect();
    const v = latest.current.view;
    return { x: (clientX - r.left - v.ox) / v.s, y: (clientY - r.top - v.oy) / v.s };
  };
  const toStage = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  // ========================== Element amallari ==========================
  const findEl = (id) => docRef.current.pages.find((p) => p.id === pageId)?.elements.find((e) => e.id === id);

  const update = (ids, patch, opts = {}) => {
    const updater = (d) => mapPage(d, pageId, (p) => patchEls(p, ids, patch));
    if (opts.live) live(updater); else commit(updater, opts);
  };

  const insertCount = useRef(0);
  const nextInsertPoint = () => {
    const v = latest.current.view, st = latest.current.stage;
    const cx = Math.max(80, Math.min(PAGE_W - 80, (st.w / 2 - v.ox) / v.s));
    const cy = Math.max(80, Math.min(PAGE_H - 80, (st.h / 2 - v.oy) / v.s));
    const k = insertCount.current++ % 6;
    return { x: cx + k * 24, y: cy + k * 24 };
  };

  const appendElements = (els, { select = true } = {}) => {
    commit((d) => mapPage(d, pageId, (p) => ({ ...p, elements: [...p.elements, ...els] })));
    if (select) { setSel(els.map((e) => e.id)); setEnteredGroup(null); }
  };

  const newMediaElement = ({ src, kind, aspect }, at) => {
    const a = aspect || 4 / 3;
    let w = PAGE_W * 0.42, h = w / a;
    if (h > PAGE_H * 0.6) { h = PAGE_H * 0.6; w = h * a; }
    const c = at || nextInsertPoint();
    return {
      id: uid(), type: kind === "video" ? "video" : "photo",
      x: c.x - w / 2, y: c.y - h / 2, w, h, rotation: 0,
      groupId: null, locked: false, opacity: 1, createdAt: new Date().toISOString(),
      src, aspect: aspect || null, frame: "none", crop: { s: 1, cx: 0.5, cy: 0.5 }, imgRot: 0,
      flipH: false, flipV: false, filter: null, muted: true, caption: null, location: null,
    };
  };

  const fillPhoto = (id, { src, kind, aspect }) => {
    update([id], { src, aspect: aspect || null, type: kind === "video" ? "video" : "photo", crop: { s: 1, cx: 0.5, cy: 0.5 }, imgRot: 0 });
    setSel([id]);
  };

  const insertMedia = (m, at) => {
    const item = { src: m.url || m.src, kind: m.kind || "photo", aspect: m.aspect || (m.width && m.height ? m.width / m.height : null) };
    if (replaceTarget && findEl(replaceTarget)) { fillPhoto(replaceTarget, item); setReplaceTarget(null); return; }
    const single = selEls.length === 1 ? selEls[0] : null;
    if (!at && single && single.type === "photo" && !single.src) { fillPhoto(single.id, item); return; }
    appendElements([newMediaElement(item, at)]);
  };

  const addSticker = (id, at) => {
    const def = stickerDef(id);
    let w = def.group === "tape" ? 260 : def.group === "paper" ? 320 : def.group === "words" ? 300 : 150;
    let h = w / def.aspect;
    if (h > 360) { h = 360; w = h * def.aspect; }
    const c = at || nextInsertPoint();
    appendElements([{
      id: uid(), type: "sticker", x: c.x - w / 2, y: c.y - h / 2, w, h, rotation: def.group === "tape" ? -4 : 0,
      groupId: null, locked: false, opacity: 1, createdAt: new Date().toISOString(),
      stickerId: def.id, color: def.color, flipH: false, flipV: false,
    }]);
  };

  const addText = (presetId, at) => {
    const p = TEXT_PRESETS.find((t) => t.id === presetId) || TEXT_PRESETS[2];
    const c = at || nextInsertPoint();
    const dark = isDarkBackground(page.background) && !page.bgImage;
    const el = {
      id: uid(), type: "text", x: Math.max(0, c.x - p.w / 2), y: c.y - (p.fontSize * 1.3) / 2, w: p.w, h: p.fontSize * 1.3, rotation: 0,
      groupId: null, locked: false, opacity: 1, createdAt: new Date().toISOString(),
      text: tr(p.text), font: p.font, fontSize: p.fontSize, color: dark ? "#F2EDE2" : "#1E2621",
      align: presetId === "body" || presetId === "typewriter" ? "left" : "center",
      bold: !!p.bold, italic: !!p.italic, underline: false, uppercase: false, letterSpacing: 0, lineHeight: 1.3, autoHeight: true,
    };
    appendElements([el]);
    setEditingId(el.id);
  };

  const addFrame = (frameId, at) => {
    const dims = { polaroid: [330, 400], circle: [340, 340], film: [440, 330], tape: [360, 300] }[frameId] || [380, 300];
    const c = at || nextInsertPoint();
    const el = newMediaElement({ src: null, kind: "photo", aspect: null }, c);
    appendElements([{ ...el, frame: frameId, w: dims[0], h: dims[1], x: c.x - dims[0] / 2, y: c.y - dims[1] / 2 }]);
  };

  const applyTemplate = (tplId) => {
    const tpl = TEMPLATE_BY_ID[tplId];
    if (!tpl) return;
    const existing = page.elements.filter((e) => (e.type === "photo" || e.type === "video") && e.src);
    commit((d) => mapPage(d, pageId, (p) => ({ ...p, background: tpl.background, bgImage: null, elements: buildTemplateElements(tpl, existing) })));
    setSel([]); setEditingId(null); setCropId(null); setEnteredGroup(null);
    showToast(tr("\"{0}\" shabloni qo'llandi", { 0: tpl.name }), { label: "Bekor qilish", run: () => undo() });
  };

  const addPage = ({ templateId, openTemplates } = {}) => {
    const np = blankPage(page.background?.startsWith("solid:") ? page.background : "paper");
    if (templateId) {
      const tpl = TEMPLATE_BY_ID[templateId];
      if (tpl) { np.background = tpl.background; np.elements = buildTemplateElements(tpl); }
    }
    commit((d) => {
      const idx = d.pages.findIndex((p) => p.id === pageId);
      const pages = [...d.pages];
      pages.splice(idx + 1, 0, np);
      return { ...d, pages };
    });
    setSel([]); setEditingId(null); setCropId(null);
    setPageIdState(np.id);
    if (openTemplates) setPanel("templates");
  };

  const duplicatePage = (pid) => {
    const src = docRef.current.pages.find((p) => p.id === pid);
    if (!src) return;
    const np = clonePage(src);
    commit((d) => {
      const idx = d.pages.findIndex((p) => p.id === pid);
      const pages = [...d.pages];
      pages.splice(idx + 1, 0, np);
      return { ...d, pages };
    });
    setSel([]);
    setPageIdState(np.id);
    showToast(tr("Sahifa nusxalandi"));
  };

  const deletePage = (pid) => {
    const d0 = docRef.current;
    if (d0.pages.length < 2) return;
    const idx = d0.pages.findIndex((p) => p.id === pid);
    commit((d) => ({ ...d, pages: d.pages.filter((p) => p.id !== pid) }));
    if (pid === pageId) {
      const rest = d0.pages.filter((p) => p.id !== pid);
      setPageIdState(rest[Math.max(0, idx - 1)].id);
      setSel([]);
    }
    showToast(tr("Sahifa o'chirildi"), { label: "Qaytarish", run: () => undo() });
  };

  const movePage = (fromId, toIndex) => {
    commit((d) => {
      const pages = [...d.pages];
      const from = pages.findIndex((p) => p.id === fromId);
      if (from < 0) return d;
      const [moved] = pages.splice(from, 1);
      pages.splice(toIndex > from ? toIndex - 1 : toIndex, 0, moved);
      return pages.every((p, i) => p === d.pages[i]) ? d : { ...d, pages };
    });
  };

  const setBackground = (patch, opts) => commit((d) => mapPage(d, pageId, (p) => ({ ...p, ...patch })), opts);
  const applyBackgroundToAll = () => {
    commit((d) => ({ ...d, pages: d.pages.map((p) => (p.background === page.background && p.bgImage === page.bgImage ? p : { ...p, background: page.background, bgImage: page.bgImage })) }));
    showToast(tr("Fon barcha sahifalarga qo'llandi"));
  };

  const selectableIds = (ids) => ids.filter((id) => page.elements.some((e) => e.id === id));

  const remove = () => {
    const ids = new Set(selEls.filter((e) => !e.locked).map((e) => e.id));
    if (!ids.size) return;
    commit((d) => mapPage(d, pageId, (p) => ({ ...p, elements: p.elements.filter((e) => !ids.has(e.id)) })));
    setSel([]); setEditingId(null);
  };

  const duplicate = () => {
    if (!selEls.length) return;
    const clones = cloneElements(selEls.map((e) => ({ ...e, locked: false })), 24);
    appendElements(clones);
  };

  const clipboardRef = useRef(null);
  const copy = () => { if (selEls.length) clipboardRef.current = { els: selEls.map((e) => ({ ...e })), count: 0 }; };
  const cut = () => { copy(); remove(); };
  const paste = () => {
    const clip = clipboardRef.current;
    if (!clip?.els?.length) return;
    clip.count += 1;
    appendElements(cloneElements(clip.els, 24 * clip.count));
  };

  const toggleLock = () => {
    const anyUnlocked = selEls.some((e) => !e.locked);
    update(selEls.map((e) => e.id), { locked: anyUnlocked });
  };

  const group = () => {
    if (selEls.length < 2) return;
    const gid = uid();
    update(selEls.map((e) => e.id), { groupId: gid });
    setEnteredGroup(null);
  };
  const ungroup = () => {
    if (!selEls.some((e) => e.groupId)) return;
    update(selEls.map((e) => e.id), { groupId: null });
    setEnteredGroup(null);
  };

  const layer = (dir) => {
    if (!sel.length) return;
    commit((d) => mapPage(d, pageId, (p) => {
      const arr = [...p.elements];
      const isSel = (e) => selSet.has(e.id);
      if (dir === "front") return { ...p, elements: [...arr.filter((e) => !isSel(e)), ...arr.filter(isSel)] };
      if (dir === "back") return { ...p, elements: [...arr.filter(isSel), ...arr.filter((e) => !isSel(e))] };
      let changed = false;
      if (dir === "forward") {
        for (let i = arr.length - 2; i >= 0; i--) if (isSel(arr[i]) && !isSel(arr[i + 1])) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; changed = true; }
      } else {
        for (let i = 1; i < arr.length; i++) if (isSel(arr[i]) && !isSel(arr[i - 1])) { [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]; changed = true; }
      }
      return changed ? { ...p, elements: arr } : p;
    }));
  };

  const moveLayer = (id, toIndex) => {
    commit((d) => mapPage(d, pageId, (p) => {
      const arr = [...p.elements];
      const from = arr.findIndex((e) => e.id === id);
      if (from < 0 || from === toIndex) return p;
      const [m] = arr.splice(from, 1);
      arr.splice(toIndex, 0, m);
      return { ...p, elements: arr };
    }));
  };

  const align = (kind, toPageBounds = false) => {
    const targets = selEls.filter((e) => !e.locked);
    if (!targets.length) return;
    const ref = targets.length === 1 || toPageBounds ? { minX: 0, minY: 0, maxX: PAGE_W, maxY: PAGE_H } : unionBounds(targets);
    const patches = new Map();
    for (const el of targets) {
      const b = aabb(el);
      let dx = 0, dy = 0;
      if (kind === "left") dx = ref.minX - b.minX;
      if (kind === "right") dx = ref.maxX - b.maxX;
      if (kind === "hcenter") dx = (ref.minX + ref.maxX) / 2 - (b.minX + b.maxX) / 2;
      if (kind === "top") dy = ref.minY - b.minY;
      if (kind === "bottom") dy = ref.maxY - b.maxY;
      if (kind === "vcenter") dy = (ref.minY + ref.maxY) / 2 - (b.minY + b.maxY) / 2;
      patches.set(el.id, { x: el.x + dx, y: el.y + dy });
    }
    update(targets.map((e) => e.id), (e) => patches.get(e.id), { coalesce: toPageBounds ? "center-page" : undefined });
  };

  const distribute = (axis) => {
    const targets = selEls.filter((e) => !e.locked);
    if (targets.length < 3) return;
    const items = targets.map((el) => ({ el, b: aabb(el) }));
    const lo = axis === "x" ? "minX" : "minY", hi = axis === "x" ? "maxX" : "maxY";
    items.sort((a, b) => a.b[lo] - b.b[lo]);
    const total = items[items.length - 1].b[hi] - items[0].b[lo];
    const sizes = items.reduce((sum, it) => sum + (it.b[hi] - it.b[lo]), 0);
    const gap = (total - sizes) / (items.length - 1);
    let cursor = items[0].b[lo];
    const patches = new Map();
    for (const it of items) {
      const d = cursor - it.b[lo];
      patches.set(it.el.id, axis === "x" ? { x: it.el.x + d } : { y: it.el.y + d });
      cursor += it.b[hi] - it.b[lo] + gap;
    }
    update(targets.map((e) => e.id), (e) => patches.get(e.id));
  };

  const nudge = (dx, dy) => {
    const ids = selEls.filter((e) => !e.locked).map((e) => e.id);
    if (!ids.length) return;
    update(ids, (e) => ({ x: e.x + dx, y: e.y + dy }), { coalesce: "nudge" });
  };

  // ---------- Crop ----------
  const enterCrop = (id) => {
    const el = findEl(id);
    if (!el || !el.src || el.locked) return;
    endLive();
    setEditingId(null);
    setSel([id]);
    liveBaseRef.current = docRef.current;
    setCropId(id);
  };
  function exitCrop(apply) {
    setCropId(null);
    if (apply) endLive(); else cancelLive();
  }
  const cropUpdate = (cropPatch, elPatch = {}) => {
    const el = cropId && findEl(cropId);
    if (!el) return;
    const next = { ...el, ...elPatch };
    const { iw, ih } = photoInnerBox(next);
    const crop = clampCrop({ ...(el.crop || { s: 1, cx: 0.5, cy: 0.5 }), ...cropPatch }, iw, ih, next.aspect, next.imgRot);
    live((d) => mapPage(d, pageId, (p) => patchEls(p, [el.id], { ...elPatch, crop })));
  };

  // ---------- Matn ----------
  const textCommit = (id, text) => {
    setEditingId((cur) => (cur === id ? null : cur));
    const el = findEl(id);
    if (!el) return;
    if (!text.trim()) {
      commit((d) => mapPage(d, pageId, (p) => ({ ...p, elements: p.elements.filter((e) => e.id !== id) })));
      setSel((s0) => s0.filter((x) => x !== id));
    } else if (text !== el.text) {
      update([id], { text });
    }
  };
  const handleTextCommit = useCallback((id, text) => latest.current.textCommit(id, text), []);
  const handleMeasure = useCallback((id, h) => {
    silent((d) => ({ ...d, pages: d.pages.map((p) => (p.elements.some((e) => e.id === id) ? patchEls(p, [id], (e) => (Math.abs(e.h - h) > 0.5 ? { h } : null)) : p)) }));
  }, [silent]);
  const handleAspect = useCallback((id, a) => {
    silent((d) => ({ ...d, pages: d.pages.map((p) => (p.elements.some((e) => e.id === id) ? patchEls(p, [id], (e) => (!e.aspect || Math.abs(e.aspect - a) > 0.01 ? { aspect: a } : null)) : p)) }));
  }, [silent]);

  // ========================== Tarix (undo/redo) ==========================
  const afterJump = (d) => {
    setEditingId(null);
    setCropId(null);
    const pg = d.pages.find((p) => p.id === latest.current.pageId) || d.pages[0];
    if (pg.id !== latest.current.pageId) setPageIdState(pg.id);
    setSel((s0) => s0.filter((id) => pg.elements.some((e) => e.id === id)));
  };

  function undo() {
    if (cropId) { exitCrop(false); return; }
    endLive();
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(docRef.current);
    coalesceRef.current = null;
    setDoc(prev); bump(); afterJump(prev);
  }
  function redo() {
    if (cropId) exitCrop(true);
    endLive();
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(docRef.current);
    coalesceRef.current = null;
    setDoc(next); bump(); afterJump(next);
  }

  // ========================== Yuklash ==========================
  const fileInputRef = useRef(null);
  const fileTargetRef = useRef(null);
  const pickFile = (targetId) => {
    fileTargetRef.current = targetId || null;
    fileInputRef.current?.click();
  };

  const replaceSrcEverywhere = (from, to) => {
    pastRef.current = pastRef.current.map((d) => mapAllSrc(d, from, to));
    futureRef.current = futureRef.current.map((d) => mapAllSrc(d, from, to));
    if (liveBaseRef.current) liveBaseRef.current = mapAllSrc(liveBaseRef.current, from, to);
    silent((d) => mapAllSrc(d, from, to));
  };

  const startUpload = (file, kind, dims, localUrl) => {
    const upId = uid();
    setUploads((u) => [...u, { id: upId, name: file.name || "fayl", progress: 0 }]);
    uploadMediaFile(file, {
      familySlug, registerMediaAction, dims,
      onProgress: (pct) => setUploads((u) => u.map((x) => (x.id === upId ? { ...x, progress: pct } : x))),
    }).then((res) => {
      replaceSrcEverywhere(localUrl, res.url);
      setSessionMedia((m) => [{ url: res.url, kind: res.kind, width: res.width, height: res.height }, ...m]);
      setUploads((u) => u.filter((x) => x.id !== upId));
      setTimeout(() => URL.revokeObjectURL(localUrl), 30000);
    }).catch((err) => {
      replaceSrcEverywhere(localUrl, null);
      const msg = tr(err?.message || "Yuklashda xato yuz berdi.");
      setUploads((u) => u.map((x) => (x.id === upId ? { ...x, error: msg } : x)));
      setTimeout(() => setUploads((u) => u.filter((x) => x.id !== upId)), 7000);
      showToast(msg);
    });
  };

  const uploadFiles = async (files, { at, targetId } = {}) => {
    if (!canEdit) return;
    const list = files.filter((f) => mediaKind(f));
    if (!list.length) { showToast(tr("Faqat rasm yoki video fayllarini qo'shish mumkin.")); return; }
    const newEls = [];
    let target = targetId ? findEl(targetId) : null;
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const kind = mediaKind(file);
      if (kind === "video" && !isPremium) { showToast(tr("Video yuklash faqat Premium obunachilar uchun.")); continue; }
      if (kind === "photo" && file.size > MAX_IMAGE_BYTES) { showToast(tr("{0}: rasm 25MB dan katta.", { 0: file.name })); continue; }
      if (kind === "video" && file.size > MAX_VIDEO_BYTES) { showToast(tr("{0}: video 200MB dan katta.", { 0: file.name })); continue; }
      const dims = await readDimensions(file);
      const aspect = dims.width && dims.height ? dims.width / dims.height : null;
      const local = dims.previewUrl;
      if (target && (target.type === "photo" || target.type === "video")) {
        fillPhoto(target.id, { src: local, kind, aspect });
        target = null;
      } else {
        const base = at ? { x: at.x + i * 28, y: at.y + i * 28 } : undefined;
        newEls.push(newMediaElement({ src: local, kind, aspect }, base));
      }
      startUpload(file, kind, dims, local);
    }
    if (newEls.length) appendElements(newEls);
    setReplaceTarget(null);
  };

  const uploadBackground = async (file) => {
    if (mediaKind(file) !== "photo") { showToast(tr("Fon uchun rasm tanlang.")); return; }
    if (file.size > MAX_IMAGE_BYTES) { showToast(tr("Rasm 25MB dan katta.")); return; }
    const dims = await readDimensions(file);
    setBackground({ bgImage: dims.previewUrl });
    startUpload(file, "photo", dims, dims.previewUrl);
  };

  const library = useMemo(() => {
    const seen = new Set();
    const out = [];
    const push = (m) => { if (!m.url || seen.has(m.url) || m.url.startsWith("blob:")) return; seen.add(m.url); out.push(m); };
    sessionMedia.forEach(push);
    media.forEach((m) => push({ url: m.url, kind: m.kind, width: m.width, height: m.height }));
    photos.forEach((p) => push({ url: p.photo_url, kind: "photo" }));
    doc.pages.forEach((p) => p.elements.forEach((e) => { if (e.src && (e.type === "photo" || e.type === "video")) push({ url: e.src, kind: e.type, width: e.aspect ? e.aspect * 1000 : null, height: e.aspect ? 1000 : null }); }));
    return out;
  }, [sessionMedia, media, photos, doc]);

  // Rasmlar papkalarga ajratiladi: shu albom, albomga qo'yilmagan yuklanganlar, boshqa albomlar.
  const folders = useMemo(() => {
    const byUrl = new Map(library.map((m) => [m.url, m]));
    const item = (url) => byUrl.get(url) || { url, kind: "photo" };
    const current = [];
    const seenCur = new Set();
    doc.pages.forEach((p) => p.elements.forEach((e) => {
      if (e.type === "photo" && e.src && !e.src.startsWith("blob:") && !seenCur.has(e.src)) { seenCur.add(e.src); current.push(item(e.src)); }
    }));
    const others = new Map();
    const inAlbums = new Set(seenCur);
    photos.forEach((p) => {
      if (!p.photo_url) return;
      inAlbums.add(p.photo_url);
      if (p.album_id === album.id) return;
      if (!others.has(p.album_id)) others.set(p.album_id, { id: p.album_id, name: p.album_title || tr("Albom"), items: [], seen: new Set() });
      const f = others.get(p.album_id);
      if (!f.seen.has(p.photo_url)) { f.seen.add(p.photo_url); f.items.push(item(p.photo_url)); }
    });
    const uploaded = library.filter((m) => m.kind === "photo" && !inAlbums.has(m.url));
    return [
      { id: "current", name: tr("Shu albom"), hint: tr("Bu albomdagi rasmlar"), items: current },
      { id: "uploads", name: tr("Yuklanganlar"), hint: tr("Hali albomga qo'yilmagan"), items: uploaded },
      ...[...others.values()].map(({ seen, ...f }) => f), // eslint-disable-line no-unused-vars
    ];
  }, [library, doc, photos, album.id]);

  // ========================== Saqlash ==========================
  const [saveState, setSaveState] = useState("saved");
  const saveTimer = useRef(null);
  const inflight = useRef(false);
  const pendingSave = useRef(false);
  const failures = useRef(0);
  const gestureRef = useRef(null);

  const buildPayload = (base, target) => {
    const baseById = new Map(base.pages.map((p) => [p.id, p]));
    const dirty = target.pages.filter((p) => baseById.get(p.id) !== p);
    const orderChanged = base.pages.length !== target.pages.length || base.pages.some((p, i) => p.id !== target.pages[i]?.id);
    setPageFormat(target.format || LEGACY_FORMAT);
    const formatChanged = (base.format || LEGACY_FORMAT) !== (target.format || LEGACY_FORMAT);
    if (!dirty.length && !orderChanged && !formatChanged) return null;
    const rows = dirty.map(pageToRow).map((r) => ({
      ...r,
      background_image_url: r.background_image_url?.startsWith("blob:") ? null : r.background_image_url,
      elements: r.elements.map((e) => (e.photo_url?.startsWith("blob:") ? { ...e, photo_url: null } : e)),
    }));
    const cover = coverFromDoc(target);
    return { pageOrder: target.pages.map((p) => p.id), pages: rows, coverUrl: cover && !cover.startsWith("blob:") ? cover : null, pageFormat: target.format || LEGACY_FORMAT };
  };

  const runSave = useCallback(async () => {
    clearTimeout(saveTimer.current);
    if (!canEdit) return true;
    if (gestureRef.current || liveBaseRef.current) { saveTimer.current = setTimeout(() => latest.current.runSave(), 700); return false; }
    if (inflight.current) { pendingSave.current = true; return false; }
    const target = docRef.current;
    const payload = buildPayload(savedRef.current, target);
    if (!payload) { savedRef.current = target; setSaveState("saved"); clearDraft(album.id); return true; }
    inflight.current = true;
    setSaveState("saving");
    let ok = false;
    try {
      const res = await saveAlbumAction(familySlug, album.id, payload);
      if (res?.error) throw new Error(res.error);
      savedRef.current = target;
      failures.current = 0;
      ok = true;
      if (docRef.current === target) { setSaveState("saved"); clearDraft(album.id); }
      else { setSaveState("dirty"); saveTimer.current = setTimeout(() => latest.current.runSave(), 400); }
    } catch (err) {
      failures.current += 1;
      setSaveState(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
      writeDraft(album.id, docRef.current);
      const delay = Math.min(30000, 2000 * 2 ** Math.min(failures.current, 4));
      saveTimer.current = setTimeout(() => latest.current.runSave(), delay);
      if (failures.current === 1) console.warn("[AlbumEditor] saqlashda xato:", err?.message || err);
    } finally {
      inflight.current = false;
      if (pendingSave.current) { pendingSave.current = false; saveTimer.current = setTimeout(() => latest.current.runSave(), 300); }
    }
    return ok;
  }, [album.id, canEdit, familySlug, saveAlbumAction]);
  const draftTimer = useRef(null);
  // Hujjat har o'zgarganda (setDoc orqali) chaqiriladi: debounce bilan saqlash va mahalliy zaxira.
  const onDocChanged = (d) => {
    if (!canEdit || d === savedRef.current) return;
    setSaveState((st) => (st === "error" || st === "offline" ? st : "dirty"));
    if (!gestureRef.current && !liveBaseRef.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => latest.current.runSave(), 900);
    }
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => { if (docRef.current !== savedRef.current) writeDraft(album.id, docRef.current); }, 800);
  };

  useEffect(() => {
    if (!canEdit) return undefined;
    // Hidratsiyadan keyin o'qiymiz (server render'da localStorage yo'q).
    const draftCheck = setTimeout(() => { const d = readDraft(album.id); if (d) setDraft(d); }, 0);
    // Boshlang'ich holat bazadagidan farq qilsa (masalan, format avtomatik o'zgargan), saqlab qo'yamiz.
    if (docRef.current !== savedRef.current) saveTimer.current = setTimeout(() => latest.current.runSave?.(), 1200);
    const onOnline = () => { if (docRef.current !== savedRef.current) latest.current.runSave(); };
    const onOffline = () => { if (docRef.current !== savedRef.current) setSaveState("offline"); };
    const onBeforeUnload = (e) => {
      if (docRef.current !== savedRef.current || inflight.current) {
        writeDraft(album.id, docRef.current);
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearTimeout(draftCheck);
      clearTimeout(saveTimer.current);
      clearTimeout(draftTimer.current);
    };
  }, [album.id, canEdit]);

  const restoreDraft = () => {
    if (!draft) return;
    const clean = {
      format: draft.doc.format || docRef.current.format,
      pages: draft.doc.pages.map((p) => ({
        ...p,
        bgImage: p.bgImage?.startsWith("blob:") ? null : p.bgImage,
        elements: p.elements.map((e) => (e.src?.startsWith?.("blob:") ? { ...e, src: null } : e)),
      })),
    };
    commit(() => clean);
    setPageIdState(clean.pages[0].id);
    setSel([]);
    setDraft(null);
    showToast(tr("Saqlanmagan o'zgarishlar tiklandi"));
  };
  const dismissDraft = () => { clearDraft(album.id); setDraft(null); };

  const handleBack = async () => {
    if (cropId) exitCrop(true);
    if (editingId) document.activeElement?.blur?.();
    endLive();
    if (canEdit && docRef.current !== savedRef.current) {
      setSaveState("saving");
      let ok = await runSave();
      if (!ok && inflight.current) {
        await new Promise((r) => setTimeout(r, 1200));
        ok = docRef.current === savedRef.current || (await runSave());
      }
      if (!ok && docRef.current !== savedRef.current) {
        writeDraft(album.id, docRef.current);
        if (!window.confirm(tr("Ba'zi o'zgarishlar hali saqlanmadi. Ular shu brauzerda saqlab qo'yildi va keyingi safar tiklash mumkin. Chiqasizmi?"))) return;
      }
    }
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    startTransition(() => router.refresh());
    onBack(docRef.current);
  };

  const savedTitleRef = useRef(album.title);
  const commitTitle = async () => {
    const t = title.trim();
    if (!t) { setTitle(savedTitleRef.current); return; }
    if (t === savedTitleRef.current) return;
    const fd = new FormData();
    fd.set("familySlug", familySlug);
    fd.set("albumId", album.id);
    fd.set("title", t);
    try {
      const res = await renameAlbumAction(undefined, fd);
      if (res?.error) { showToast(res.error); setTitle(savedTitleRef.current); }
      else savedTitleRef.current = t;
    } catch {
      showToast(tr("Nomni saqlab bo'lmadi."));
    }
  };

  const handleDeleteAlbum = () => {
    if (!window.confirm(tr("\"{0}\" albomini butunlay o'chirasizmi? Bu amalni qaytarib bo'lmaydi.", { 0: savedTitleRef.current }))) return;
    clearTimeout(saveTimer.current);
    clearDraft(album.id);
    savedRef.current = docRef.current;
    const fd = new FormData();
    fd.set("familySlug", familySlug);
    fd.set("albumId", album.id);
    startTransition(async () => {
      await deleteAlbumAction(undefined, fd);
    });
  };

  const runExport = async (kind) => {
    if (cropId) exitCrop(true);
    setExporting(kind === "pdf" ? tr("PDF tayyorlanmoqda…") : tr("Rasm tayyorlanmoqda…"));
    try {
      const name = slugify(title);
      if (kind === "pdf") {
        await exportAlbumPdf(docRef.current.pages, { filename: name, onProgress: (i, n) => setExporting(`${tr("PDF tayyorlanmoqda…")} ${i + 1}/${n}`) });
      } else {
        await exportPageImage(page, { format: kind, filename: `${name}-${pageIndex + 1}` });
      }
    } catch (err) {
      console.warn("[AlbumEditor] eksport xatosi:", err);
      showToast(tr("Eksport qilib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."));
    } finally {
      setExporting(null);
    }
  };

  const toggleFullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else rootRef.current?.requestFullscreen?.().catch(() => {});
    } catch { /* ignore */ }
  };
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ========================== Gesture'lar ==========================
  const rafRef = useRef(0);
  const lastMoveRef = useRef(null);
  const touchPts = useRef(new Map());

  const processMove = (e) => {
    const g = gestureRef.current;
    if (!g) return;
    const v = latest.current.view;
    if (g.type === "pan") {
      setPan(clampPan({ x: g.pan0.x + (e.clientX - g.sx), y: g.pan0.y + (e.clientY - g.sy) }, v.s));
      return;
    }
    if (g.type === "pinch") {
      const pts = [...touchPts.current.values()];
      if (pts.length < 2) return;
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const r = stageRef.current.getBoundingClientRect();
      const m = { x: (pts[0].x + pts[1].x) / 2 - r.left, y: (pts[0].y + pts[1].y) / 2 - r.top };
      const ns = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, g.s0 * (d / g.d0)));
      const st = latest.current.stage;
      const nox = m.x - g.px * ns, noy = m.y - g.py * ns;
      setZoom(ns);
      setPan(clampPan({ x: nox - st.w / 2 + (PAGE_W * ns) / 2, y: noy - st.h / 2 + (PAGE_H * ns) / 2 }, ns));
      return;
    }
    const p = toPage(e.clientX, e.clientY);
    const threshold = 7 / v.s;

    if (g.type === "move") {
      if (!g.started) {
        if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 4) return;
        g.started = true;
        setGestureKind("move");
        setHoverId(null);
      }
      let dx = p.x - g.p0.x, dy = p.y - g.p0.y;
      let lockAxis = null;
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) { dy = 0; lockAxis = "y"; } else { dx = 0; lockAxis = "x"; } }
      if (!(e.ctrlKey || e.metaKey)) {
        const b = g.box;
        const sn = snapMove({ minX: b.minX + dx, maxX: b.maxX + dx, minY: b.minY + dy, maxY: b.maxY + dy }, g.others, threshold);
        if (lockAxis !== "x") dx += sn.dx;
        if (lockAxis !== "y") dy += sn.dy;
        setGuides(sn.guides.length || sn.spacing.length ? sn : null);
      } else setGuides(null);
      live((d) => mapPage(d, g.pageId, (pg) => patchEls(pg, g.idSet, (el) => ({ x: g.starts[el.id].x + dx, y: g.starts[el.id].y + dy }))));
      return;
    }

    if (g.type === "resize") {
      if (!g.started) { g.started = true; setGestureKind("resize"); }
      const st = stageRef.current.getBoundingClientRect();
      const bpos = { x: e.clientX - st.left + 14, y: e.clientY - st.top + 14 };
      if (g.single) {
        const el = g.startEl;
        const corner = g.handle.length === 2;
        let patch, r;
        if (el.type === "text") {
          if (corner) {
            r = resizeElement(el, g.handle, p, { keepAspect: true, minSize: 8 });
            patch = { x: r.x, y: r.y, w: r.w, h: r.h, fontSize: Math.max(4, el.fontSize * r.scale) };
            setBadge({ ...bpos, text: `${Math.round(patch.fontSize)} px` });
          } else {
            r = resizeElement(el, g.handle, p, { keepAspect: false, minSize: 30, others: g.others, threshold });
            patch = { x: r.x, y: el.y + (r.y - el.y), w: r.w };
            setBadge({ ...bpos, text: `${Math.round(r.w)} kenglik` });
          }
        } else {
          const keep = corner ? !e.shiftKey : false;
          r = resizeElement(el, g.handle, p, { keepAspect: keep, minSize: 12, others: e.ctrlKey || e.metaKey ? null : g.others, threshold });
          patch = { x: r.x, y: r.y, w: r.w, h: r.h };
          setBadge({ ...bpos, text: `${Math.round(r.w)} × ${Math.round(r.h)}` });
        }
        setGuides(r.guides?.length ? { guides: r.guides, spacing: [] } : null);
        live((d) => mapPage(d, g.pageId, (pg) => patchEls(pg, [el.id], patch)));
      } else {
        const { els, k } = scaleGroup(g.startEls, g.handle, p);
        const map = new Map(els.map((x) => [x.id, x.patch]));
        setBadge({ ...bpos, text: `${Math.round(k * 100)}%` });
        live((d) => mapPage(d, g.pageId, (pg) => patchEls(pg, g.idSet, (el) => map.get(el.id))));
      }
      return;
    }

    if (g.type === "rotate") {
      if (!g.started) { g.started = true; setGestureKind("rotate"); }
      let delta = angleBetween(g.center, p) - g.a0;
      const st = stageRef.current.getBoundingClientRect();
      const bpos = { x: e.clientX - st.left + 16, y: e.clientY - st.top + 16 };
      if (g.single) {
        const r = normalizeAngle(snapAngle(g.startEl.rotation + delta, e.shiftKey));
        setBadge({ ...bpos, text: `${Math.round(r)}°` });
        live((d) => mapPage(d, g.pageId, (pg) => patchEls(pg, [g.startEl.id], { rotation: r })));
      } else {
        if (e.shiftKey) delta = Math.round(delta / 15) * 15;
        setBadge({ ...bpos, text: `${Math.round(normalizeAngle(delta))}°` });
        const map = new Map(g.startEls.map((el) => {
          const c = rotatePoint(el.x + el.w / 2, el.y + el.h / 2, g.center.x, g.center.y, delta);
          return [el.id, { x: c.x - el.w / 2, y: c.y - el.h / 2, rotation: normalizeAngle((el.rotation || 0) + delta) }];
        }));
        live((d) => mapPage(d, g.pageId, (pg) => patchEls(pg, g.idSet, (el) => map.get(el.id))));
      }
      return;
    }

    if (g.type === "marquee") {
      if (!g.started) {
        if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 4) return;
        g.started = true;
      }
      const rect = { x: Math.min(g.p0.x, p.x), y: Math.min(g.p0.y, p.y), w: Math.abs(p.x - g.p0.x), h: Math.abs(p.y - g.p0.y) };
      setMarquee(rect);
      const pg = docRef.current.pages.find((x) => x.id === g.pageId);
      const hits = new Set(g.base);
      for (const el of pg.elements) {
        const b = aabb(el);
        if (b.maxX >= rect.x && b.minX <= rect.x + rect.w && b.maxY >= rect.y && b.minY <= rect.y + rect.h) {
          hits.add(el.id);
          if (el.groupId) pg.elements.forEach((o) => { if (o.groupId === el.groupId) hits.add(o.id); });
        }
      }
      setSel([...hits]);
      return;
    }

    if (g.type === "crop") {
      const el = g.startEl;
      const { iw, ih } = photoInnerBox(el);
      const dxp = p.x - g.p0.x, dyp = p.y - g.p0.y;
      const rad = (-(el.rotation || 0) * Math.PI) / 180;
      const ldx = dxp * Math.cos(rad) - dyp * Math.sin(rad);
      const ldy = dxp * Math.sin(rad) + dyp * Math.cos(rad);
      const box = imageBox(g.crop0, iw, ih, el.aspect, el.imgRot);
      const crop = clampCrop({ s: g.crop0.s, cx: g.crop0.cx - ldx / box.W, cy: g.crop0.cy - ldy / box.H }, iw, ih, el.aspect, el.imgRot);
      live((d) => mapPage(d, g.pageId, (pg) => patchEls(pg, [el.id], { crop })));
      return;
    }

    if (g.type === "cropScale") {
      const el = g.startEl;
      const { iw, ih } = photoInnerBox(el);
      const dist = Math.max(1, Math.hypot(p.x - g.center.x, p.y - g.center.y));
      const crop = clampCrop({ ...g.crop0, s: g.crop0.s * (dist / g.d0) }, iw, ih, el.aspect, el.imgRot);
      live((d) => mapPage(d, g.pageId, (pg) => patchEls(pg, [el.id], { crop })));
    }
  };

  const handleWinMove = (e) => {
    if (e.pointerType === "touch" && touchPts.current.has(e.pointerId)) touchPts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastMoveRef.current = e;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        if (lastMoveRef.current) processMove(lastMoveRef.current);
      });
    }
  };
  const handleWinUp = (e) => {
    if (e.pointerType === "touch") touchPts.current.delete(e.pointerId);
    const g = gestureRef.current;
    if (!g) return;
    if (g.type === "pinch" && touchPts.current.size >= 2) return;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    if (lastMoveRef.current && g.type !== "pinch") processMove(lastMoveRef.current);
    lastMoveRef.current = null;
    gestureRef.current = null;
    window.removeEventListener("pointermove", onWinMove);
    window.removeEventListener("pointerup", onWinUp);
    window.removeEventListener("pointercancel", onWinUp);
    setGuides(null); setBadge(null); setMarquee(null); setGestureKind(null);
    if (g.type === "move" && !g.started && g.clickSelect) setSel(g.clickSelect);
    if (g.type === "move" || g.type === "resize" || g.type === "rotate") endLive();
    if (docRef.current !== savedRef.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => latest.current.runSave(), 900);
    }
  };
  const onWinMove = useCallback((e) => latest.current.move(e), []);
  const onWinUp = useCallback((e) => latest.current.up(e), []);

  const startGesture = (g, e) => {
    gestureRef.current = g;
    lastMoveRef.current = null;
    window.addEventListener("pointermove", onWinMove);
    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);
    if (e) { try { stageRef.current?.setPointerCapture?.(e.pointerId); } catch { /* ignore */ } }
  };

  const startPan = (e) => {
    startGesture({ type: "pan", sx: e.clientX, sy: e.clientY, pan0: zoom === "fit" ? { x: 0, y: 0 } : pan }, e);
    if (zoom === "fit") setZoom(fit);
  };

  const onStagePointerDown = (e) => {
    if (preview) return;
    if (e.pointerType === "touch") {
      touchPts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPts.current.size === 2) {
        if (gestureRef.current) { gestureRef.current = null; endLive(); setGuides(null); setBadge(null); setMarquee(null); setGestureKind(null); }
        const pts = [...touchPts.current.values()];
        const r = stageRef.current.getBoundingClientRect();
        const v = latest.current.view;
        const m = { x: (pts[0].x + pts[1].x) / 2 - r.left, y: (pts[0].y + pts[1].y) / 2 - r.top };
        startGesture({ type: "pinch", d0: Math.max(10, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)), s0: v.s, px: (m.x - v.ox) / v.s, py: (m.y - v.oy) / v.s });
        if (zoom === "fit") setZoom(fit);
        return;
      }
      if (touchPts.current.size > 2) return;
    }
    if (gestureRef.current) return;
    if (document.activeElement && document.activeElement !== document.body && isField(document.activeElement) && !e.target.closest("[data-text-editor]")) {
      document.activeElement.blur();
    }
    if (e.button === 1 || space || (!canEdit && e.pointerType !== "touch")) { e.preventDefault(); startPan(e); return; }
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!canEdit) { if (e.pointerType === "touch" && zoom !== "fit") startPan(e); return; }

    const t = e.target;
    const handleNode = t.closest("[data-handle]");
    if (handleNode) {
      e.preventDefault();
      const h = handleNode.dataset.handle;
      const p = toPage(e.clientX, e.clientY);
      if (h.startsWith("crop-") && cropEl) {
        const { ix, iy, iw, ih } = photoInnerBox(cropEl);
        const crop0 = clampCrop(cropEl.crop || { s: 1, cx: 0.5, cy: 0.5 }, iw, ih, cropEl.aspect, cropEl.imgRot);
        const box = imageBox(crop0, iw, ih, cropEl.aspect, cropEl.imgRot);
        const local = { x: cropEl.x + ix + box.left + box.W / 2, y: cropEl.y + iy + box.top + box.H / 2 };
        const center = rotatePoint(local.x, local.y, cropEl.x + cropEl.w / 2, cropEl.y + cropEl.h / 2, cropEl.rotation || 0);
        startGesture({ type: "cropScale", pageId, startEl: cropEl, crop0, center, d0: Math.max(1, Math.hypot(p.x - center.x, p.y - center.y)) }, e);
        return;
      }
      const movable = selEls.filter((el) => !el.locked);
      if (!movable.length) return;
      const idSet = new Set(movable.map((el) => el.id));
      const others = page.elements.filter((el) => !idSet.has(el.id));
      const single = movable.length === 1 && !groupMode && selEls.length === 1;
      if (h === "rot") {
        const b = single ? null : unionBounds(movable);
        const center = single ? { x: movable[0].x + movable[0].w / 2, y: movable[0].y + movable[0].h / 2 } : { x: b.x + b.w / 2, y: b.y + b.h / 2 };
        startGesture({ type: "rotate", pageId, single, startEl: movable[0], startEls: movable, idSet, center, a0: angleBetween(center, p) }, e);
      } else {
        startGesture({ type: "resize", pageId, handle: h, single, startEl: movable[0], startEls: movable, idSet, others }, e);
      }
      return;
    }

    if (cropId) {
      if (t.closest("[data-crop]")) {
        e.preventDefault();
        const el = cropEl;
        const { iw, ih } = photoInnerBox(el);
        startGesture({ type: "crop", pageId, startEl: el, crop0: clampCrop(el.crop || { s: 1, cx: 0.5, cy: 0.5 }, iw, ih, el.aspect, el.imgRot), p0: toPage(e.clientX, e.clientY) }, e);
        return;
      }
      exitCrop(true);
    }
    if (editingId) {
      if (t.closest("[data-text-editor]")) return;
      document.activeElement?.blur?.();
    }

    const elNode = t.closest("[data-el-id]");
    if (elNode && elNode.closest("[data-page-surface]")) {
      e.preventDefault();
      const id = elNode.dataset.elId;
      const el = page.elements.find((x) => x.id === id);
      if (!el) return;
      const gid = el.groupId && enteredGroup !== el.groupId ? el.groupId : null;
      const target = gid ? page.elements.filter((x) => x.groupId === gid).map((x) => x.id) : [id];
      const additive = e.shiftKey || e.metaKey || e.ctrlKey;
      let nextSel, clickSelect = null;
      if (additive) {
        const allIn = target.every((x) => selSet.has(x));
        nextSel = allIn ? sel.filter((x) => !target.includes(x)) : [...new Set([...sel, ...target])];
      } else if (target.every((x) => selSet.has(x))) {
        nextSel = sel;
        if (sel.length > target.length) clickSelect = target;
      } else {
        nextSel = target;
      }
      if (enteredGroup && el.groupId !== enteredGroup) setEnteredGroup(null);
      setSel(nextSel);
      if (additive && !nextSel.includes(id)) return;
      const movable = page.elements.filter((x) => nextSel.includes(x.id) && !x.locked);
      if (!movable.length) return;
      const idSet = new Set(movable.map((x) => x.id));
      const starts = Object.fromEntries(movable.map((x) => [x.id, { x: x.x, y: x.y }]));
      startGesture({
        type: "move", pageId, sx: e.clientX, sy: e.clientY, p0: toPage(e.clientX, e.clientY),
        idSet, starts, box: unionBounds(movable), others: page.elements.filter((x) => !idSet.has(x.id)), started: false, clickSelect,
      }, e);
      return;
    }

    // Bo'sh joy: tanlovni tozalash va to'rtburchak bilan tanlash
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    if (!additive) { setSel([]); setEnteredGroup(null); }
    startGesture({ type: "marquee", pageId, sx: e.clientX, sy: e.clientY, p0: toPage(e.clientX, e.clientY), base: additive ? sel : [], started: false }, e);
  };

  // Pointer capture tufayli dblclick target'i stage bo'lishi mumkin — elementni koordinata bo'yicha topamiz.
  const elementNodeAt = (e) => {
    const direct = e.target.closest?.("[data-el-id]");
    if (direct && direct.closest("[data-page-surface]")) return direct;
    for (const n of document.elementsFromPoint(e.clientX, e.clientY)) {
      if (n.closest?.(".he-toolbar, .he-drawer, .he-bottombar")) return null;
      const node = n.closest?.("[data-el-id]");
      if (node && node.closest("[data-page-surface]")) return node;
    }
    return null;
  };

  const onStageDoubleClick = (e) => {
    if (!canEdit || preview) return;
    if (e.target.closest?.(".he-toolbar, [data-text-editor]")) return;
    const elNode = elementNodeAt(e);
    if (!elNode) return;
    const el = page.elements.find((x) => x.id === elNode.dataset.elId);
    if (!el || el.locked) return;
    if (el.groupId && enteredGroup !== el.groupId) { setEnteredGroup(el.groupId); setSel([el.id]); return; }
    if (el.type === "text") { setSel([el.id]); setEditingId(el.id); }
    else if ((el.type === "photo" || el.type === "video") && el.src) enterCrop(el.id);
    else if (el.type === "photo") pickFile(el.id);
  };

  const onStageHover = (e) => {
    if (gestureRef.current || !canEdit || e.pointerType === "touch") return;
    const node = e.target.closest?.("[data-el-id]");
    const id = node && node.closest("[data-page-surface]") ? node.dataset.elId : null;
    if (id !== hoverId) setHoverId(id);
  };

  // G'ildirak: Ctrl — zoom, aks holda — surish; crop rejimida rasmni kattalashtirish.
  const handleWheel = (e) => {
    if (preview) return;
    e.preventDefault();
    if (cropId && cropEl) {
      cropUpdate({ s: (cropEl.crop?.s || 1) * Math.exp(-e.deltaY * 0.0015) });
      return;
    }
    const v = latest.current.view;
    if (e.ctrlKey || e.metaKey) {
      zoomTo(v.s * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022)), toStage(e.clientX, e.clientY));
      return;
    }
    const st = latest.current.stage;
    const overflowX = PAGE_W * v.s > st.w - 40, overflowY = PAGE_H * v.s > st.h - 40;
    if (zoom === "fit" || (!overflowX && !overflowY)) return;
    const k = e.deltaMode === 1 ? 20 : 1;
    setPan((p0) => clampPan({ x: p0.x - (overflowX ? (e.shiftKey ? e.deltaY : e.deltaX) * k : 0), y: p0.y - (overflowY && !e.shiftKey ? e.deltaY * k : 0) }, v.s));
  };
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const h = (e) => latest.current.wheel(e);
    node.addEventListener("wheel", h, { passive: false });
    return () => node.removeEventListener("wheel", h);
  }, []);

  // ========================== Drag & drop ==========================
  const findDropPhoto = (clientX, clientY) => {
    const nodes = document.elementsFromPoint(clientX, clientY);
    for (const n of nodes) {
      const id = n.dataset?.elId;
      if (!id) continue;
      const el = page.elements.find((x) => x.id === id);
      if (el && (el.type === "photo" || el.type === "video") && !el.locked) return el;
      return null;
    }
    return null;
  };
  const onDragOver = (e) => {
    if (!canEdit || !isEditorDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const kind = Array.from(e.dataTransfer.types).includes("Files") ? "files" : currentDrag.kind;
    const target = kind === "photo" || kind === "video" || kind === "frame" || kind === "files" ? findDropPhoto(e.clientX, e.clientY) : null;
    const id = target?.id || null;
    if (id !== dropTargetId) setDropTargetId(id);
  };
  const onDragLeave = (e) => {
    if (!stageRef.current?.contains(e.relatedTarget)) setDropTargetId(null);
  };
  const onDrop = (e) => {
    if (!canEdit) return;
    e.preventDefault();
    setDropTargetId(null);
    const p = toPage(e.clientX, e.clientY);
    const target = findDropPhoto(e.clientX, e.clientY);
    const files = [...(e.dataTransfer.files || [])];
    if (files.length) { uploadFiles(files, { at: p, targetId: target?.id }); return; }
    const data = readDrag(e);
    if (!data) return;
    if (data.kind === "photo" || data.kind === "video") {
      const item = { src: data.url, kind: data.kind, aspect: data.aspect };
      if (target) fillPhoto(target.id, item); else appendElements([newMediaElement(item, p)]);
    } else if (data.kind === "frame") {
      if (target) update([target.id], { frame: data.id }); else addFrame(data.id, p);
    } else if (data.kind === "sticker") addSticker(data.id, p);
    else if (data.kind === "text") addText(data.preset, p);
    else if (data.kind === "template") applyTemplate(data.id);
  };

  // ========================== Klaviatura ==========================
  const handleKey = (e) => {
    if (preview || showShortcuts) return;
    const inField = isField(e.target);
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key;
    if (mod && (k === "s" || k === "S")) { e.preventDefault(); if (canEdit) runSave().then((ok) => ok && showToast(tr("Saqlandi"))); return; }
    if (inField) return;
    if (e.code === "Space") { e.preventDefault(); if (!space) setSpace(true); return; }
    if (mod && (k === "=" || k === "+")) { e.preventDefault(); onZoom("in"); return; }
    if (mod && k === "-") { e.preventDefault(); onZoom("out"); return; }
    if (mod && k === "0") { e.preventDefault(); onZoom("fit"); return; }
    if (!canEdit) {
      if (k === "ArrowRight" && pageIndex < doc.pages.length - 1) setPageId(doc.pages[pageIndex + 1].id);
      if (k === "ArrowLeft" && pageIndex > 0) setPageId(doc.pages[pageIndex - 1].id);
      return;
    }
    if (cropId) {
      if (k === "Escape" || k === "Enter") { e.preventDefault(); exitCrop(true); }
      if (mod && (k === "z" || k === "Z")) { e.preventDefault(); exitCrop(false); }
      return;
    }
    if (mod && (k === "z" || k === "Z")) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && (k === "y" || k === "Y")) { e.preventDefault(); redo(); return; }
    if (mod && (k === "a" || k === "A")) { e.preventDefault(); setSel(page.elements.map((x) => x.id)); setEnteredGroup(null); return; }
    if (mod && (k === "c" || k === "C")) { if (selEls.length) { e.preventDefault(); copy(); } return; }
    if (mod && (k === "x" || k === "X")) { if (selEls.length) { e.preventDefault(); cut(); } return; }
    if (mod && (k === "d" || k === "D")) { e.preventDefault(); duplicate(); return; }
    if (mod && (k === "g" || k === "G")) { e.preventDefault(); if (e.shiftKey) ungroup(); else group(); return; }
    if (mod && k === "]") { e.preventDefault(); layer(e.altKey ? "front" : "forward"); return; }
    if (mod && k === "[") { e.preventDefault(); layer(e.altKey ? "back" : "backward"); return; }
    if (k === "Delete" || k === "Backspace") { if (selEls.length) { e.preventDefault(); remove(); } return; }
    if (k === "Escape") {
      e.preventDefault();
      if (enteredGroup) { const gid = enteredGroup; setEnteredGroup(null); setSel(page.elements.filter((x) => x.groupId === gid).map((x) => x.id)); return; }
      if (selEls.length) { setSel([]); return; }
      if (panel) setPanel(null);
      return;
    }
    if (k === "Enter" && selEls.length === 1) {
      const el = selEls[0];
      if (el.type === "text" && !el.locked) { e.preventDefault(); setEditingId(el.id); }
      else if ((el.type === "photo" || el.type === "video") && el.src && !el.locked) { e.preventDefault(); enterCrop(el.id); }
      return;
    }
    if (k.startsWith("Arrow")) {
      if (!selEls.length) {
        if (k === "ArrowRight" && pageIndex < doc.pages.length - 1) setPageId(doc.pages[pageIndex + 1].id);
        if (k === "ArrowLeft" && pageIndex > 0) setPageId(doc.pages[pageIndex - 1].id);
        return;
      }
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      nudge(k === "ArrowLeft" ? -step : k === "ArrowRight" ? step : 0, k === "ArrowUp" ? -step : k === "ArrowDown" ? step : 0);
    }
  };
  const handlePaste = (e) => {
    if (!canEdit || preview || isField(e.target)) return;
    const files = [...(e.clipboardData?.files || [])].filter((f) => mediaKind(f));
    if (files.length) { e.preventDefault(); uploadFiles(files); return; }
    if (clipboardRef.current) { e.preventDefault(); paste(); }
  };
  useEffect(() => {
    const down = (e) => latest.current.key(e);
    const up = (e) => { if (e.code === "Space") setSpace(false); };
    const blur = () => setSpace(false);
    const onPaste = (e) => latest.current.paste(e);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("pointermove", onWinMove);
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinUp);
    };
  }, [onWinMove, onWinUp]);

  // Event handler'lar uchun eng so'nggi qiymatlar (render paytida ref o'qilmasligi uchun shu yerda yangilanadi).
  useLayoutEffect(() => {
    latest.current = {
      ...latest.current,
      view, stage, pageId, runSave, onDocChanged, textCommit,
      move: handleWinMove, up: handleWinUp, wheel: handleWheel, key: handleKey, paste: handlePaste,
    };
  });

  // ========================== API (panellar va toolbar uchun) ==========================
  const api = {
    update, endLive, duplicate, remove, toggleLock, group, ungroup, layer, moveLayer, align, distribute, copy, cut, paste,
    selectIds: (ids, additive) => setSel((s0) => (additive ? [...new Set([...s0, ...selectableIds(ids)])] : selectableIds(ids))),
    enterCrop, exitCrop, cropUpdate,
    openReplace: (id) => { setReplaceTarget(id); setPanel("photos"); },
    clearReplace: () => setReplaceTarget(null),
    pickFile,
    insertMedia, addSticker, addText, addFrame, applyTemplate, addPage, duplicatePage, deletePage, movePage,
    setBackground, applyBackgroundToAll, uploadFiles, uploadBackground,
    setFormat: (id) => {
      if (!PAGE_FORMATS.some((f) => f.id === id) || id === (docRef.current.format || LEGACY_FORMAT)) return;
      if (cropId) exitCrop(true);
      setEditingId(null);
      commit((d) => convertDocFormat({ ...d, format: d.format || LEGACY_FORMAT }, id));
      setZoom("fit"); setPan({ x: 0, y: 0 });
      showToast(tr("Sahifa formati: {0}", { 0: id }), { label: "Bekor qilish", run: () => undo() });
    },
  };

  // ========================== Render ==========================
  const canUndo = hist.undo;
  const canRedo = hist.redo;
  const hoverEl = hoverId && !gestureKind ? page.elements.find((e) => e.id === hoverId) : null;
  const hideSelection = !!cropId || preview;
  const zoomPct = Math.round(s * 100);

  const saveLabel = {
    saved: <><Check size={14} /> {tr("Saqlandi")}</>,
    dirty: <><Loader2 size={14} className="he-spin" /> {tr("Saqlanmoqda…")}</>,
    saving: <><Loader2 size={14} className="he-spin" /> {tr("Saqlanmoqda…")}</>,
    error: <><AlertTriangle size={14} /> {tr("Saqlab bo'lmadi")}</>,
    offline: <><CloudOff size={14} /> {tr("Internet yo'q — keyin saqlanadi")}</>,
  }[saveState];

  return (
    <div className="he-root" ref={rootRef}>
      <style>{EDITOR_CSS}</style>
      <link rel="stylesheet" href={EDITOR_FONT_IMPORT} precedence="default" />

      {/* ───────────── Yuqori panel ───────────── */}
      <header className="he-topbar">
        <button type="button" className="he-btn" onClick={handleBack} title={tr("Albomlarga qaytish")}>
          <ArrowLeft size={17} /> <span className="he-hide-sm">{tr("Albomlar")}</span>
        </button>
        <div className="he-divider he-hide-sm" />
        <input
          className="he-title-input"
          value={title}
          readOnly={!canEdit}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setTitle(savedTitleRef.current); e.currentTarget.blur(); } }}
          aria-label={tr("Albom nomi")}
          maxLength={200}
        />
        {canEdit && (
          <>
            <button type="button" className="he-btn icon" title={tr("Bekor qilish (Ctrl+Z)")} onClick={undo} disabled={!canUndo}><Undo2 size={17} /></button>
            <button type="button" className="he-btn icon" title={tr("Qaytarish (Ctrl+Shift+Z)")} onClick={redo} disabled={!canRedo}><Redo2 size={17} /></button>
            <span className={`he-save${saveState === "error" || saveState === "offline" ? " error" : ""}`} role="status">
              {saveLabel}
              {saveState === "error" && <button type="button" className="he-btn" style={{ height: 26, padding: "0 8px", fontSize: 12 }} onClick={() => runSave()}>{tr("Qayta urinish")}</button>}
            </span>
          </>
        )}
        <div style={{ flex: 1 }} />
        {exporting && <span className="he-save he-hide-sm"><Loader2 size={14} className="he-spin" /> {exporting}</span>}
        {canEdit && shareAlbumAction && <SharePopover album={album} familySlug={familySlug} shareAlbumAction={shareAlbumAction} />}
        <button type="button" className="he-btn" onClick={() => { if (cropId) exitCrop(true); setPreview({ index: pageIndex }); }} title={tr("Ko'rish rejimi")}>
          <Eye size={16} /> <span className="he-hide-sm">{tr("Ko'rish")}</span>
        </button>
        <PopButton className="he-btn" icon={<Download size={16} />} label={<span className="he-hide-sm">{tr("Yuklab olish")}</span>} title={tr("Eksport")} width={240} align="end" disabled={!!exporting}>
          {(close) => (
            <>
              <button type="button" className="he-menu-item" onClick={() => { close(); runExport("pdf"); }}><FileText size={15} /> {tr("Butun albom — PDF")}</button>
              <button type="button" className="he-menu-item" onClick={() => { close(); runExport("png"); }}><FileImage size={15} /> {tr("Joriy sahifa — PNG")}</button>
              <button type="button" className="he-menu-item" onClick={() => { close(); runExport("jpg"); }}><FileImage size={15} /> {tr("Joriy sahifa — JPG")}</button>
            </>
          )}
        </PopButton>
        <button type="button" className="he-btn icon he-hide-sm" onClick={toggleFullscreen} title={isFullscreen ? tr("To'liq ekrandan chiqish") : tr("To'liq ekran")}>
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <PopButton className="he-btn icon" icon={<Ellipsis size={17} />} title={tr("Ko'proq")} width={240} align="end">
          {(close) => (
            <>
              <button type="button" className="he-menu-item" onClick={() => { close(); setShowShortcuts(true); }}><Keyboard size={15} /> {tr("Klaviatura yorliqlari")}</button>
              <button type="button" className="he-menu-item" onClick={() => { close(); toggleFullscreen(); }}>{isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {tr("To'liq ekran")}</button>
              {canEdit && deleteAlbumAction && (
                <>
                  <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
                  <button type="button" className="he-menu-item danger" onClick={() => { close(); handleDeleteAlbum(); }}><Trash2 size={15} /> {tr("Albomni o'chirish")}</button>
                </>
              )}
            </>
          )}
        </PopButton>
      </header>

      {/* ───────────── Asosiy maydon ───────────── */}
      <div className="he-main">
        {canEdit && <Rail panel={panel} setPanel={(p) => { setPanel(p); if (p !== "photos" && p !== "upload" && p !== "videos") setReplaceTarget(null); }} />}
        {canEdit && <Drawer panel={panel} setPanel={setPanel} api={api} library={library} folders={folders} uploads={uploads} page={page} replaceTarget={replaceTarget} isPremium={isPremium} />}

        <div
          ref={stageRef}
          className={`he-stage${space ? " space" : ""}${gestureKind === "pan" ? " panning" : ""}`}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStageHover}
          onPointerLeave={() => setHoverId(null)}
          onDoubleClick={onStageDoubleClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onContextMenu={(e) => { if (e.target.closest("[data-page-surface]")) e.preventDefault(); }}
        >
          <div className="he-page-shadow" style={{ left: ox, top: oy, width: PAGE_W * s, height: PAGE_H * s }} />
          <div style={{ position: "absolute", left: ox, top: oy, width: PAGE_W, height: PAGE_H, transform: `scale(${s})`, transformOrigin: "0 0" }}>
            <PageView
              page={page}
              mode={canEdit ? "edit" : "static"}
              editingId={editingId}
              dropTargetId={dropTargetId}
              onTextCommit={handleTextCommit}
              onMeasure={canEdit ? handleMeasure : undefined}
              onAspect={canEdit ? handleAspect : undefined}
            />
          </div>

          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {canEdit && !hideSelection && (
              <SelectionOverlay els={selEls} view={view} hoverEl={hoverEl} hideHandles={!!editingId || gestureKind === "move"} groupMode={groupMode} />
            )}
            {cropEl && <CropOverlay el={cropEl} view={view} />}
            <GuidesOverlay guides={guides?.guides} spacing={guides?.spacing} view={view} />
            <MarqueeOverlay rect={marquee} view={view} />
            {badge && <div className="he-badge" style={{ left: badge.x, top: badge.y }}>{badge.text}</div>}
          </div>

          {canEdit && (
            <div onMouseDown={(e) => { if (!e.target.closest("input")) e.preventDefault(); }}>
              <ContextToolbar
                api={api}
                els={selEls}
                page={page}
                view={view}
                stage={stage}
                cropEl={cropEl}
                hidden={!!gestureKind || preview}
              />
            </div>
          )}

          {draft && (
            <div className="he-banner" onPointerDown={(e) => e.stopPropagation()}>
              <AlertTriangle size={16} color={C.gold} />
              <span>{tr("Oldingi safar saqlanmay qolgan o'zgarishlar topildi (")}{new Date(draft.t).toLocaleString(localeCode())}).</span>
              <button type="button" className="he-btn gold" style={{ height: 30 }} onClick={restoreDraft}>{tr("Tiklash")}</button>
              <button type="button" className="he-btn" style={{ height: 30 }} onClick={dismissDraft}>{tr("Kerak emas")}</button>
            </div>
          )}
          {!canEdit && (
            <div className="he-banner" style={{ borderColor: C.line }}>
              <Eye size={15} /> {tr("Siz bu albomni faqat ko'ra olasiz")}
            </div>
          )}
          {toast && (
            <div className="he-toast" key={toast.id} onPointerDown={(e) => e.stopPropagation()}>
              <span>{toast.text}</span>
              {toast.action && <button type="button" onClick={() => { toast.action.run(); setToast(null); }}>{tr(toast.action.label)}</button>}
            </div>
          )}
        </div>
      </div>

      <PagesBar
        pages={doc.pages}
        pageId={page.id}
        setPageId={setPageId}
        api={api}
        canEdit={canEdit}
        zoomPct={zoomPct}
        onZoom={onZoom}
        compact={compact || stage.h < 420}
        format={doc.format || LEGACY_FORMAT}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={isPremium ? "image/*,.heic,.heif,video/mp4,video/webm,video/quicktime" : "image/*,.heic,.heif"}
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          const files = [...(e.target.files || [])];
          e.target.value = "";
          if (files.length) uploadFiles(files, { targetId: fileTargetRef.current });
          fileTargetRef.current = null;
        }}
      />

      {preview && <Preview pages={doc.pages} startIndex={preview.index} title={title} onClose={() => setPreview(null)} />}

      {showShortcuts && (
        <div style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(20,25,21,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowShortcuts(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 16, padding: "20px 22px", width: "min(520px, 100%)", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 70px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>{tr("Klaviatura yorliqlari")}</div>
              <button type="button" className="he-btn icon" onClick={() => setShowShortcuts(false)}><X size={18} /></button>
            </div>
            {SHORTCUTS.map(([a, b]) => (
              <div key={a} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
                <span>{tr(a)}</span><span style={{ color: C.muted, fontWeight: 600, textAlign: "right" }}>{tr(b)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
