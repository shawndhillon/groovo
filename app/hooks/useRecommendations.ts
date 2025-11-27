"use client";

import { useEffect, useState } from "react";

type AlbumRecommendation = {
  albumId: string;
  name: string;
  artists: { id?: string; name: string }[];
  imageUrl?: string;
  spotifyUrl?: string;
  reason?: string;
};

type UseRecommendationsState = {
  data: AlbumRecommendation[] | null;
  isLoading: boolean;
  isError: boolean;
};

export function useRecommendations(): UseRecommendationsState {
  const [data, setData] = useState<AlbumRecommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const res = await fetch("/api/recommendations", {
          cache: "no-store",
        });

        if (res.status === 401) {
          // Not logged in → just treat as “no recs”
          if (!cancelled) {
            setData([]);
            setIsLoading(false);
          }
          return;
        }

        if (!res.ok) {
          console.error("Recommendations API failed with status", res.status);
          if (!cancelled) {
            setIsError(true);
            setIsLoading(false);
          }
          return;
        }

        const json = await res.json();
        if (!cancelled) {
          setData(json.recommendations ?? []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, isError };
}