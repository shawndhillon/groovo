/**
 * Purpose:
 *   Artist detail page showing an individual artist’s profile and discography.
 *
 * Scope:
 *   - Dynamic route: /artist/[id]
 *   - Client component (uses client-side hooks, suspense params, async init)
 *   - Displays artist metadata, header section, and full album list
 *
 * Role:
 *   - Resolves the artist ID from the incoming Next.js `params` promise
 *   - Fetches artist data via useArtist(id)
 *   - Renders the primary artist header (image, name, followers, genres)
 *   - Renders discography content through the ArtistAlbums component
 *
 * Deps:
 *   - next/navigation (implicit): params is delivered from the route segment
 *   - app/components/Header: site-wide navigation / branding
 *   - useArtist: fetches artist profile + albums from backend or Spotify API
 *   - ArtistHeader: reusable artist hero banner with avatar + metadata
 *   - ArtistAlbums: lists album cards for the given artist
 *
 * Notes:
 *   - Because this route uses Next.js server-driven params, the component
 *     receives `params` as a promise in client components. The local useEffect
 *     resolves it and stores `artistId`.
 *   - Rendering is gated on the presence of `artistId` to prevent a flash of
 *     undefined state.
 *   - Errors and loading states are handled inline and follow app-wide styling.
 */

"use client";

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import ArtistHeader from "./ArtistHeader";
import ArtistAlbums from "./ArtistAlbums";
import { useArtist } from "@/app/hooks/useArtist";

interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

/**
 * ArtistPage
 *
 * Client-side page that resolves the artist ID from SSR params, fetches
 * artist metadata + albums, and renders the artist layout shell.
 *
 * @param {ArtistPageProps} props
 * @returns {JSX.Element | null}
 */
export default function ArtistPage({ params }: ArtistPageProps) {
  const [artistId, setArtistId] = useState<string | null>(null);

  /**
   * Resolve the dynamic route param.
   * Next.js client components receive `params` as a promise.
   */
  useEffect(() => {
    params.then(({ id }) => setArtistId(id));
  }, [params]);

  const { artist, isLoading, error } = useArtist(artistId ?? "");

  // Prevent rendering until the ID is known
  if (!artistId) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-8">
        {isLoading && <div className="text-zinc-400 py-10">Loading artist…</div>}
        {error && !isLoading && <div className="text-red-400 py-10">{error}</div>}

        {artist && (
          <>
            {/* Top Row: ArtistHeader */}
            <div className="w-full">
              <ArtistHeader artist={artist} />
            </div>

            {/* Middle Row: Albums section */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold mb-4">Albums</h2>
                <ArtistAlbums albums={artist.albums || []} />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}