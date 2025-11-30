"use client";

import CommentSection from "@/app/components/comments/CommentSection";
import type { FeedItem } from "@/app/types/feed";
import {
  albumName,
  artistLine,
  authorLinkId,
  cover,
  formatReviewDate,
  handle,
  stars,
} from "@/app/utils/feed";
import Link from "next/link";

type FeedReviewCardProps = {
  review: FeedItem;
  reviewId: string;
};

export default function FeedReviewCard({ review, reviewId }: FeedReviewCardProps) {
  const snap = review.albumSnapshot;
  const name = albumName(snap);
  const artists = artistLine(snap?.artists);
  const likeCount = Number(review.likeCount ?? (review as any).likeCount ?? 0);
  const initiallyLiked = !!(review.viewerLiked ?? (review as any).viewerLiked);

  return (
    <li className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-lg">
      <div className="flex items-start gap-4">
        <Link href={`/album/${review.albumId}`} className="shrink-0">
          <img
            src={cover(snap)}
            alt={name}
            className="h-28 w-28 rounded-xl object-cover"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/album/${review.albumId}`}
                className="block truncate text-lg font-semibold text-white hover:text-violet-300"
                title={name}
              >
                {name}
              </Link>
              <div className="truncate text-sm text-zinc-400">{artists}</div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-base font-semibold text-violet-300">
                {stars(review.rating)}
              </div>
              <div className="text-xs text-zinc-400">({review.rating}/5)</div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={`/profile/user/${authorLinkId(review)}`}
              className="text-zinc-300 hover:text-white"
            >
              {handle(review)}
            </Link>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">
              {formatReviewDate(review.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-zinc-100">
        {review.body}
      </p>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/review/${reviewId}`}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          Go to review
        </Link>
      </div>

      <CommentSection
        reviewId={reviewId}
        reviewLikeCount={likeCount}
        reviewInitiallyLiked={initiallyLiked}
        initialOpen={true}
      />
    </li>
  );
}
