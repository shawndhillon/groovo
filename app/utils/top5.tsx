export type FavoriteApiItem = {
  rank: number;
  albumId: string;
  review: { rating: number; body: string; createdAt: string } | null;
  albumSnapshot: {
    name: string;
    artists: Array<{ id: string; name: string }>;
    images: Array<{ url: string; width: number; height: number }>;
  } | null;
};

export type FavoritePutItem = { rank: number; albumId: string };

export async function getFavoritesTop5(userId?: string) {
  const url = new URL("/api/profile/top5", window.location.origin);
  if (userId) url.searchParams.set("userId", userId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.items) ? (data.items as FavoriteApiItem[]) : [];
}

export async function putFavoritesTop5(items: FavoritePutItem[]) {
  const res = await fetch("/api/profile/top5", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorites: items }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `HTTP ${res.status}`);
  }
}

export function dispatchFavoritesUpdated() {
  window.dispatchEvent(new CustomEvent("favorites:updated"));
}

// UI DTO used by SavedAlbumsGrid
export type SavedAlbum = {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string; width: number; height: number }>;
  review?: { rating: number; reviewText: string; createdAt: string };
  savedAt?: string;
};

export function mapFavoritesToSavedAlbums(api: FavoriteApiItem[]): SavedAlbum[] {
  return api
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((f) => ({
      id: f.albumId,
      name: f.albumSnapshot?.name ?? "Unknown",
      artists: f.albumSnapshot?.artists ?? [],
      images: f.albumSnapshot?.images ?? [],
      review: f.review
        ? { rating: f.review.rating, reviewText: f.review.body, createdAt: f.review.createdAt }
        : undefined,
      savedAt: f.review?.createdAt,
    }));
}
