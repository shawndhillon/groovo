"use client";

import { useEffect, useState } from "react";

type NewReleasesAlbum = {
  id: string;
  name: string;
  images?: { url: string }[];
  artists?: { name: string }[];
};

export function useNewReleases() {
  const [albums, setAlbums] = useState<NewReleasesAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/new-album-releases?market=US&limit=5")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setAlbums(d.items || []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { albums, loading };
}
