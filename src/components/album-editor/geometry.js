// ============================================================
// Transformatsiyalar: move / resize / rotate va smart guides
// Barcha qiymatlar sahifaning mantiqiy birliklarida.
// ============================================================
import { PAGE_W, PAGE_H } from "./constants";
import { aabb, rotatePoint, unionBounds } from "./model";

export const HANDLE_CURSORS = {
  nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize",
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
};

/** Aylantirilgan element uchun to'g'ri yo'nalishdagi kursor. */
export function cursorForHandle(handle, rotation = 0) {
  const order = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
  const idx = order.indexOf(handle);
  if (idx < 0) return "default";
  const steps = Math.round((((rotation % 360) + 360) % 360) / 45);
  const h = order[(idx + steps) % 8];
  return HANDLE_CURSORS[h];
}

// ------------------------------------------------------------
// Smart guides
// ------------------------------------------------------------
function lineSets(others) {
  const xs = [
    { v: 0, kind: "page" }, { v: PAGE_W / 2, kind: "page-center" }, { v: PAGE_W, kind: "page" },
  ];
  const ys = [
    { v: 0, kind: "page" }, { v: PAGE_H / 2, kind: "page-center" }, { v: PAGE_H, kind: "page" },
  ];
  for (const el of others) {
    const b = aabb(el);
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    xs.push({ v: b.minX, b }, { v: cx, b }, { v: b.maxX, b });
    ys.push({ v: b.minY, b }, { v: cy, b }, { v: b.maxY, b });
  }
  return { xs, ys };
}

function bestSnap(values, lines, threshold) {
  let best = null;
  for (const val of values) {
    for (const line of lines) {
      const d = line.v - val;
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, v: line.v };
    }
  }
  return best;
}

/**
 * Harakatlanayotgan quti (aabb) uchun eng yaqin tekislash chiziqlarini topadi.
 * Qaytaradi: { dx, dy, guides: [{axis:'x'|'y', v, from, to}], spacing: [...] }
 */
export function snapMove(box, others, threshold) {
  const { xs, ys } = lineSets(others);
  const cx = (box.minX + box.maxX) / 2, cy = (box.minY + box.maxY) / 2;
  let sx = bestSnap([box.minX, cx, box.maxX], xs, threshold);
  let sy = bestSnap([box.minY, cy, box.maxY], ys, threshold);

  // Teng oraliq: quti ikki qo'shni orasida bo'lsa, oraliqlarni tenglashtiramiz.
  const spacing = [];
  const eq = equalSpacing(box, others, threshold);
  if (eq.x && (!sx || Math.abs(eq.x.d) < Math.abs(sx.d))) { sx = { d: eq.x.d, v: null }; spacing.push(...eq.x.marks); }
  if (eq.y && (!sy || Math.abs(eq.y.d) < Math.abs(sy.d))) { sy = { d: eq.y.d, v: null }; spacing.push(...eq.y.marks); }

  const dx = sx ? sx.d : 0;
  const dy = sy ? sy.d : 0;
  const moved = { minX: box.minX + dx, maxX: box.maxX + dx, minY: box.minY + dy, maxY: box.maxY + dy };
  return { dx, dy, guides: collectGuides(moved, xs, ys), spacing };
}

/** Joriy holatda aynan mos tushgan barcha chiziqlarni yig'adi (chizish uchun). */
function collectGuides(box, xs, ys) {
  const eps = 0.5;
  const guides = [];
  const cx = (box.minX + box.maxX) / 2, cy = (box.minY + box.maxY) / 2;
  const seenX = new Set(), seenY = new Set();
  for (const line of xs) {
    if ([box.minX, cx, box.maxX].some((v) => Math.abs(v - line.v) < eps)) {
      const key = Math.round(line.v * 2);
      const from = Math.min(box.minY, line.b ? line.b.minY : 0);
      const to = Math.max(box.maxY, line.b ? line.b.maxY : PAGE_H);
      if (!seenX.has(key)) { seenX.add(key); guides.push({ axis: "x", v: line.v, from: line.b ? from : 0, to: line.b ? to : PAGE_H, center: line.kind === "page-center" }); }
      else {
        const g = guides.find((gg) => gg.axis === "x" && Math.round(gg.v * 2) === key);
        if (g) { g.from = Math.min(g.from, from); g.to = Math.max(g.to, to); }
      }
    }
  }
  for (const line of ys) {
    if ([box.minY, cy, box.maxY].some((v) => Math.abs(v - line.v) < eps)) {
      const key = Math.round(line.v * 2);
      const from = Math.min(box.minX, line.b ? line.b.minX : 0);
      const to = Math.max(box.maxX, line.b ? line.b.maxX : PAGE_W);
      if (!seenY.has(key)) { seenY.add(key); guides.push({ axis: "y", v: line.v, from: line.b ? from : 0, to: line.b ? to : PAGE_W, center: line.kind === "page-center" }); }
      else {
        const g = guides.find((gg) => gg.axis === "y" && Math.round(gg.v * 2) === key);
        if (g) { g.from = Math.min(g.from, from); g.to = Math.max(g.to, to); }
      }
    }
  }
  return guides;
}

function equalSpacing(box, others, threshold) {
  const res = { x: null, y: null };
  const boxes = others.map(aabb);
  // Gorizontal: vertikal bo'yicha kesishadigan chap va o'ng qo'shnilar.
  const rowMates = boxes.filter((b) => b.maxY > box.minY && b.minY < box.maxY);
  const left = rowMates.filter((b) => b.maxX <= box.minX + threshold).sort((a, b) => b.maxX - a.maxX)[0];
  const right = rowMates.filter((b) => b.minX >= box.maxX - threshold).sort((a, b) => a.minX - b.minX)[0];
  if (left && right) {
    const gl = box.minX - left.maxX, gr = right.minX - box.maxX;
    const d = (gr - gl) / 2;
    if (Math.abs(d) <= threshold && gl + d > 2) {
      const g = gl + d;
      const y = (Math.max(box.minY, left.minY, right.minY) + Math.min(box.maxY, left.maxY, right.maxY)) / 2;
      res.x = { d, marks: [{ axis: "x", from: left.maxX, to: left.maxX + g, at: y }, { axis: "x", from: right.minX - g, to: right.minX, at: y }] };
    }
  }
  const colMates = boxes.filter((b) => b.maxX > box.minX && b.minX < box.maxX);
  const top = colMates.filter((b) => b.maxY <= box.minY + threshold).sort((a, b) => b.maxY - a.maxY)[0];
  const bottom = colMates.filter((b) => b.minY >= box.maxY - threshold).sort((a, b) => a.minY - b.minY)[0];
  if (top && bottom) {
    const gt = box.minY - top.maxY, gb = bottom.minY - box.maxY;
    const d = (gb - gt) / 2;
    if (Math.abs(d) <= threshold && gt + d > 2) {
      const g = gt + d;
      const x = (Math.max(box.minX, top.minX, bottom.minX) + Math.min(box.maxX, top.maxX, bottom.maxX)) / 2;
      res.y = { d, marks: [{ axis: "y", from: top.maxY, to: top.maxY + g, at: x }, { axis: "y", from: bottom.minY - g, to: bottom.minY, at: x }] };
    }
  }
  return res;
}

/** Resize paytida faqat harakatlanayotgan qirralarni tekislaydi (aylantirilmagan elementlar uchun). */
export function snapEdges(edges, others, threshold) {
  const { xs, ys } = lineSets(others);
  const out = { ...edges, guides: [] };
  for (const key of ["left", "right"]) {
    if (edges[key] == null) continue;
    const s = bestSnap([edges[key]], xs, threshold);
    if (s) { out[key] = edges[key] + s.d; out.guides.push({ axis: "x", v: s.v, from: 0, to: PAGE_H }); }
  }
  for (const key of ["top", "bottom"]) {
    if (edges[key] == null) continue;
    const s = bestSnap([edges[key]], ys, threshold);
    if (s) { out[key] = edges[key] + s.d; out.guides.push({ axis: "y", v: s.v, from: 0, to: PAGE_W }); }
  }
  return out;
}

// ------------------------------------------------------------
// Resize
// ------------------------------------------------------------
/**
 * Bitta (ehtimol aylantirilgan) elementni o'lchamini o'zgartiradi.
 * Qarama-qarshi burchak/tomon joyida qoladi.
 */
export function resizeElement(start, handle, p, { keepAspect, minSize = 12, others = null, threshold = 0 }) {
  const rot = start.rotation || 0;
  const cx0 = start.x + start.w / 2, cy0 = start.y + start.h / 2;
  const lp = rotatePoint(p.x, p.y, cx0, cy0, -rot); // lokal koordinatalar
  let L = start.x, T = start.y, R = start.x + start.w, B = start.y + start.h;
  const hasW = handle.includes("w"), hasE = handle.includes("e"), hasN = handle.includes("n"), hasS = handle.includes("s");
  const corner = (hasW || hasE) && (hasN || hasS);
  let guides = [];

  if (corner && keepAspect) {
    const ax = hasW ? R : L, ay = hasN ? B : T;
    const dw = (hasW ? ax - lp.x : lp.x - ax), dh = (hasN ? ay - lp.y : lp.y - ay);
    let k = (dw * start.w + dh * start.h) / (start.w * start.w + start.h * start.h);
    k = Math.max(k, minSize / Math.min(start.w, start.h));
    const nw = start.w * k, nh = start.h * k;
    if (hasW) L = ax - nw; else R = ax + nw;
    if (hasN) T = ay - nh; else B = ay + nh;
    if (others && !rot) {
      const sn = snapEdges({ left: hasW ? L : null, right: hasE ? R : null }, others, threshold);
      const snappedW = hasW ? R - sn.left : sn.right - L;
      if (Math.abs(snappedW - nw) > 0.01 && snappedW > minSize) {
        const k2 = snappedW / start.w;
        const nh2 = start.h * k2;
        if (hasW) L = ax - snappedW; else R = ax + snappedW;
        if (hasN) T = ay - nh2; else B = ay + nh2;
        guides = sn.guides;
      }
    }
    return { ...fromLocalBox(start, L, T, R, B), scale: (R - L) / start.w, guides };
  }

  if (hasW) L = Math.min(lp.x, R - minSize);
  if (hasE) R = Math.max(lp.x, L + minSize);
  if (hasN) T = Math.min(lp.y, B - minSize);
  if (hasS) B = Math.max(lp.y, T + minSize);

  if (others && !rot) {
    const sn = snapEdges({ left: hasW ? L : null, right: hasE ? R : null, top: hasN ? T : null, bottom: hasS ? B : null }, others, threshold);
    if (hasW && sn.left < R - minSize) L = sn.left;
    if (hasE && sn.right > L + minSize) R = sn.right;
    if (hasN && sn.top < B - minSize) T = sn.top;
    if (hasS && sn.bottom > T + minSize) B = sn.bottom;
    guides = sn.guides;
  }
  return { ...fromLocalBox(start, L, T, R, B), scale: 1, guides };
}

function fromLocalBox(start, L, T, R, B) {
  const rot = start.rotation || 0;
  const cx0 = start.x + start.w / 2, cy0 = start.y + start.h / 2;
  const w = R - L, h = B - T;
  const c = rotatePoint((L + R) / 2, (T + B) / 2, cx0, cy0, rot);
  return { x: c.x - w / 2, y: c.y - h / 2, w, h };
}

/** Bir nechta elementni umumiy qutining qarama-qarshi burchagiga nisbatan proporsional masshtablaydi. */
export function scaleGroup(startEls, handle, p, minSize = 12) {
  const box = unionBounds(startEls);
  const hasW = handle.includes("w"), hasN = handle.includes("n");
  const ax = hasW ? box.maxX : box.minX, ay = hasN ? box.maxY : box.minY;
  const dw = hasW ? ax - p.x : p.x - ax, dh = hasN ? ay - p.y : p.y - ay;
  let k = (dw * box.w + dh * box.h) / (box.w * box.w + box.h * box.h);
  const minK = Math.max(...startEls.map((el) => minSize / Math.min(el.w, el.h)));
  k = Math.max(k, minK, 0.05);
  return {
    k,
    els: startEls.map((el) => {
      const ecx = el.x + el.w / 2, ecy = el.y + el.h / 2;
      const ncx = ax + (ecx - ax) * k, ncy = ay + (ecy - ay) * k;
      const w = el.w * k, h = el.h * k;
      const patch = { x: ncx - w / 2, y: ncy - h / 2, w, h };
      if (el.type === "text") patch.fontSize = el.fontSize * k;
      return { id: el.id, patch };
    }),
  };
}

// ------------------------------------------------------------
// Rotate
// ------------------------------------------------------------
export function angleBetween(c, p) {
  return (Math.atan2(p.y - c.y, p.x - c.x) * 180) / Math.PI;
}

export function normalizeAngle(a) {
  let r = a % 360;
  if (r > 180) r -= 360;
  if (r <= -180) r += 360;
  return Math.round(r * 100) / 100;
}

/** Shift: 15° qadam. Aks holda 0/45/90... ga yaqin bo'lsa yengil "magnit". */
export function snapAngle(a, shift) {
  if (shift) return Math.round(a / 15) * 15;
  const near = Math.round(a / 45) * 45;
  return Math.abs(a - near) < 2.5 ? near : a;
}
