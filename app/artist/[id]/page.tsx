"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import ArtistHeader from "./ArtistHeader";
import ArtistAlbums from "./ArtistAlbums";
import { useArtist } from "../../hooks/useArtist";

interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const [artistId, setArtistId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setArtistId(id));
  }, [params]);

  const { artist, isLoading, error } = useArtist(artistId ?? "");

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

            {/* Middle Row: Albums + Recent Reviews */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              {/* Left: Albums */}
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
