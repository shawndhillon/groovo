/**
 * Purpose:
 *   Core types for reviews and their associated album snapshots.
 *
 * Scope:
 *   - Used across:
 *       • Review details page (/review/[id])
 *       • Review lists/feed
 *       • review-related hooks and utils (useReviewDetails, reviewFormat, etc.)
 *
 * Responsibilities:
 *   - Define a lightweight "snapshot" of album data stored with a review
 *     (decoupled from raw Spotify API types).
 *   - Define author metadata attached to a review.
 *   - Define the ReviewResponse payload shape returned by the reviews API.
 *
 * Notes:
 *   - These types are intentionally simpler than the full Spotify API types.
 *     They represent what we persist and render for reviews, not the entire
 *     Spotify object.
 *   - If the API response changes, update these types *and* the API handler
 *     together so UI/hooks stay consistent.
 */

/**
 * Minimal artist representation stored on a review's album snapshot.
 * We allow either:
 *   - a raw string ("Artist Name"), or
 *   - an object with optional id + name.
 */
export type AlbumArtist = { id?: string; name?: string } | string;

/**
 * Minimal album image representation for snapshots.
 */
export type AlbumImage = { url?: string; width?: number; height?: number };

/**
 * AlbumSnapshot
 *
 * Lightweight subset of an album that we store with the review so we can
 * render it even if Spotify data changes later.
 *
 * - May be null if the snapshot was never saved.
 * - All fields are optional to keep it robust to older data.
 */
export type AlbumSnapshot = {
  name?: string;
  artists?: AlbumArtist[];
  images?: AlbumImage[];
} | null;

/**
 * ReviewAuthor
 *
 * Metadata about the user who wrote the review.
 * - May be null when author data is missing or anonymized.
 */
export type ReviewAuthor = {
  id?: string;
  username?: string | null;
  name?: string | null;
  image?: string | null;
} | null;

/**
 * ReviewResponse
 *
 * Canonical review payload returned by the reviews API.
 *
 * Notes:
 *   - likeCount, commentCount, viewerLiked, albumSnapshot, and author
 *     are optional because older data or some endpoints may omit them.
 *   - The UI (e.g. useReviewDetails) is responsible for applying
 *     sensible defaults.
 */
export type ReviewResponse = {
  id: string;
  userId: string;
  albumId: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt?: string;
  likeCount?: number;
  commentCount?: number;
  albumSnapshot?: AlbumSnapshot;
  author?: ReviewAuthor;
  viewerLiked?: boolean;
};
