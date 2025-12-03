/**
 * Purpose:
 *   Custom hook for fetching the current week's top albums from the /api/top-albums-week endpoint and mapping them into a UI-friendly format.
 *
 * Scope:
 *   - Loads cached Billboard Top Albums data from the backend
 *   - Converts BillboardAlbum objects into NewReleasesAlbum objects using mapBillboardToNewReleases for consistent UI usage
 *   - Provides loading, error, and album states for homepage and discovery pages
 *
 * Role:
 *   - Triggers a single API request on mounting the app itself to retrieve this week's top albums
 *   - Handles request cancellation to prevent state updates after unmount
 *   - Returns a stable interface of the format - { albums, isLoading, isError }
 *
 * Deps:
 *   - React (useState, useEffect)
 *   - /app/utils/topAlbums (backend route for Billboard → Spotify pipeline)
 *   - mapBillboardToNewReleases utility for reshaping raw Billboard data
 *
 * Notes:
 *   - Sets albums to [] on failure so UI components don't break when there's no data
 *   - Errors are surfaced to the caller as human-readable strings
 *   - Designed to run only once on component mount (doesn't update while using the webapp essentially)
 */

// app/hooks/useTopAlbumsWeek.ts
"use client";

import { useEffect, useState } from "react";
import {
  type BillboardAlbum,
  type NewReleasesAlbum,
  mapBillboardToNewReleases,
} from "@/app/utils/topAlbums";

type UseTopAlbumsWeekResult = {
  albums: NewReleasesAlbum[];
  isLoading: boolean;
  isError: string | null;
};

export function useTopAlbumsWeek(): UseTopAlbumsWeekResult {
  const [albums, setAlbums] = useState<NewReleasesAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTopAlbums() {
      try {
        setIsLoading(true);
        setIsError(null);

        const res = await fetch("/api/top-albums-week");

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const raw: BillboardAlbum[] = await res.json();
        const mapped = mapBillboardToNewReleases(raw);

        if (!cancelled) {
          setAlbums(mapped);
        }
      } catch (err: any) {
        console.error("Failed to load top albums", err);
        if (!cancelled) {
          setIsError(err?.message ?? "Unknown error");
          setAlbums([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTopAlbums();

    return () => {
      cancelled = true;
    };
  }, []);

  return { albums, isLoading, isError };
}
