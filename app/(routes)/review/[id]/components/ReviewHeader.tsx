/**
 * Purpose:
 *   Presentational header for a single review, showing core metadata.
 *
 * Scope:
 *   - Used on the Review Details page: /review/[id]
 *   - Pure UI component (no data fetching, no side effects)
 *
 * Responsibilities:
 *   - Display album title
 *   - Render star rating + numeric rating
 *   - Show formatted creation date (if provided)
 *   - Show like + comment counts with pluralization
 *   - Expose a Share button for the review URL
 *
 * Deps:
 *   - utils/reviewFormat: ratingStars, pluralize
 *   - components/ShareButton: generic share control
 *
 * Notes:
 *   - `createdAt` is expected to be a preformatted date string
 *     (formatting should be handled upstream, e.g. in useReviewDetails).
 *   - Any additional review metadata (tags, edited timestamp, etc.)
 *     should be added via props and rendered here.
 */

"use client";

import { ratingStars, pluralize } from "@/app/utils/reviewFormat";
import ShareButton from "@/app/components/ShareButton";

interface ReviewHeaderProps {
  reviewId: string;
  albumName: string;
  rating: number;
  createdAt: string | null;
  likeCount: number;
  commentCount: number;
}

export function ReviewHeader({
  reviewId,
  albumName,
  rating,
  createdAt,
  likeCount,
  commentCount,
}: ReviewHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-violet-300">
          Review
        </span>
        <ShareButton
          url={`/review/${reviewId}`}
          label="Share Review"
          size="sm"
        />
      </div>
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
