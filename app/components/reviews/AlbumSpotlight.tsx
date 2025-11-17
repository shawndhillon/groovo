"use client";

/**
 * AlbumSpotlight Component
 *
 * Purpose
 * -------
 * Displays a compact, visually focused card summarizing the album associated
 * with a review. It shows:
 * - Album cover art
 * - Album name
 * - List of artists
 * - Optional link to the album detail page (`/album/[albumId]`)
 *
 * This component is used on the Review Details page and is intended to stay
 * strictly presentational — it does not fetch data or manage state. All album
 * information should be prepared in the parent or in hooks like
 * `useReviewDetails`.
 *
 * When to modify this file:
 * -------------------------
 * - If you want to change the layout/design of the spotlight card
 * - If album metadata expands (e.g., release year, genres)
 * - If you want to add actions (save album, follow artist, etc.)
 */
import Link from "next/link";

interface AlbumSpotlightProps {
  albumId: string | null;
  coverUrl: string;
  albumName: string;
  albumArtists: string;
}

/**
 * Renders the album summary card used within a review page.
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
        <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
          <img
            src={coverUrl}
            alt={`${albumName} cover art`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold text-white">{albumName}</h3>
            <p className="text-sm text-zinc-400">{albumArtists}</p>
          </div>

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
