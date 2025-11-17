"use client";

/**
 * useReviewDetails Hook
 * =====================
 *
 * Purpose
 * -------
 * Centralizes all state + data fetching for the Review Details page.
 * The page (`/review/[id]`) uses this hook to:
 *
 * - Fetch review data from `/api/reviews/[id]`
 * - Track loading/error states
 * - Track and update like counts + viewer's like status
 * - Track and update total comment count
 * - Normalize album snapshot (title, artists, cover)
 * - Format the review creation date for display
 *
 * This keeps the page component clean, readable, and focused on layout.
 * Any future changes to review data or formatting should be done here.
 */
import { useEffect, useState, useMemo } from "react";
import type { ReviewResponse, AlbumSnapshot } from "../types/reviews";
import {
  albumCover,
  albumTitle,
  formatAlbumArtists,
  formatReviewDate,
} from "../utils/reviewFormat";

export function useReviewDetails(reviewId: string | undefined) {
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
