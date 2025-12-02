/**
 * Purpose:
 *   Album detail page which displays metadata, tracklist, and user reviews.
 *
 * Scope:
 *   - Route: /album/[id]
 *   - Client component using useAlbum() to fetch album details
 *
 * Role:
 *   - Resolve dynamic album ID from params
 *   - Fetch album metadata via useAlbum()
 *   - Render:
 *       • AlbumHeader (cover, title, artist, metadata)
 *       • AddToLibraryButton
 *       • CompactTracklist
 *       • ReviewSection (full review list + create review)
 *
 * Deps:
 *   - useAlbum hook for album lookup
 *   - AlbumHeader: top-level album info component
 *   - CompactTracklist: limited track display
 *   - ReviewSection: user reviews section
 *
 * Notes:
 *   - params is a Promise (due to async dynamic layout) so we resolve manually
 *   - Page renders loading, error, or full album UI
 */

"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";

import AlbumHeader from "./components/AlbumHeader";
import CompactTracklist from "./components/CompactTracklist";
import ReviewSection from "./components/ReviewSection";

import { useAlbum } from "@/app/hooks/useAlbum";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export default function AlbumPage({ params }: AlbumPageProps) {
  const [albumId, setAlbumId] = useState<string | null>(null);

  /**
   * Extract the album ID from the params Promise.
   *
   * @returns {void}
   */
  useEffect(() => {
    params.then(({ id }) => setAlbumId(id));
  }, [params]);

  const { album, isLoading, error } = useAlbum(albumId ?? "");

  // Wait until albumId is known before rendering anything.
  if (!albumId) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-8">
        {/* Loading State */}
        {isLoading && <div className="text-zinc-400 py-10">Loading album…</div>}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-red-400 py-10">{error}</div>
        )}

        {/* Main Album Content */}
        {album && (
          <>
            {/* TOP ROW: Album Header + Tracklist */}
            <div className="grid grid-cols-[1fr_0.4fr] gap-6 items-start">
              {/* Left: Album Header + Add to Library */}
              <div className="w-full">
                <AlbumHeader album={album} />
              </div>

              {/* Right: Tracklist */}
              <div className="w-full max-w-sm">
                <CompactTracklist
                  tracks={album.tracks.items}
                  total={album.tracks.total}
                  limit={30}
                />
              </div>
            </div>

            {/* BOTTOM: Reviews */}
            <div className="w-full">
              <ReviewSection albumId={albumId} album={album} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
