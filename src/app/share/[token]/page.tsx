import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedAlbum } from "@/lib/albums";
import SharedAlbumViewer from "@/components/album-editor/SharedAlbumViewer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

async function load(token: string) {
  try {
    return await getSharedAlbum(token);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const album = await load(token);
  if (!album) return { title: "Albom topilmadi — Heirloom", robots: { index: false } };
  const description = `${album.family_name} oilasining albomi — tomosha qilish uchun bosing`;
  // Kartochka rasmi (muqova + nom + "tomosha qiling") opengraph-image.tsx orqali avtomatik qo'shiladi.
  return {
    title: `${album.title} — Heirloom`,
    description,
    // Shaxsiy albom — qidiruv tizimlariga ko'rsatilmaydi.
    robots: { index: false, follow: false },
    openGraph: { type: "website", title: album.title, description, siteName: "Heirloom" },
    twitter: { card: "summary_large_image", title: album.title, description },
  };
}

export default async function SharedAlbumPage({ params }: Props) {
  const { token } = await params;
  const album = await load(token);
  if (!album) notFound();
  return <SharedAlbumViewer album={album} />;
}
