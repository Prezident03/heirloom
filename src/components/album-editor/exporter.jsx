"use client";

import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { PAGE_W, PAGE_H, EDITOR_FONT_IMPORT, FONT_BY_ID } from "./constants";
import { PageView } from "./ElementView";

// ============================================================
// Eksport: PNG / JPG (bitta sahifa) va PDF (butun albom)
// Sahifa editordagi bilan AYNAN bir xil komponent (PageView) orqali,
// ekrandan tashqarida mantiqiy o'lchamda chiziladi va rasterlanadi.
// ============================================================

const PLACEHOLDER_PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

function waitForImages(node, timeout = 15000) {
  const imgs = [...node.querySelectorAll("img")];
  return Promise.all(imgs.map((img) => {
    if (img.complete && img.naturalWidth) return img.decode?.().catch(() => {}) ?? Promise.resolve();
    return new Promise((resolve) => {
      const t = setTimeout(resolve, timeout);
      img.onload = img.onerror = () => { clearTimeout(t); resolve(); };
    });
  }));
}

function captureVideoFrame(url) {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    let settled = false;
    const finish = (val) => { if (!settled) { settled = true; resolve(val); v.removeAttribute("src"); v.load(); } };
    const timer = setTimeout(() => finish(null), 10000);
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadeddata = () => { try { v.currentTime = Math.min(0.1, (v.duration || 1) / 2); } catch { finish(null); } };
    v.onseeked = () => {
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        clearTimeout(timer);
        finish(c.toDataURL("image/jpeg", 0.9));
      } catch {
        clearTimeout(timer);
        finish(null);
      }
    };
    v.onerror = () => { clearTimeout(timer); finish(null); };
    v.src = url;
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

const fontCssCache = new Map();

/**
 * Sahifalarda ishlatilgan shriftlar uchun @font-face CSS'ni (fayllari data URL
 * sifatida ichiga joylangan holda) quradi. Google Fonts CSS'i boshqa domendan
 * bo'lgani uchun brauzer uni html-to-image'ga o'qishga bermaydi — shu sabab
 * o'zimiz yuklab olamiz. Faqat lotin va lotin-kengaytirilgan to'plamlari olinadi.
 */
async function buildFontEmbedCss(pages) {
  const families = new Set(["Inter", "Caveat", "Special Elite"]);
  for (const p of pages) for (const el of p.elements) {
    if (el.type === "text") {
      const css = (FONT_BY_ID[el.font] || FONT_BY_ID.sans).css;
      const m = css.match(/'([^']+)'/);
      if (m) families.add(m[1]);
    }
  }
  const key = [...families].sort().join("|");
  if (fontCssCache.has(key)) return fontCssCache.get(key);
  const res = await fetch(EDITOR_FONT_IMPORT);
  if (!res.ok) throw new Error("font css");
  const css = await res.text();
  const blocks = [];
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]*})/g;
  let m;
  while ((m = re.exec(css))) {
    const subset = m[1], block = m[2];
    if (subset !== "latin" && subset !== "latin-ext") continue;
    const fam = block.match(/font-family:\s*'([^']+)'/)?.[1];
    if (!fam || !families.has(fam)) continue;
    blocks.push(block);
  }
  const out = await Promise.all(blocks.map(async (block) => {
    const url = block.match(/url\(([^)]+)\)/)?.[1];
    if (!url) return "";
    try {
      const r = await fetch(url);
      const data = await blobToDataUrl(await r.blob());
      return block.replace(url, data);
    } catch {
      return "";
    }
  }));
  const result = out.filter(Boolean).join("\n");
  fontCssCache.set(key, result);
  return result;
}

async function renderPagesToCanvases(pages, { pixelRatio = 2, onProgress } = {}) {
  const { toCanvas } = await import("html-to-image");

  const videoFrames = {};
  const videoUrls = [...new Set(pages.flatMap((p) => p.elements.filter((e) => e.type === "video" && e.src).map((e) => e.src)))];
  for (const url of videoUrls) {
    const frame = await captureVideoFrame(url);
    if (frame) videoFrames[url] = frame;
  }

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "fixed", left: "-30000px", top: "0", width: `${PAGE_W}px`, height: `${PAGE_H}px`, pointerEvents: "none", zIndex: "-1" });
  document.body.appendChild(host);
  const root = createRoot(host);

  const canvases = [];
  let fontEmbedCSS;
  try {
    await document.fonts?.ready;
    for (let i = 0; i < pages.length; i++) {
      onProgress?.(i, pages.length);
      flushSync(() => root.render(<PageView page={pages[i]} mode="export" videoFrames={videoFrames} />));
      const node = host.firstElementChild;
      await waitForImages(node);
      await document.fonts?.ready;
      if (fontEmbedCSS === undefined) {
        try { fontEmbedCSS = await buildFontEmbedCss(pages); } catch { fontEmbedCSS = null; }
      }
      const canvas = await toCanvas(node, {
        pixelRatio,
        width: PAGE_W,
        height: PAGE_H,
        ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
        imagePlaceholder: PLACEHOLDER_PX,
        cacheBust: false,
      });
      canvases.push(canvas);
    }
  } finally {
    root.unmount();
    host.remove();
  }
  return canvases;
}

function download(blobOrUrl, filename) {
  const url = typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof blobOrUrl !== "string") setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function slugify(name) {
  const base = (name || "albom").trim().toLowerCase()
    .replace(/[ʻʼ'`’]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/(^-|-$)/g, "");
  return base || "albom";
}

export async function exportPageImage(page, { format = "png", filename, onProgress }) {
  const [canvas] = await renderPagesToCanvases([page], { pixelRatio: 2, onProgress });
  const mime = format === "jpg" ? "image/jpeg" : "image/png";
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, format === "jpg" ? 0.92 : undefined));
  if (!blob) throw new Error("Rasm yaratib bo'lmadi.");
  download(blob, `${filename}.${format}`);
}

export async function exportAlbumPdf(pages, { filename, onProgress }) {
  const [{ jsPDF }, canvases] = await Promise.all([
    import("jspdf"),
    renderPagesToCanvases(pages, { pixelRatio: 2, onProgress }),
  ]);
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [PAGE_W, PAGE_H], hotfixes: ["px_scaling"], compress: true });
  canvases.forEach((canvas, i) => {
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], "landscape");
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
  });
  pdf.save(`${filename}.pdf`);
}
