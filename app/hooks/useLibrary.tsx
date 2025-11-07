"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";

export type LibraryAlbum = {
  id: string;
  title: string;
  coverUrl?: string;
  artists?: string[];
};

type LibraryMap = Record<string, LibraryAlbum>;
type Ctx = {
  isSaved: (albumId: string) => boolean;
  albums: LibraryAlbum[];
  add: (album: LibraryAlbum) => void;
  remove: (albumId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "groovo.library.v1";
const LibraryCtx = createContext<Ctx | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<LibraryMap>({});
  const hydrated = useRef(false);

  // localStorage cache (works logged out)
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (raw) setMap(JSON.parse(raw));
    } catch {}
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      }
    } catch {}
  }, [map]);

  // server hydrate (if logged in)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/library", { cache: "no-store" });
        if (res.status === 401) return; // not logged in
        if (!res.ok) return;
        const items = await res.json();
        const next: LibraryMap = {};
        for (const d of items) {
          next[d.albumId] = {
            id: d.albumId,
            title: d.title,
            coverUrl: d.coverUrl,
            artists: d.artists,
          };
        }
        setMap((prev) => ({ ...prev, ...next }));
      } catch {}
    })();
  }, []);

  const isSaved = useCallback((albumId: string) => !!map[albumId], [map]);

  const add = useCallback((album: LibraryAlbum) => {
    // optimistic
    setMap((prev) => (prev[album.id] ? prev : { ...prev, [album.id]: album }));

    // persist
    fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        albumId: album.id,
        title: album.title,
        coverUrl: album.coverUrl,
        artists: album.artists,
      }),
    }).then((r) => {
      if (!r.ok) {
        // rollback
        setMap((prev) => {
          const next = { ...prev };
          delete next[album.id];
          return next;
        });
      }
    }).catch(() => {
      setMap((prev) => {
        const next = { ...prev };
        delete next[album.id];
        return next;
      });
    });
  }, []);

  const remove = useCallback((albumId: string) => {
    const snapshot = map[albumId];
    // optimistic
    setMap((prev) => {
      if (!prev[albumId]) return prev;
      const next = { ...prev };
      delete next[albumId];
      return next;
    });

    // persist
    fetch(`/api/library/${encodeURIComponent(albumId)}`, {
      method: "DELETE",
    }).then((r) => {
      if (!r.ok) {
        // rollback
        setMap((prev) => ({ ...prev, [albumId]: snapshot }));
      }
    }).catch(() => {
      setMap((prev) => ({ ...prev, [albumId]: snapshot }));
    });
  }, [map]);

  const clear = useCallback(() => setMap({}), []);

  const value = useMemo(
    () => ({ isSaved, albums: Object.values(map), add, remove, clear }),
    [isSaved, map, add, remove, clear]
  );

  return <LibraryCtx.Provider value={value}>{children}</LibraryCtx.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryCtx);
  if (!ctx) throw new Error("useLibrary must be used within <LibraryProvider>");
  return ctx;
}
