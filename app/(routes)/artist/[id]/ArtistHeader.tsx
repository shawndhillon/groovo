/**
 * ArtistHeader Component
 * ----------------------
 * Displays the top section of an artist page, including:
 * - Artist photo
 * - Name
 * - Followers count
 * - Top genres (up to 3)
 * - Link to the artist's Spotify page
 * - Back button that uses Next.js router navigation
 *
 * Props:
 * - artist: SpotifyArtist object containing metadata for the selected artist.
 *
 * Notes:
 * - Used by the ArtistPage component.
 * - Assumes the artist object is already validated and loaded.
 */

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SpotifyArtist } from "@/app/hooks/useArtist";

interface ArtistHeaderProps {
  artist: SpotifyArtist;
}

export default function ArtistHeader({ artist }: ArtistHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row gap-8 mb-8">
      <div className="flex-shrink-0">
        <img
          src={artist.images[0]?.url || "/placeholder-artist.png"}
          alt={artist.name}
          className="w-full md:w-80 rounded-lg shadow-2xl"
        />
      </div>

      <div className="flex-1">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition"
          aria-label="Go back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">{artist.name}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-zinc-400 mb-6">
          <span>{artist.followers.toLocaleString()} Spotify followers</span>
          {artist.genres.length > 0 && (
            <>
              <span>•</span>
              <span>{artist.genres.slice(0, 3).join(", ")}</span>
            </>
          )}
        </div>

        <div className="flex gap-4">
          <a
            href={artist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-6 py-3 text-sm font-medium text-white hover:bg-violet-600 transition"
          >
            View on Spotify
          </a>
        </div>
      </div>
    </div>
  );
}
