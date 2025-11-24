"use client";

import Header from "./components/Header";
import FeedReviewCard from "./components/home/FeedReviewCard";
import TopAlbumsSection from "./components/home/TopAlbumsSection";
import { useFeed } from "./hooks/useFeed";
import { getReviewId } from "./utils/feed";

export default function HomePage() {
  const {
    feedMode,
    setFeedMode,
    feedSorted,
    feedLoading,
    feedError,
    isAuthed,
  } = useFeed();

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />
      {/* Top releases */}
      <TopAlbumsSection />

      {/* Feed */}
      <div className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Feed</h2>
          {isAuthed && (
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/60 p-1 border border-white/10">
              <button
                onClick={() => setFeedMode("following")}
                aria-pressed={feedMode === "following"}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  feedMode === "following"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Following
              </button>
              <button
                onClick={() => setFeedMode("global")}
                aria-pressed={feedMode === "global"}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  feedMode === "global"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Global
              </button>
            </div>
          )}
        </div>

        {feedLoading && (
          <div className="mt-4 text-sm text-zinc-400">Loading your feed…</div>
        )}

        {!feedLoading && feedError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {feedError}
          </div>
        )}

        {!feedLoading && isAuthed === false && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/60 px-6 py-6">
            <p className="text-sm text-zinc-300">
              Sign in and follow people to see detailed reviews here.
            </p>
            <div className="mt-3">
              <a
                href="/login"
                className="inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
              >
                Sign in
              </a>
            </div>
          </div>
        )}

        {!feedLoading && isAuthed !== false && feedSorted.length === 0 && (
          <div className="mt-4 text-sm text-zinc-400">
            No reviews yet. Follow some users or write your first review!
          </div>
        )}

        {!feedLoading && feedSorted.length > 0 && (
          <ul className="mt-6 space-y-6">
            {feedSorted.map((r) => {
              const reviewId = getReviewId(r);
              return (
                <FeedReviewCard
                  key={reviewId}
                  review={r}
                  reviewId={reviewId}
                />
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
