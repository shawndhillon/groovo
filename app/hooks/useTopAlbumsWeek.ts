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
