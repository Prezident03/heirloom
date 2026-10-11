import { ImageResponse } from "next/og";
import { getSharedAlbum } from "@/lib/albums";

// Ulashilgan albom havolasi Telegram/WhatsApp va h.k.da katta kartochka bo'lib
// chiqishi uchun: fonda albom muqovasi, ustida nomi va "tomosha qiling" chaqirig'i.
export const alt = "Heirloom albomi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let album = null;
  try {
    album = await getSharedAlbum(token);
  } catch {
    album = null;
  }

  const title = album?.title || "Oilaviy albom";
  const family = album?.family_name ? `${album.family_name} oilasi` : "Heirloom";
  const photo =
    album?.cover_url ||
    album?.pages.flatMap((p) => p.elements).find((e) => e.type === "photo" && e.photo_url)?.photo_url ||
    null;
  const pageCount = album?.pages.length ?? 0;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "linear-gradient(135deg, #1E2621 0%, #2F4C48 100%)" }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", backgroundImage: "linear-gradient(to top, rgba(20,25,21,0.94) 0%, rgba(20,25,21,0.6) 45%, rgba(20,25,21,0.1) 100%)" }} />
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 56, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: "#D9BC85", textTransform: "uppercase", fontWeight: 700 }}>
            {family}{pageCount ? ` · ${pageCount} sahifa` : ""}
          </div>
          <div style={{ display: "flex", fontSize: 76, color: "#F2EDE2", fontWeight: 700, marginTop: 10, lineHeight: 1.05 }}>
            {title.length > 40 ? `${title.slice(0, 38)}…` : title}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#B8863B", color: "#FFFFFF", fontSize: 30, fontWeight: 700, padding: "16px 30px", borderRadius: 40 }}>
              ▶  Albomni tomosha qiling
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 40, right: 56, display: "flex", alignItems: "center", color: "#F2EDE2", fontSize: 28, fontWeight: 700 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #B8863B, #D9BC85)", marginRight: 12, display: "flex" }} />
          Heirloom
        </div>
      </div>
    ),
    { ...size }
  );
}
