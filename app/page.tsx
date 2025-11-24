"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Header from "./components/Header";
import FeedReviewCard from "./components/home/FeedReviewCard";
import TopAlbumsSection from "./components/home/TopAlbumsSection";
import GenreSelector from "./components/GenreSelector";
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
  
  // ----- NEW: Genre-based top albums state -----
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genreAlbums, setGenreAlbums] = useState<any[]>([]);
  const [genreLoading, setGenreLoading] = useState(false);
  const [showGenreSelector, setShowGenreSelector] = useState(false);
  const [genrePage, setGenrePage] = useState(1);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(false);
  const [albumsPerPage, setAlbumsPerPage] = useState(25);
  
  // Fetch albums when genre is selected, page changes, or # albums changes
  useEffect(() => {
    if (!selectedGenre) {
      setGenreAlbums([]);
      setHasMoreAlbums(false);
      return;
    }

    setGenreLoading(true);
    const limit = Math.min(albumsPerPage, 100);

    fetch(
      `/api/trending-albums-by-genre?genre=${encodeURIComponent(
        selectedGenre,
      )}&limit=${limit}&page=${genrePage}`,
    )
      .then(async (r) => {
        if (!r.ok) {
          try {
            const err = await r.json();
            console.error("API error:", err.error || err.message || err);
            setGenreAlbums([]);
            setHasMoreAlbums(false);
            return;
          } catch {
            console.error("API error: HTTP", r.status, r.statusText);
            setGenreAlbums([]);
            setHasMoreAlbums(false);
            return;
          }
        }
        return r.json();
      })
      .then((d) => {
        if (d && Array.isArray(d.items) && d.items.length > 0) {
          // Dedupe albums by id
          const seen = new Set<string>();
          const uniqueAlbums = d.items.filter((album: any) => {
            if (seen.has(album.id)) return false;
            seen.add(album.id);
            return true;
          });
          setGenreAlbums(uniqueAlbums);
          setHasMoreAlbums(d.hasMore || false);
        } else {
          setGenreAlbums([]);
          setHasMoreAlbums(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching genre albums:", err);
        setGenreAlbums([]);
        setHasMoreAlbums(false);
      })
      .finally(() => setGenreLoading(false));
  }, [selectedGenre, genrePage, albumsPerPage]);

  // Reset page when genre or # albums changes
  useEffect(() => {
    setGenrePage(1);
    setGenreAlbums([]);
  }, [selectedGenre, albumsPerPage]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />
      {/* Top releases */}
      <TopAlbumsSection />

      {/* ---- NEW FEATURE: Top Albums by Genre ---- */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Top Albums by Genre</h2>

          {selectedGenre ? (
            <button
              onClick={() => setShowGenreSelector(true)}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}
            </button>
          ) : (
            <button
              onClick={() => setShowGenreSelector(true)}
              className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
            >
              Select Genre
            </button>
          )}
        </div>

        {genreLoading ? (
          <p className="text-sm text-zinc-400">Loading albums…</p>
        ) : !selectedGenre ? (
          <div className="rounded-lg border border-white/10 bg-zinc-900/60 px-6 py-8 text-center">
            <p className="mb-4 text-sm text-zinc-400">
              Select a genre to see top albums.
            </p>
            <button
              onClick={() => setShowGenreSelector(true)}
              className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Choose Genre
            </button>
          </div>
        ) : genreAlbums.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No albums found for this genre.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {genreAlbums.map((album: any) => (
                <Link
                  key={album.id}
                  href={`/album/${encodeURIComponent(album.id)}`}
                  className="rounded-lg bg-zinc-800 p-2 transition hover:bg-zinc-700"
                >
                  <img
                    src={
                      album.images?.[0]?.url ||
                      album.images?.[album.images.length - 1]?.url ||
                      "/placeholder-album.svg"
                    }
                    alt={album.name}
                    className="mb-2 aspect-square w-full rounded-md object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes("placeholder-album.svg")) {
                        target.src = "/placeholder-album.svg";
                      }
                    }}
                  />
                  <div className="text-sm font-medium">{album.name}</div>
                  <div className="text-xs text-zinc-400">
                    {album.artists?.map((x: any) => x.name).join(", ") ||
                      "Unknown Artist"}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              {/* Previous page */}
              <button
                onClick={() => setGenrePage((prev) => Math.max(1, prev - 1))}
                disabled={genrePage === 1 || genreLoading}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/60 px-6 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-zinc-800/60"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>

              {/* Page + albums-per-page info */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800/40 px-4 py-2">
                <span className="text-sm font-medium text-zinc-300">
                  Page <span className="text-white">{genrePage}</span>
                </span>
                <span className="mx-1 text-zinc-600">•</span>
                <span className="text-xs text-zinc-400">Showing</span>
                <span className="text-sm font-medium text-white">
                  {genreAlbums.length}
                </span>
                <span className="text-xs text-zinc-400">albums</span>
                <span className="mx-1 text-zinc-600">•</span>
                <select
                  id="albums-per-page"
                  value={albumsPerPage}
                  onChange={(e) =>
                    setAlbumsPerPage(parseInt(e.target.value, 10))
                  }
                  className="cursor-pointer appearance-none rounded-md border border-violet-500/30 bg-zinc-800/60 px-3 py-1 text-sm font-medium text-white outline-none transition-all focus:border-violet-500 bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23a855f7%22 stroke-width=%222.5%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right hover:bg-zinc-700/60 hover:border-violet-500/50"
                  style={{
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1rem",
                    paddingRight: "2rem",
                  }}
                >
                  {![5, 10, 25, 50].includes(albumsPerPage) && (
                    <option value={albumsPerPage}>{albumsPerPage}</option>
                  )}
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Next page */}
              <button
                onClick={() => setGenrePage((prev) => prev + 1)}
                disabled={!hasMoreAlbums || genreLoading}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-violet-600"
              >
                Next
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {genreLoading && (
              <div className="mt-4 text-center text-sm text-zinc-400">
                Loading albums...
              </div>
            )}
          </>
        )}
      </div>

      {/* Genre Selector modal */}
      {showGenreSelector && (
        <GenreSelector
          onClose={() => setShowGenreSelector(false)}
          onSelect={(genre) => {
            setSelectedGenre(genre);
            setShowGenreSelector(false);
          }}
          currentGenre={selectedGenre || undefined}
          albumsPerPage={albumsPerPage}
          onAlbumsPerPageChange={setAlbumsPerPage}
        />
      )}

      {/* ----- Existing Feed section (unchanged) ----- */}
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
    </>
  );
}
