/**
 * Purpose:
 *   Client-side data hook for loading Spotify/Last.fm album metadata.
 *
 * Scope:
 *   - Used by /album/[id] page and any component that needs full album details
 *   - Wraps the /api/album/[id] API route
 *
 * Role:
 *   - Fetch album details when albumId changes
 *   - Expose standardized loading / error / album state
 *   - Prevent unnecessary fetches (no albumId = skip)
 *
 * Deps:
 *   - /api/album/[id] route (server-side)
 *   - React state & effects
 *
 * Notes:
 *   - Makes no assumptions about Spotify vs Last.fm data shape; the server API
 *     should normalize the album object before returning it.
 *   - Hook always returns a stable shape: { album, isLoading, error }
 */

"use client";

import { useEffect, useState } from "react";
import type { SpotifyAlbumWithTracks } from "@/app/types/spotify";

export function useAlbum(albumId: string) {
  const [album, setAlbum] = useState<SpotifyAlbumWithTracks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/album/${albumId}`, {
          cache: "no-store",
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch album details");
        const data = await res.json();
        if (!canceled) setAlbum(data);
      } catch (e: any) {
        if (!canceled) setError(e?.message || "Error loading album");
      } finally {
        if (!canceled) setIsLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [albumId]);

  return { album, isLoading, error };
}
