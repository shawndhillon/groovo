// components/ReviewsPanel.tsx
import ShareButton from "./ShareButton";

export type Review = {
  id: string;
  userName: string;
  rating: number;
  reviewText: string;
  createdAt: string; // ISO date
};

interface ReviewsPanelProps {
  reviews: Review[];
  title?: string;
  maxHeight?: string;
  /** optional states */
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
  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-zinc-400">Loading reviews…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-red-400">Error: {error}</p>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-zinc-400">No reviews yet. Be the first!</p>
      </section>
    );
  }

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
                <span className="text-violet-300 font-semibold">★ {r.rating}/5</span>
                <ShareButton
                  url={`/review/${r.id}`}
                  label="Share"
                  size="sm"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-100">{r.reviewText}</p>
            <p className="mt-1 text-xs text-zinc-400">by {r.userName}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
