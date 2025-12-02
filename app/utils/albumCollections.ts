/**
 * Purpose:
 *   Shared utilities for working with album-based collections such as
 *   Top Favorites (Top 5) and review lists, and mapping them into a
 *   normalized shape for grid components.
 *
 * Scope:
 *   - Used by profile pages and other views that render album grids
 *   - Handles fetching and updating the Top Favorites (Top 5) list
 *   - Handles mapping review responses into SavedAlbum tiles
 *
 * Role:
 *   - Provide a single SavedAlbum DTO for album tiles across the app
 *   - Wrap the /api/profile/top5 endpoint (GET + PUT)
 *   - Offer mapping helpers:
 *       - mapFavoritesToSavedAlbums()
 *       - mapReviewsToSavedAlbums()
 *
 * Deps:
 *   - Global fetch API (Next.js / browser)
 *   - app/types/reviews for ReviewResponse, AlbumSnapshot, AlbumArtist, AlbumImage
 *
 * Notes:
 *   - This module is UI-agnostic and does not import React
 *   - SavedAlbum is shaped to work with SavedAlbumsGrid + TopFiveEditableGrid
 *   - Top Favorites updates always apply to the current authenticated user;
 *     userId is only used on GET (for viewing another user's Top 5).
 */

import type {
  ReviewResponse,
  AlbumSnapshot,
  AlbumArtist,
  AlbumImage,
} from "@/app/types/reviews";

export type NormalizedArtist = { id: string; name: string };

/**
 * Normalized shape used by album grid components.
 * Matches what SavedAlbumsGrid / TopFiveEditableGrid expect.
 */
export type SavedAlbum = {
  id: string;
  name: string;
  artists: NormalizedArtist[];
  images: AlbumImage[];
  review?: {
    rating: number;
    reviewText: string;
    createdAt: string;
  };
  savedAt?: string;
};

/**
 * Minimal payload used when saving Top Favorites (Top 5).
 */
export type TopFavoriteItem = {
  rank: number;
  albumId: string;
};

/**
 * Full Top Favorites item coming back from the API.
 */
export type TopFavoriteApiItem = {
  rank: number;
  albumId: string;
  review?: ReviewResponse | null;
  albumSnapshot?: AlbumSnapshot; // AlbumSnapshot is already `| null`
};

const TOP_FAVORITES_ENDPOINT = "/api/profile/top5";

/**
 * Broadcast a global "favorites:updated" event so listeners
 * (e.g., useTopFavorites, profile components) can refresh.
 */
export function dispatchFavoritesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("favorites:updated"));
}

/**
 * Fetch Top Favorites (Top 5) for a user.
 *
 * If userId is omitted, the backend should use the currently
 * authenticated user.
 */
export async function fetchTopFavorites(
  userId?: string,
): Promise<TopFavoriteApiItem[]> {
  const url =
    userId && userId.length > 0
      ? `${TOP_FAVORITES_ENDPOINT}?userId=${encodeURIComponent(userId)}`
      : TOP_FAVORITES_ENDPOINT;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status}`);
  }

  const json = await res.json().catch(() => ({ items: [] as any[] }));
  const items = Array.isArray(json.items) ? json.items : [];

  return items.map(
    (item: any): TopFavoriteApiItem => ({
      rank: item.rank,
      albumId: item.albumId,
      review: item.review ?? null,
      albumSnapshot: item.albumSnapshot ?? null,
    }),
  );
}

/**
 * Persist the ordered list of Top Favorites (Top 5) for the
 * current authenticated user.
 */
export async function saveTopFavorites(
  favorites: TopFavoriteItem[],
): Promise<void> {
  const res = await fetch(TOP_FAVORITES_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorites }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error || `PUT ${TOP_FAVORITES_ENDPOINT} failed: ${res.status}`,
    );
  }
}

/**
 * Normalize AlbumSnapshot into a predictable shape:
 * - Always returns a name
 * - Always returns at least one artist
 * - Always returns at least one image (placeholder if needed)
 */
export function normalizeAlbumSnapshot(
  snap: AlbumSnapshot | null | undefined,
): {
  name: string;
  artists: NormalizedArtist[];
  images: AlbumImage[];
} {
  if (!snap) {
    return {
      name: "Unknown",
      artists: [{ id: "unknown", name: "Unknown Artist" }],
      images: [{ url: "/placeholder-album.svg" }],
    };
  }

  const name =
    typeof snap.name === "string" && snap.name.trim().length > 0
      ? snap.name
      : "Unknown";

  const rawArtists: AlbumArtist[] = Array.isArray(snap.artists)
    ? snap.artists
    : [];

  const artists: NormalizedArtist[] =
    rawArtists.length > 0
      ? rawArtists.map((a): NormalizedArtist => {
          if (typeof a === "string") {
            return {
              id: "unknown",
              name: a || "Unknown Artist",
            };
          }
          return {
            id: a.id ?? "unknown",
            name: a.name || "Unknown Artist",
          };
        })
      : [{ id: "unknown", name: "Unknown Artist" }];

  const rawImages: AlbumImage[] = Array.isArray(snap.images)
    ? snap.images
    : [];

  const images: AlbumImage[] =
    rawImages.length > 0
      ? rawImages.map((img) => ({
          url: img.url ?? "/placeholder-album.svg",
          width: img.width,
          height: img.height,
        }))
      : [{ url: "/placeholder-album.svg", width: 640, height: 640 }];

  return { name, artists, images };
}

/**
 * Map Top Favorites (from the API) into SavedAlbum tiles suitable for
 * profile Top 5 grids.
 */
export function mapFavoritesToSavedAlbums(
  favorites: TopFavoriteApiItem[],
): SavedAlbum[] {
  return favorites.map((item) => {
    const snap = item.albumSnapshot ?? null;
    const base = normalizeAlbumSnapshot(snap);

    return {
      id: item.albumId,
      name: base.name,
      artists: base.artists,
      images: base.images,
      review: item.review
        ? {
            rating: item.review.rating,
            reviewText: item.review.body,
            createdAt: item.review.createdAt,
          }
        : undefined,
      savedAt: item.review?.createdAt,
    };
  });
}

/**
 * Map review responses into SavedAlbum tiles, e.g. for "My Reviews"
 * grids on the profile page.
 */
export function mapReviewsToSavedAlbums(
  reviews: ReviewResponse[],
): SavedAlbum[] {
  if (!reviews) return [];

  return reviews.map((review) => {
    const snap = review.albumSnapshot ?? null;
    const base = normalizeAlbumSnapshot(snap);

    return {
      id: review.albumId,
      name: base.name,
      artists: base.artists,
      images: base.images,
      review: {
        rating: review.rating,
        reviewText: review.body,
        createdAt: review.createdAt,
      },
      savedAt: review.createdAt,
    };
  });
}
