/**
 * Purpose:
 *   Shared, pure formatting helpers for the review + album UI.
 *
 * Scope:
 *   - Used by:
 *       • /review/[id]/page.tsx via useReviewDetails
 *       • components/reviews/ReviewHeader
 *       • components/reviews/AlbumSpotlight
 *       • components/reviews/ReviewSidebar
 *   - No React imports; safe to use in hooks, components, and route handlers.
 *
 * Responsibilities:
 *   - Normalize album snapshot fields into UI-ready strings:
 *       • album title
 *       • artist list
 *       • cover image URL with safe fallback
 *   - Format reviewer metadata:
 *       • display name
 *       • handle
 *       • initial
 *       • profile link
 *   - Format review dates for display
 *   - Provide simple rating → stars conversion
 *   - Provide basic pluralization ("1 like" vs "2 likes")
 *
 * Notes:
 *   - These helpers should stay stateless and side-effect free.
 *   - If the review or album API shape changes, update these functions so
 *     components and hooks can remain small and declarative.
 */

import type { AlbumSnapshot, ReviewResponse } from "@/app/types/reviews";

/**
 * albumTitle
 *
 * Returns a user-facing album title string from an AlbumSnapshot.
 * Falls back to "Unknown album" when missing.
 */
export function albumTitle(snapshot: AlbumSnapshot): string {
  if (!snapshot) return "Unknown album";
  return snapshot.name?.trim() || "Unknown album";
}

/**
 * albumCover
 *
 * Returns a URL to the album cover image, or a safe placeholder if
 * the snapshot has no images.
 */
export function albumCover(snapshot: AlbumSnapshot): string {
  const fallback = "/placeholder-album.png";
  if (!snapshot || !snapshot.images || snapshot.images.length === 0) {
    return fallback;
  }

  const primary = snapshot.images[0];
  return primary?.url || fallback;
}

/**
 * formatAlbumArtists
 *
 * Produces a comma-separated list of artist names from an AlbumSnapshot.
 * Handles both string artists and { name } objects.
 */
export function formatAlbumArtists(snapshot: AlbumSnapshot): string {
  if (!snapshot || !snapshot.artists || snapshot.artists.length === 0) {
    return "Unknown artist";
  }

  const names = snapshot.artists.map((artist) => {
    if (typeof artist === "string") return artist;
    return artist?.name || "Unknown artist";
  });

  const uniqueNames = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));

  return uniqueNames.length > 0 ? uniqueNames.join(", ") : "Unknown artist";
}

function safeAuthor(review: ReviewResponse | null | undefined) {
  return review?.author ?? null;
}

/**
 * reviewerDisplayName
 *
 * Returns the primary display name for the review's author.
 * Priority:
 *   - author.username
 *   - author.name
 *   - "Unknown reviewer"
 */
export function reviewerDisplayName(review: ReviewResponse | null): string {
  const author = safeAuthor(review);
  if (author?.username && author.username.trim()) return author.username;
  if (author?.name && author.name.trim()) return author.name;
  return "Unknown reviewer";
}

/**
 * reviewerHandle
 *
 * Returns a handle-style string for the reviewer:
 *   - "@username" when username exists
 *   - "@anonymous" fallback otherwise
 */
export function reviewerHandle(review: ReviewResponse | null): string {
  const author = safeAuthor(review);
  const username = author?.username?.trim();
  if (username) return `@${username}`;
  return "@anonymous";
}

/**
 * reviewerInitial
 *
 * Returns a single initial for the reviewer avatar.
 * Uses the first character of the display name, handle, or "?" as fallback.
 */
export function reviewerInitial(review: ReviewResponse | null): string {
  const display = reviewerDisplayName(review) || reviewerHandle(review) || "?";
  const source = display.trim();
  if (!source) return "?";
  return source.slice(0, 1).toUpperCase();
}

/**
 * reviewerProfileHref
 *
 * Returns a URL to the reviewer's profile page.
 *
 * Behavior:
 *   - If the review belongs to the current user, returns "/profile"
 *   - Otherwise returns "/profile/[id]" based on:
 *       • author.id (preferred)
 *       • review.userId
 *   - Fallback: "/profile"
 */
export function reviewerProfileHref(
  review: ReviewResponse | null,
  currentUserId?: string
): string {
  const authorId = review?.author?.id;
  const ownerId = authorId ?? review?.userId;

  const isCurrentUsersReview =
    currentUserId && (currentUserId === authorId || currentUserId === review?.userId);

  if (isCurrentUsersReview) return "/profile";
  if (ownerId) return `/profile/${ownerId}`;
  return "/profile";
}

/**
 * formatReviewDate
 *
 * Converts an ISO date string into a human-readable date.
 *
 * Example output:
 *   "Nov 30, 2025"
 *
 * Returns null if the input is missing or invalid.
 */
export function formatReviewDate(isoDate?: string | null): string | null {
  if (!isoDate) return null;

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * ratingStars
 *
 * Converts a numeric rating (0–5) into a simple star string.
 * Uses whole stars only, e.g.:
 *   ratingStars(4) → "★★★★☆"
 */
export function ratingStars(rating: number): string {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  const full = "★".repeat(clamped);
  const empty = "☆".repeat(5 - clamped);
  return full + empty;
}

/**
 * pluralize
 *
 * Returns a count + word with basic pluralization:
 *   pluralize(1, "like")     → "1 like"
 *   pluralize(3, "comment")  → "3 comments"
 *
 * - Floors non-integer counts.
 * - Treats non-finite values as 0.
 */
export function pluralize(count: number, unit: string): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${safe} ${safe === 1 ? unit : `${unit}s`}`;
}
