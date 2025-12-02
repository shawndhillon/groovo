/**
 * Purpose:
 *   Display a scrollable list of album reviews with built-in loading,
 *   error, and empty states.
 *
 * Scope:
 *   - Used inside ReviewSection on album pages (/album/[id])
 *   - Can be reused anywhere a read-only list of reviews is needed
 *
 * Role:
 *   - Render review cards (date, rating, text, reviewer)
 *   - Provide clean fallback states based on loading, error, or empty list
 *   - Support optional max height for scroll regions
 *
 * Deps:
 *   - ShareButton for sharing review links
 *
 * Notes:
 *   - Reviews must already be normalized to the `Review` type
 *   - Does not perform pagination; parent should handle if needed
 */

import ShareButton from "@/app/components/ShareButton";
import type { UIReview } from "@/app/utils/reviews";

/**
 * Props for the ReviewsPanel component.
 *
 * @property reviews   - List of reviews in UIReview shape
 * @property title     - Optional section title (defaults to "Reviews")
 * @property maxHeight - Optional max-height for the scroll container
 * @property loading   - When true, shows a loading state
 * @property error     - When set, shows an error state
 */
interface ReviewsPanelProps {
  reviews: UIReview[];
  title?: string;
  maxHeight?: string;
  loading?: boolean;
  error?: string | null;
}

export default function ReviewsPanel({
  reviews,
  title = "Reviews",
  maxHeight = "28rem",
  loading = false,
  error = null,
}: ReviewsPanelProps) {
  // Loading State
  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-zinc-400">Loading reviews…</p>
      </section>
    );
  }
  // Error State
  if (error) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-red-400">Error: {error}</p>
      </section>
    );
  }
  // Empty State
  if (reviews.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-zinc-400">No reviews yet. Be the first!</p>
      </section>
    );
  }

  // Review List
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <ul className="space-y-4 overflow-y-auto" style={{ maxHeight }}>
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl bg-zinc-900/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                {new Date(r.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-violet-300 font-semibold">
                  ★ {r.rating}/5
                </span>

                <ShareButton
                  url={`/review/${r.id}`}
                  label="Share"
                  size="sm"
                />
              </div>
            </div>

            {/* Review text */}
            <p className="mt-2 text-sm text-zinc-100">{r.reviewText}</p>

            {/* Reviewer */}
            <p className="mt-1 text-xs text-zinc-400">by {r.userName}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
