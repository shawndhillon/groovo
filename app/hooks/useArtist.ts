"use client";

import { useEffect, useState } from "react";

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: { url: string; height?: number; width?: number }[];
  total_tracks: number;
  release_date: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height?: number; width?: number }[];
  genres: string[];
  popularity: number;
  followers: number;
  external_urls: { spotify: string };
  topTracks: {
    id: string;
    name: string;
    album: {
      id: string;
      name: string;
      images: { url: string; height?: number; width?: number }[];
    };
    external_urls: { spotify: string };
    preview_url: string | null;
    popularity: number;
  }[];
  albums: SpotifyAlbum[];
}

export function useArtist(artistId: string) {
  const [artist, setArtist] = useState<SpotifyArtist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artistId) return;

    let canceled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/artist/${artistId}`, {
          cache: "no-store",
          headers: { accept: "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch artist details");

        const data = await res.json();
        if (!canceled) setArtist(data);
      } catch (e: any) {
        if (!canceled) setError(e?.message || "Error loading artist");
      } finally {
        if (!canceled) setIsLoading(false);
      }
    }

    load();

    return () => {
      canceled = true;
    };
  }, [artistId]);

  return { artist, isLoading, error };
}
