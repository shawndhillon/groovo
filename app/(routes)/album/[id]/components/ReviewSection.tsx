/**
 * Purpose:
 *   Album reviews section that displays existing reviews and provides
 *   an entry point for writing a new review.
 *
 * Scope:
 *   - Used on the album detail page (/album/[id])
 *   - Wraps ReviewsPanel (list) and ReviewDialog (create/edit)
 *
 * Role:
 *   - Fetch the first page of reviews for a given album
 *   - Render the reviews list with loading/error states
 *   - Show a "Write a review" CTA that opens the ReviewDialog
 *   - Refresh the list after a successful review submission
 *
 * Deps:
 *   - fetchReviewsPage() from app/utils/reviews
 *   - ReviewsPanel for displaying review cards
 *   - ReviewDialog for creating a new review
 *   - SpotifyAlbumWithTracks for album context
 *
 * Notes:
 *   - Currently fetches a single page (page=1, pageSize=20); pagination
 *     can be added later in ReviewsPanel if needed.
 *   - album is passed through as albumSnapshot to the dialog; the dialog
 *     is responsible for normalizing this into whatever snapshot type it uses.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import ReviewsPanel from "@/app/(routes)/album/[id]/components/ReviewsPanel";
import ReviewDialog from "@/app/(routes)/album/[id]/components/ReviewDialog";
import type { SpotifyAlbumWithTracks } from "@/app/types/spotify";
import { fetchReviewsPage } from "@/app/utils/reviews";
import type { UIReview } from "@/app/utils/reviews";

export default function ReviewSection({
  albumId,
  album,
}: {
  albumId: string;
  album: SpotifyAlbumWithTracks;
}) {
  const [reviews, setReviews] = useState<UIReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchReviewsPage({ albumId, page: 1, pageSize: 20 });
    if (!res.ok) {
      setError(res.message);
      setReviews([]);
    } else {
      setReviews(res.items);
    }
    setLoading(false);
  }, [albumId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      {/* Header + centered CTA */}
      <div className="mb-4 text-center">
        <h3 className="text-xl font-semibold">Reviews</h3>
        <button
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-800 transition"
        >
          Write a review
        </button>
      </div>

      {/* Reviews list */}
      <ReviewsPanel reviews={reviews} loading={loading} error={error} />

      {/* Modal */}
      <ReviewDialog
        open={open}
        onClose={() => setOpen(false)}
        albumId={albumId}
        albumName={album.name}
        albumSnapshot={album} // raw Spotify album; dialog maps it
        onSuccess={() => {
          setOpen(false);
          refresh(); // reload after successful POST
        }}
      />
    </section>
  );
}
