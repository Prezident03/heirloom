"use client";

import { upload } from "@vercel/blob/client";

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export function mediaKind(file) {
  if (!file?.type) return null;
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

/** Fayl o'lchamlarini (piksel) o'qiydi — joylashtirishda nisbatni saqlash uchun. */
export function readDimensions(file) {
  const kind = mediaKind(file);
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const done = (w, h) => resolve({ width: w || null, height: h || null, previewUrl: url });
    if (kind === "video") {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.onloadedmetadata = () => done(v.videoWidth, v.videoHeight);
      v.onerror = () => done(null, null);
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => done(img.naturalWidth, img.naturalHeight);
      img.onerror = () => done(null, null);
      img.src = url;
    }
  });
}

/**
 * Faylni to'g'ridan-to'g'ri Vercel Blob'ga yuklaydi va oila kutubxonasiga qo'shadi.
 * Qaytaradi: { url, kind, width, height }
 */
export async function uploadMediaFile(file, { familySlug, registerMediaAction, onProgress, dims }) {
  const kind = mediaKind(file);
  if (!kind) throw new Error("Faqat rasm yoki video fayllarini yuklash mumkin.");
  if (kind === "photo" && file.size > MAX_IMAGE_BYTES) throw new Error("Rasm hajmi 25MB dan oshmasligi kerak.");
  if (kind === "video" && file.size > MAX_VIDEO_BYTES) throw new Error("Video hajmi 200MB dan oshmasligi kerak.");

  const { width, height } = dims || (await readDimensions(file));
  const safeName = (file.name || (kind === "video" ? "video.mp4" : "photo.jpg")).replace(/[^\w.-]+/g, "-").slice(-80);
  const blob = await upload(`albums/${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload",
    clientPayload: JSON.stringify({ familySlug }),
    multipart: file.size > 8 * 1024 * 1024,
    onUploadProgress: onProgress ? (e) => onProgress(e.percentage) : undefined,
  });

  if (registerMediaAction) {
    try {
      await registerMediaAction(familySlug, { url: blob.url, kind, width: width || undefined, height: height || undefined });
    } catch {
      // Kutubxonaga yozilmasa ham fayl yuklangan — albomda ishlatish mumkin.
    }
  }
  return { url: blob.url, kind, width, height };
}
