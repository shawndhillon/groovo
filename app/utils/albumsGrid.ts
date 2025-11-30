// ----- API types -----

export type FavoriteApiItem = {
  rank: number;
  albumId: string;
  review: { rating: number; body: string; createdAt: string } | null;
  albumSnapshot: AlbumSnapshotLike | null;
};

export type FavoritePutItem = { rank: number; albumId: string };

// Minimal shape for any "album snapshot" we get from the backend
export type AlbumSnapshotLike = {
  name?: string;
  artists?: Array<{ id: string; name: string }>;
  images?: Array<{ url: string; width: number; height: number }>;
};

// ----- Network helpers -----

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

// ----- Shared UI DTO -----

export type SavedAlbum = {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string; width: number; height: number }>;
  review?: { rating: number; reviewText: string; createdAt: string };
  savedAt?: string;
};

/**
 * Normalizes an album "snapshot" from the backend into safe UI fields.
 * Applies fallbacks for name, artists, and images so the UI never breaks.
 */
export function normalizeAlbumSnapshot(
  snap: AlbumSnapshotLike | null | undefined,
): {
  name: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string; width: number; height: number }>;
} {
  const name =
    typeof snap?.name === "string" && snap.name.trim()
      ? snap.name
      : "Unknown";

  const artists =
    Array.isArray(snap?.artists) && snap.artists.length > 0
      ? snap.artists
      : [{ id: "unknown", name: "Unknown Artist" }];

  const images =
    Array.isArray(snap?.images) && snap.images.length > 0
      ? snap.images
      : [{ url: "/placeholder-album.svg", width: 640, height: 640 }];

  return { name, artists, images };
}

/**
 * Favorites API -> SavedAlbum[]
 * Used by the Top 5 favorites section.
 */
export function mapFavoritesToSavedAlbums(api: FavoriteApiItem[]): SavedAlbum[] {
  return api
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((f) => {
      const base = normalizeAlbumSnapshot(f.albumSnapshot);

      return {
        id: f.albumId,
        ...base,
        review: f.review
          ? {
              rating: f.review.rating,
              reviewText: f.review.body,
              createdAt: f.review.createdAt,
            }
          : undefined,
        savedAt: f.review?.createdAt,
      };
    });
}

// Minimal shape for a "review" item coming from useUserReviews()
type ReviewLike = {
  albumId: string;
  rating: number;
  body: string;
  createdAt: string;
  albumSnapshot?: AlbumSnapshotLike | null;
  // some older data may have a legacy "album" field
  album?: AlbumSnapshotLike | null;
};

/**
 * Reviews API -> SavedAlbum[]
 * Used by the "My Reviews" grid on the profile page.
 */
export function mapReviewsToSavedAlbums(
  reviews: ReviewLike[] | null | undefined,
): SavedAlbum[] {
  if (!reviews) return [];

  return reviews.map((r) => {
    const snap = r.albumSnapshot ?? r.album ?? null;
    const base = normalizeAlbumSnapshot(snap);

    return {
      id: r.albumId,
      ...base,
      review: {
        rating: r.rating,
        reviewText: r.body,
        createdAt: r.createdAt,
      },
      savedAt: r.createdAt,
    };
  });
}
