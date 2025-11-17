/**
 * Review / Album Formatting Utilities
 *
 * This module contains small, pure helper functions used across the
 * review detail flow:
 * - Formatting album artist names and album titles
 * - Selecting a cover image (with a safe placeholder fallback)
 * - Formatting reviewer display info (name, handle, initials, profile link)
 * - Formatting review dates into human-readable strings
 * - Generating star strings from numeric ratings
 * - Simple pluralization helper ("1 like" vs "2 likes")
 *
 * These helpers are intentionally stateless and UI-agnostic so they can be
 * reused in pages, components, and hooks without pulling in React.
 */

import type { AlbumSnapshot, ReviewResponse } from "../types/reviews";

const PLACEHOLDER_COVER = "/placeholder-album.png";

/**
 * formatAlbumArtists
 * 
 * Converts the album snapshot's `artists` field into a single string like:
 *   "Artist A, Artist B"
 *
 * Handles:
 * - Array of artist objects (`{ name: string }`)
 * - Array of strings
 * - Empty / missing data → "Unknown Artist"
 */
export function formatAlbumArtists(snapshot: AlbumSnapshot): string {
  if (!snapshot?.artists || !Array.isArray(snapshot.artists) || snapshot.artists.length === 0) {
    return "Unknown Artist";
  }

  const names = snapshot.artists
    .map((artist) => (typeof artist === "string" ? artist : artist?.name ?? ""))
    .filter((name): name is string => name.trim().length > 0);

  return names.length > 0 ? names.join(", ") : "Unknown Artist";
}

/**
 * albumCover
 * 
 * Picks a URL to use as album cover art.
 *
 * Selection rules:
 * - Use the first image that has a non-empty `url`.
 * - Fall back to the first image in the array if needed.
 * - If nothing valid exists, return a placeholder cover path.
 */
export function albumCover(snapshot: AlbumSnapshot): string {
  if (!snapshot?.images || !Array.isArray(snapshot.images)) return PLACEHOLDER_COVER;

  const candidate = snapshot.images.find(
    (img) => typeof img?.url === "string" && img.url.length > 0
  );
  if (candidate?.url) return candidate.url;

  if (snapshot.images[0]?.url) return snapshot.images[0].url!;
  return PLACEHOLDER_COVER;
}

/**
 * albumTitle
 * 
 * Returns a clean album title string.
 * - Falls back to "Unknown album" on missing/blank values.
 */
export function albumTitle(snapshot: AlbumSnapshot): string {
  if (!snapshot?.name || String(snapshot.name).trim().length === 0) return "Unknown album";
  return String(snapshot.name);
}

/**
 * reviewerDisplayName
 * -------------------
 * Picks a human-friendly display name for a review's author.
 * Priority:
 *   author.name → author.username → "Unknown reviewer"
 */
export function reviewerDisplayName(review: ReviewResponse | null): string {
  if (!review) return "Unknown reviewer";
  return review.author?.name ?? review.author?.username ?? "Unknown reviewer";
}

/**
 * reviewerHandle
 * 
 * Builds an @handle string for a reviewer.
 * Priority:
 *   username → name → trimmed userId → "@unknown"
 */
export function reviewerHandle(review: ReviewResponse | null): string {
  if (!review) return "@unknown";
  if (review.author?.username) return `@${review.author.username}`;
  if (review.author?.name) return `@${review.author.name}`;
  if (review.userId) return `@${review.userId.slice(0, 6)}`;
  return "@unknown";
}

/**
 * reviewerInitial
 * 
 * Returns a single uppercase letter to use as an avatar initial.
 * - Uses name → username → userId → "U" as fallback.
 */
export function reviewerInitial(review: ReviewResponse | null): string {
  const source =
    review?.author?.name ?? review?.author?.username ?? review?.userId ?? "U";
  return source.slice(0, 1).toUpperCase();
}

/**
 * reviewerProfileHref
 * 
 * Returns a URL to the reviewer's profile page.
 * Priority:
 *   author.id → userId → "/profile" fallback.
 */
export function reviewerProfileHref(review: ReviewResponse | null): string {
  const id = review?.author?.id ?? review?.userId ?? "";
  return id ? `/profile/user/${id}` : "/profile";
}

/**
 * formatReviewDate
 * 
 * Formats a timestamp string into a human-readable date (e.g. "Nov 16, 2025").
 * - Returns `null` for invalid or missing dates so callers can omit the UI.
 */
export function formatReviewDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * ratingStars
 * 
 * Converts a numeric rating (0–5) into a star string
 * - Clamps values between 0 and 5.
 * - Supports half-star values (X.5).
 */
export function ratingStars(n: number) {
  const c = Math.max(0, Math.min(5, Number(n) || 0));
  const full = Math.floor(c);
  const half = Math.abs(c - full - 0.5) < 1e-6 ? 1 : c - full >= 0.5 ? 1 : 0;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
}

/**
 * pluralize
 * 
 * Returns a count + word with basic pluralization:
 *   pluralize(1, "like")  → "1 like"
 *   pluralize(3, "comment") → "3 comments"
 *
 * - Floors non-integer counts.
 * - Treats non-finite values as 0.
 */
export function pluralize(count: number, unit: string) {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${safe} ${safe === 1 ? unit : `${unit}s`}`;
}
