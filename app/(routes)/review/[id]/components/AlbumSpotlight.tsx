/**
 * Purpose:
 *   Compact visual card that displays the album tied to a review.
 *
 * Scope:
 *   - Used exclusively on the Review Details page: /review/[id]
 *   - Pure presentational component (no fetching, no state)
 *
 * Responsibilities:
 *   - Show album cover art
 *   - Show album name + artists
 *   - Provide optional link to `/album/[albumId]`
 *
 * Deps:
 *   - next/link
 *
 * Notes:
 *   - All data (cover, artists, name) must be prepared upstream
 *     via useReviewDetails or parent component.
 *   - If you add more album metadata (year, genres, label) it can
 *     be added safely here without changing upstream logic.
 */

"use client";

import Link from "next/link";

interface AlbumSpotlightProps {
  albumId: string | null;
  coverUrl: string;
  albumName: string;
  albumArtists: string;
}

/**
 * Album Spotlight
 */
export function AlbumSpotlight({
  albumId,
  coverUrl,
  albumName,
  albumArtists,
}: AlbumSpotlightProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-200">Album Spotlight</h2>
      <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-black/30 p-4 sm:flex-row">
        {/* Cover Art */}
        <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
          <img
            src={coverUrl}
            alt={`${albumName} cover art`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Album Meta */}
        <div className="flex flex-1 flex-col justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold text-white">{albumName}</h3>
            <p className="text-sm text-zinc-400">{albumArtists}</p>
          </div>

          {/* CTA: Link to album page */}
          {albumId && (
            <Link
              href={`/album/${albumId}`}
              className="inline-flex w-max items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-800"
            >
              View album details
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
