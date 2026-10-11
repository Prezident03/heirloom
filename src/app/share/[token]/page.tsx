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
  const description = album.description || `${album.family_name} oilasining albomi`;
  return {
    title: `${album.title} — Heirloom`,
    description,
    // Shaxsiy albom — qidiruv tizimlariga ko'rsatilmaydi.
    robots: { index: false, follow: false },
    openGraph: {
      title: album.title,
      description,
      images: album.cover_url ? [{ url: album.cover_url }] : undefined,
    },
  };
}

export default async function SharedAlbumPage({ params }: Props) {
  const { token } = await params;
  const album = await load(token);
  if (!album) notFound();
  return <SharedAlbumViewer album={album} />;
}
