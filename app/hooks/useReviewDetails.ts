/**
 * Purpose:
 *   Central data + state manager for the Review Details page.
 *
 * Scope:
 *   - Used by: /review/[id]/page.tsx
 *   - Client-side hook (no server components)
 *
 * Responsibilities:
 *   - Fetch review data from `/api/reviews/[id]`
 *   - Track loading + error states
 *   - Manage like count, viewer like status, and comment count
 *   - Normalize album snapshot into UI-ready fields (title, artists, cover)
 *   - Format the review creation date for display
 *
 * Deps:
 *   - React: useEffect, useState, useMemo
 *   - Types: ReviewResponse, AlbumSnapshot (from app/types/reviews)
 *   - Utils: albumCover, albumTitle, formatAlbumArtists, formatReviewDate
 *     (from app/utils/reviewFormat)
 *
 * Notes:
 *   - Any changes to the review API payload shape should be handled here,
 *     so page + presentational components can stay simple and dumb.
 *   - This hook exposes only UI-friendly values and safe fallbacks.
 */

"use client";

import { useEffect, useState, useMemo, Dispatch, SetStateAction } from "react";
import type { ReviewResponse, AlbumSnapshot } from "../types/reviews";
import {
  albumCover,
  albumTitle,
  formatAlbumArtists,
  formatReviewDate,
} from "../utils/reviewFormat";

interface UseReviewDetailsResult {
  // Raw review data from the backend
  review: ReviewResponse | null;
  loading: boolean;
  error: string | null;

  // Like + comment state
  likeCount: number;
  viewerLiked: boolean;
  commentCount: number;

  // Setters used by child components (CommentSection, like controls, etc.)
  setLikeCount: Dispatch<SetStateAction<number>>;
  setViewerLiked: Dispatch<SetStateAction<boolean>>;
  setCommentCount: Dispatch<SetStateAction<number>>;

  // Derived album info
  albumSnapshot: AlbumSnapshot;
  albumArtists: string;
  albumName: string;
  coverUrl: string;

  // Derived date info
  createdAt: string | null;
}

// useReviewDetails
export function useReviewDetails(
  reviewId: string | undefined
): UseReviewDetailsResult {
  // Review object returned from backend API
  const [review, setReview] = useState<ReviewResponse | null>(null);

  // Status state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction state (likes + comments)
  const [likeCount, setLikeCount] = useState<number>(0);
  const [viewerLiked, setViewerLiked] = useState<boolean>(false);
  const [commentCount, setCommentCount] = useState<number>(0);

  // Fetch review details whenever reviewId changes
  useEffect(() => {
    if (!reviewId) {
      setError("Missing review identifier.");
      setLoading(false);
      setCommentCount(0);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/reviews/${reviewId}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) {
          throw new Error(body?.error || "Failed to load review");
        }
        return body as ReviewResponse;
      })
      .then((data) => {
        if (cancelled) return;

        // Set main review object
        setReview(data);

        // Initialize local derived counts + statuses
        setLikeCount(Number(data.likeCount ?? 0));
        setViewerLiked(!!data.viewerLiked);
        setCommentCount(Number(data.commentCount ?? 0));
      })
      .catch((e: any) => {
        if (cancelled) return;
        setReview(null);
        setError(e?.message || "Failed to load review");
        setCommentCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reviewId]);
  
  // Derived + formatted album details
  const albumSnapshot: AlbumSnapshot = review?.albumSnapshot ?? null;

  const albumArtists = useMemo(
    () => formatAlbumArtists(albumSnapshot),
    [albumSnapshot]
  );
  const albumName = useMemo(
    () => albumTitle(albumSnapshot),
    [albumSnapshot]
  );
  const coverUrl = useMemo(
    () => albumCover(albumSnapshot),
    [albumSnapshot]
  );

  // Formatted review creation date
  const createdAt = useMemo(
    () => formatReviewDate(review?.createdAt),
    [review?.createdAt]
  );

  // Returned API — consumed by the review page
  return {
    // Raw review data
    review,
    loading,
    error,

    // Like + comment state
    likeCount,
    viewerLiked,
    commentCount,

    // Setters used by child components (CommentSection, LikeButton)
    setLikeCount,
    setViewerLiked,
    setCommentCount,

    // Derived album info
    albumSnapshot,
    albumArtists,
    albumName,
    coverUrl,

    // Derived date info
    createdAt,
  };
}
