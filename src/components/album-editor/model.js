// ============================================================
// Album Editor — ma'lumotlar modeli
// Bazadagi qatorlar (foizlarda) <-> editor modeli (mantiqiy birliklarda)
// ============================================================
import { PAGE_W, PAGE_H, FRAME_IDS, DEFAULT_FILTER, isDefaultFilter } from "./constants";
import { stickerDef } from "./stickers";

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseJson(raw) {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

/** Eski versiyadagi HTML matnni oddiy matnga aylantiradi (XSS xavfini ham yo'qotadi). */
export function htmlToPlainText(html) {
  if (!html) return "";
  if (!/[<&]/.test(html)) return html;
  const withBreaks = String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = withBreaks;
    return (el.textContent || "").replace(/\n{3,}/g, "\n\n").replace(/\n+$/, "");
  }
  return withBreaks.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

export function elementFromRow(row) {
  const x = ((row.position_x ?? 10) / 100) * PAGE_W;
  const y = ((row.position_y ?? 10) / 100) * PAGE_H;
  const w = ((row.position_w ?? 30) / 100) * PAGE_W;
  const h = ((row.position_h ?? 30) / 100) * PAGE_H;
  const extra = parseJson(row.extra) || {};
  const base = {
    id: row.id,
    type: row.type === "video" || row.type === "text" || row.type === "sticker" ? row.type : "photo",
    x, y, w, h,
    rotation: Number(row.rotation) || 0,
    groupId: row.group_id || null,
    locked: !!extra.locked,
    opacity: typeof extra.opacity === "number" ? extra.opacity : 1,
    caption: row.caption || null,
    location: row.location || null,
    createdAt: row.created_at || null,
  };
  if (base.type === "photo" || base.type === "video") {
    const filter = parseJson(row.photo_filter);
    return {
      ...base,
      src: row.photo_url || null,
      frame: FRAME_IDS.has(row.frame_style) ? row.frame_style : row.frame_style ? "polaroid" : "none",
      crop: { s: extra.crop?.s ?? row.crop_scale ?? 1, cx: extra.crop?.cx ?? 0.5, cy: extra.crop?.cy ?? 0.5 },
      imgRot: extra.imgRot || 0,
      flipH: !!row.flip_h,
      flipV: !!row.flip_v,
      filter: filter ? { ...DEFAULT_FILTER, ...filter } : null,
      aspect: extra.aspect || null,
      muted: extra.muted !== false,
    };
  }
  if (base.type === "text") {
    return {
      ...base,
      text: htmlToPlainText(row.text_content || ""),
      font: row.text_font || "handwriting",
      fontSize: extra.fontSize ?? Math.round((row.text_size || 22) * 1.35),
      color: row.text_color || "#2E362F",
      align: row.text_align || "left",
      bold: !!extra.bold,
      italic: !!extra.italic,
      underline: !!extra.underline,
      uppercase: !!extra.uppercase,
      letterSpacing: extra.letterSpacing ?? 0,
      lineHeight: extra.lineHeight ?? 1.3,
      autoHeight: extra.autoHeight !== false,
    };
  }
  const def = stickerDef(row.sticker_id);
  return {
    ...base,
    stickerId: row.sticker_id || def.id,
    color: row.sticker_color || def.color,
    flipH: !!row.flip_h,
    flipV: !!row.flip_v,
  };
}

export function elementToRow(el) {
  const row = {
    id: el.id,
    type: el.type,
    position_x: round((el.x / PAGE_W) * 100),
    position_y: round((el.y / PAGE_H) * 100),
    position_w: round((el.w / PAGE_W) * 100),
    position_h: round((el.h / PAGE_H) * 100),
    rotation: round(el.rotation || 0, 2),
    group_id: el.groupId || null,
    caption: el.caption || null,
    location: el.location || null,
    created_at: el.createdAt || null,
  };
  const extra = {};
  if (el.locked) extra.locked = true;
  if (typeof el.opacity === "number" && el.opacity < 1) extra.opacity = round(el.opacity, 2);

  if (el.type === "photo" || el.type === "video") {
    row.photo_url = el.src || null;
    row.frame_style = el.frame || "none";
    row.crop_scale = round(el.crop?.s ?? 1, 3);
    row.flip_h = !!el.flipH;
    row.flip_v = !!el.flipV;
    row.photo_filter = el.filter && !isDefaultFilter(el.filter) ? JSON.stringify(el.filter) : null;
    extra.crop = { s: round(el.crop?.s ?? 1, 3), cx: round(el.crop?.cx ?? 0.5, 4), cy: round(el.crop?.cy ?? 0.5, 4) };
    if (el.imgRot) extra.imgRot = el.imgRot;
    if (el.aspect) extra.aspect = round(el.aspect, 4);
    if (el.type === "video" && el.muted === false) extra.muted = false;
  } else if (el.type === "text") {
    row.text_content = el.text || "";
    row.text_font = el.font || "handwriting";
    row.text_size = Math.round(el.fontSize || 28);
    row.text_color = el.color || "#2E362F";
    row.text_align = el.align || "left";
    extra.fontSize = round(el.fontSize || 28, 2);
    if (el.bold) extra.bold = true;
    if (el.italic) extra.italic = true;
    if (el.underline) extra.underline = true;
    if (el.uppercase) extra.uppercase = true;
    if (el.letterSpacing) extra.letterSpacing = round(el.letterSpacing, 2);
    if (el.lineHeight && el.lineHeight !== 1.3) extra.lineHeight = round(el.lineHeight, 2);
    if (el.autoHeight === false) extra.autoHeight = false;
  } else {
    row.sticker_id = el.stickerId;
    row.sticker_color = el.color || null;
    row.flip_h = !!el.flipH;
    row.flip_v = !!el.flipV;
  }
  row.extra = Object.keys(extra).length ? JSON.stringify(extra) : null;
  return row;
}

export function pageFromRow(page) {
  const elements = [...(page.elements || [])]
    .sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0) || (a.slot_index ?? 0) - (b.slot_index ?? 0))
    .map(elementFromRow);
  return {
    id: page.id,
    background: page.background_id || "paper",
    bgImage: page.background_image_url || null,
    dateLabel: page.date_label || null,
    location: page.location || null,
    elements,
  };
}

export function pageToRow(page) {
  return {
    id: page.id,
    background_id: page.background || "paper",
    background_image_url: page.bgImage || null,
    date_label: page.dateLabel || null,
    location: page.location || null,
    elements: page.elements.map(elementToRow),
  };
}

export function albumToDoc(album) {
  const pages = (album.pages || []).map(pageFromRow);
  return { pages: pages.length ? pages : [blankPage()] };
}

export function blankPage(background = "paper") {
  return { id: uid(), background, bgImage: null, dateLabel: null, location: null, elements: [] };
}

/** Sahifadagi birinchi rasm — albom muqovasi uchun. */
export function coverFromDoc(doc) {
  for (const p of doc.pages) {
    for (const el of p.elements) if (el.type === "photo" && el.src) return el.src;
  }
  return null;
}

/** Elementni yangi ID bilan nusxalaydi (guruh ID'lari xaritaga ko'ra yangilanadi). */
export function cloneElements(elements, offset = 0, groupMap = new Map()) {
  return elements.map((el) => {
    let groupId = null;
    if (el.groupId) {
      if (!groupMap.has(el.groupId)) groupMap.set(el.groupId, uid());
      groupId = groupMap.get(el.groupId);
    }
    return {
      ...el,
      id: uid(),
      groupId,
      x: el.x + offset,
      y: el.y + offset,
      crop: el.crop ? { ...el.crop } : el.crop,
      filter: el.filter ? { ...el.filter } : el.filter,
      createdAt: new Date().toISOString(),
    };
  });
}

export function clonePage(page) {
  return { ...page, id: uid(), elements: cloneElements(page.elements) };
}

// ------------------------------------------------------------
// Geometriya
// ------------------------------------------------------------
export function rotatePoint(px, py, cx, cy, deg) {
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const dx = px - cx, dy = py - cy;
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
}

export function corners(el) {
  const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
  return [
    rotatePoint(el.x, el.y, cx, cy, el.rotation || 0),
    rotatePoint(el.x + el.w, el.y, cx, cy, el.rotation || 0),
    rotatePoint(el.x + el.w, el.y + el.h, cx, cy, el.rotation || 0),
    rotatePoint(el.x, el.y + el.h, cx, cy, el.rotation || 0),
  ];
}

export function aabb(el) {
  if (!el.rotation) return { minX: el.x, minY: el.y, maxX: el.x + el.w, maxY: el.y + el.h };
  const pts = corners(el);
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
}

export function unionBounds(elements) {
  if (!elements.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    const b = aabb(el);
    minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
  }
  return { minX, minY, maxX, maxY, x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function elementLabel(el) {
  if (el.type === "photo") return el.src ? "Rasm" : "Rasm joyi";
  if (el.type === "video") return "Video";
  if (el.type === "text") return (el.text || "Matn").split("\n")[0].slice(0, 28) || "Matn";
  return stickerDef(el.stickerId).name;
}
