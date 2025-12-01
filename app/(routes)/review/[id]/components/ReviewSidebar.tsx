/**
 * Purpose:
 *   Sidebar card for the review details page that highlights the reviewer
 *   and key stats for the current review.
 *
 * Scope:
 *   - Used on /review/[id] alongside the main review content
 *   - Pure UI component (no data fetching; minimal hook usage)
 *
 * Responsibilities:
 *   - Display reviewer identity (initial, display name, handle)
 *   - Link to the appropriate profile page (viewer vs other user)
 *   - Show core review stats: rating, likes, comments, published date
 *
 * Deps:
 *   - next/link
 *   - types: ReviewResponse
 *   - utils/reviewFormat:
 *       • reviewerDisplayName
 *       • reviewerHandle
 *       • reviewerInitial
 *       • reviewerProfileHref
 *       • pluralize
 *   - hooks: useCurrentUser (for viewer id, used by reviewerProfileHref)
 *
 * Notes:
 *   - All review data is assumed to be normalized upstream
 *     (e.g., dates formatted via useReviewDetails).
 *   - To add actions (follow reviewer, message button, etc.),
 *     extend this component’s props and UI only — the data model
 *     should remain in hooks/utils.
 */

"use client";

import Link from "next/link";
import type { ReviewResponse } from "@/app/types/reviews";
import {
  reviewerDisplayName,
  reviewerHandle,
  reviewerInitial,
  reviewerProfileHref,
  pluralize,
} from "@/app/utils/reviewFormat";

import { useCurrentUser } from "@/app/hooks/useCurrentUser";

interface ReviewerSidebarProps {
  review: ReviewResponse;
  likeCount: number;
  commentCount: number;
  createdAt: string | null;
}

// ReviewerSidebar
export function ReviewerSidebar({
  review,
  likeCount,
  commentCount,
  createdAt,
}: ReviewerSidebarProps) {
  const { user } = useCurrentUser();
  
  // Resolve profile link based on whether viewer owns this review
  const profileHref = reviewerProfileHref(review, user?._id);
  
  return (
    <aside className="w-full max-w-sm space-y-6">
      {/* Reviewer identity card */}
      <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 shadow-lg backdrop-blur">
        <h2 className="text-sm uppercase tracking-widest text-violet-300">
          Reviewer
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/40 bg-violet-500/20 text-xl font-semibold text-violet-300">
            {reviewerInitial(review)}
          </div>
          <div className="flex flex-col">
            <span className="text-base font-medium text-white">
              {reviewerDisplayName(review)}
            </span>
            <span className="text-sm text-zinc-400">
              {reviewerHandle(review)}
            </span>
          </div>
        </div>
        <Link
          href={profileHref}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-800"
        >
          Visit profile
        </Link>
      </section>
      {/* Review stats card */}
      <section className="rounded-3xl border border-white/10 bg-zinc-900/40 p-5 shadow">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">
          Review Stats
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>Rating: {review.rating}/5</li>
          <li>{pluralize(likeCount, "like")}</li>
          <li>{pluralize(commentCount, "comment")}</li>
          {createdAt && <li>Published: {createdAt}</li>}
        </ul>
      </section>
    </aside>
  );
}
