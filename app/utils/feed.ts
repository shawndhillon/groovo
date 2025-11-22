import type { FeedArtist, FeedAlbumSnapshot, FeedItem } from "@/app/types/feed";

export function getReviewId(r: { id?: string; _id?: any }): string {
  const raw =
    r?.id ??
    (typeof r?._id === "object" && r?._id?.$oid ? r._id.$oid : r?._id);
  return String(raw ?? "");
}

export function cover(snap?: FeedAlbumSnapshot): string {
  const images = snap?.images;
  return (Array.isArray(images) && images[0]?.url) || "/placeholder-album.png";
}

export function albumName(snap?: FeedAlbumSnapshot): string {
  return (snap?.name && String(snap.name)) || "Unknown album";
}

export function artistLine(artists?: FeedArtist[] | string[]): string {
  if (!Array.isArray(artists) || artists.length === 0) return "Unknown Artist";
  return (
    artists
      .map((x: any) => (typeof x === "string" ? x : x?.name))
      .filter((s: any): s is string => typeof s === "string" && s.trim().length > 0)
      .join(", ") || "Unknown Artist"
  );
}

export function handle(r: FeedItem): string {
  return r.author?.username
    ? `@${r.author.username}`
    : r.author?.name
    ? `@${r.author.name}`
    : `@${r.userId.slice(0, 6)}`;
}

export function authorLinkId(r: FeedItem): string {
  return (r.author?.id as string) || r.userId;
}

export function stars(n: number): string {
  const c = Math.max(0, Math.min(5, Number(n) || 0));
  const full = Math.floor(c);
  const half = Math.abs(c - full - 0.5) < 1e-6 ? 1 : c - full >= 0.5 ? 1 : 0;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleString();
}
