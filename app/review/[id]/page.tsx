"use client";

/**
 * Review Details Page
 * Route: /review/[id]
 *
 * This is the main page component for displaying a single review and its related
 * context. It is responsible for:
 *
 * - Reading the dynamic `id` route parameter (the review id).
 * - Loading review details via the `useReviewDetails` hook.
 * - Rendering three main sections:
 *    1) The review header (title, rating, stats).
 *    2) The album spotlight (cover art + album info).
 *    3) The full review body plus the comments & likes section.
 * - Rendering a sidebar with reviewer information and review stats.
 *
 * IMPORTANT: This page is a client component (`"use client"`), because it uses
 * React hooks like `useParams` and the custom `useReviewDetails` hook that relies
 * on client-side fetching/state.
 */

import { useParams } from "next/navigation";
import Header from "@/app/components/Header";
import CommentSection from "@/app/components/comments/CommentSection";

import { useReviewDetails } from "../../hooks/useReviewDetails";
import { ReviewHeader } from "../../components/reviews/ReviewHeader";
import { AlbumSpotlight } from "../../components/reviews/AlbumSpotlight";
import { ReviewerSidebar } from "../../components/reviews/ReviewSidebar";

/**
 * ReviewDetailsPage
 *
 * Top-level React component rendered for the `/review/[id]` route.
 * - Reads the `id` route param as `reviewId`.
 * - Uses `useReviewDetails(reviewId)` to load all derived review/album state.
 * - Handles loading and error states.
 * - Composes UI using smaller presentational components:
 *   - <ReviewHeader />
 *   - <AlbumSpotlight />
 *   - <CommentSection />
 *   - <ReviewerSidebar />
 *
 * If you need to modify how data is fetched or derived, do that in the
 * `useReviewDetails` hook. This component should stay focused on:
 * - wiring things together
 * - controlling what to show in loading/error/success states
 * - passing callbacks and props to child components.
 */

export default function ReviewDetailsPage() {
  /**
   * Read the dynamic route parameter from Next.js App Router.
   *
   * - For a URL such as `/review/abc123`, `params.id` will be `"abc123"`.
   * - The generic `<{ id?: string }>` makes `params.id` typed as `string | undefined`.
   * - We fallback to an empty string if `id` is missing, so `useReviewDetails("")`
   *   can handle the missing-id case internally (e.g., by setting an error state).
   */
  const params = useParams<{ id?: string }>();
  const reviewId = params?.id ?? "";

  /**
   * useReviewDetails(reviewId)
   * --------------------------
   * Custom hook encapsulating **all data fetching and derived review state**.
   * It returns:
   *
   * - `review`: the raw review object (or null if not loaded / not found).
   * - `loading`: boolean, true while fetching data.
   * - `error`: string | null, an error message suitable for user display.
   *
   * - `likeCount`: number of likes for this review.
   * - `viewerLiked`: whether the current viewer has liked this review.
   * - `commentCount`: number of comments associated with this review.
   *
   * - `setLikeCount`, `setViewerLiked`, `setCommentCount`:
   *     state setters to allow child components (like CommentSection) to
   *     update these values and keep the page-level state in sync.
   *
   * - `albumName`, `albumArtists`, `coverUrl`, `createdAt`:
   *     derived values for display, already formatted/normalized by the hook.
   *
   * NOTE: If you extend the review model (e.g., add tags, genres, etc.),
   * update `useReviewDetails` to expose new fields, and then pass them
   * into the relevant child components from here.
   */

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
      <Header showSearch />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row">
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
