/**
 * Purpose:
 *   Detail page for a single review, showing full review content,
 *   album context, and discussion (comments/likes).
 *
 * Scope:
 *   - Route: /review/[id]
 *   - Client component using useParams + useReviewDetails
 *
 * Role:
 *   - Read dynamic reviewId from the URL
 *   - Fetch review details via useReviewDetails(reviewId)
 *   - Render:
 *       • ReviewHeader (summary: rating, counts, metadata)
 *       • AlbumSpotlight (album art + artist info)
 *       • Full review body
 *       • CommentSection (comments + likes)
 *       • ReviewerSidebar (author info + stats)
 *   - Handle loading and error states
 *
 * Deps:
 *   - next/navigation: useParams
 *   - app/hooks/useReviewDetails for data loading and derived fields
 *   - app/components/Header for global site header
 *   - app/components/comments/CommentSection
 *   - app/components/reviews/ReviewHeader
 *   - app/components/reviews/AlbumSpotlight
 *   - app/components/reviews/ReviewSidebar
 *
 * Notes:
 *   - Uses a local `mounted` flag to avoid hydration mismatches
 *     when useReviewDetails uses client-only APIs.
 *   - Any changes to the review data model should generally be made
 *     in useReviewDetails, then passed through this page.
 */

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import Header from "@/app/components/Header";
import CommentSection from "@/app/components/comments/CommentSection";
import { ReviewHeader } from "@/app/(routes)/review/[id]/components/ReviewHeader";
import { AlbumSpotlight } from "@/app/(routes)/review/[id]/components/AlbumSpotlight";
import { ReviewerSidebar } from "@/app/(routes)/review/[id]/components/ReviewSidebar";

import { useReviewDetails } from "@/app/hooks/useReviewDetails";

/**
 * Top-level React component for /review/[id].
 *
 * - Reads reviewId from the route params
 * - Delegates data loading to useReviewDetails(reviewId)
 * - Renders main content + sidebar based on loading/error/success
 */
export default function ReviewDetailsPage() {
  // Read dynamic route param: /review/[id]
  const params = useParams<{ id?: string }>();
  const reviewId = params?.id ?? "";
  
  // Guard to avoid hydration mismatches if hooks rely on client-only APIs
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    review,
    loading,
    error,
    likeCount,
    viewerLiked,
    commentCount,
    setLikeCount,
    setViewerLiked,
    setCommentCount,
    albumName,
    albumArtists,
    coverUrl,
    createdAt,
  } = useReviewDetails(reviewId);

  // Pre-mount fallback (minimal content)
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
        <Header showSearch />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row">
          <div className="text-sm text-zinc-400">Loading review…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
      <Header showSearch />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row">
        {/* Main article */}
        <article className="flex-1 space-y-6 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 shadow-lg backdrop-blur">
          {loading && (
            <div className="text-sm text-zinc-400">Loading review…</div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {!loading && !error && review && (
            <>
              <ReviewHeader
                reviewId={reviewId}
                albumName={albumName}
                rating={review.rating}
                createdAt={createdAt}
                likeCount={likeCount}
                commentCount={commentCount}
              />

              <AlbumSpotlight
                albumId={review.albumId}
                coverUrl={coverUrl}
                albumName={albumName}
                albumArtists={albumArtists}
              />

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-zinc-200">Review</h2>
                <p className="whitespace-pre-line text-base leading-relaxed text-zinc-100">
                  {review.body}
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-zinc-200">
                  Comments
                </h2>
                <CommentSection
                  reviewId={review.id}
                  initialOpen
                  reviewLikeCount={likeCount}
                  reviewInitiallyLiked={viewerLiked}
                  onReviewLikeChange={(liked, nextCount) => {
                    setViewerLiked(liked);
                    setLikeCount(nextCount);
                  }}
                  onCommentCountChange={setCommentCount}
                />
              </section>
            </>
          )}
        </article>
        
        {/* Sidebar (only when we have data) */}
        {!loading && !error && review && (
          <ReviewerSidebar
            review={review}
            likeCount={likeCount}
            commentCount={commentCount}
            createdAt={createdAt}
          />
        )}
      </div>
    </main>
  );
}
