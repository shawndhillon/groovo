"use client";

/**
 * ReviewHeader Component
 *
 * Purpose
 * -------
 * Displays the high-level meta information for a review:
 * - Album title
 * - Star rating + numeric rating
 * - Formatted creation date (if available)
 * - Like count and comment count
 *
 * This component is intended to be a simple *presentational* header used in the
 * Review Details page (`/review/[id]`).
 *
 * When to modify this file:
 * -------------------------
 * - If new review metadata is added (e.g., genres, tags, edit timestamp).
 * - If the visual layout needs adjustment for the header section.
 * - If additional contextual elements should appear near the title/rating.
 *
 * Not recommended:
 * ----------------
 * - Do NOT perform data fetching or side effects here.
 *   Keep all data handling in hooks like `useReviewDetails`.
 */
import { ratingStars, pluralize } from "../../utils/reviewFormat";

interface ReviewHeaderProps {
  reviewId: string;
  albumName: string;
  rating: number;
  createdAt: string | null;
  likeCount: number;
  commentCount: number;
}

// Renders the review header section seen at the top of the review detail page.
export function ReviewHeader({
  albumName,
  rating,
  createdAt,
  likeCount,
  commentCount,
}: ReviewHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-widest text-violet-300">
        Review
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">{albumName}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        <span className="text-base font-semibold text-violet-300">
          {ratingStars(rating)}
        </span>
        <span>Rating: {rating}/5</span>

        {createdAt && (
          <>
            <span>•</span>
            <span>{createdAt}</span>
          </>
        )}

        <span>•</span>
        <span>{pluralize(likeCount, "like")}</span>

        <>
          <span>•</span>
          <span>{pluralize(commentCount, "comment")}</span>
        </>
      </div>
    </div>
  );
}
