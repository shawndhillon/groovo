// app/library/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";

type LibraryArtist = { id?: string; name?: string } | string;
type LibraryImage = { url: string; width?: number; height?: number };

type LibraryApiItem = {
  albumId: string;
  title?: string;
  coverUrl?: string;
  artists?: string[];
  // different back-end versions might use any of these:
  albumSnapshot?: {
    name?: string;
    artists?: LibraryArtist[];
    images?: LibraryImage[];
  };
  album?: {
    name?: string;
    artists?: LibraryArtist[];
    images?: LibraryImage[];
  };
  spotifyAlbum?: {
    name?: string;
    artists?: LibraryArtist[];
    images?: LibraryImage[];
  };
};

type LibraryCard = {
  albumId: string;
  name: string;
  artists: string;
  imageUrl: string;
};

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/library", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Library API error: ${res.status}`);
        }

        const json = await res.json().catch(() => ({}));

        // Support both: array response (new route) or { items: [...] } (older)
        const rawItems: LibraryApiItem[] = Array.isArray(json)
          ? json
          : Array.isArray((json as any)?.items)
          ? (json as any).items
          : [];

        const mapped: LibraryCard[] = rawItems.map((item) => {
          // Prefer snapshot-style fields but fall back to flat fields
          const snap =
            item.albumSnapshot ??
            (item as any).album ??
            (item as any).spotifyAlbum ??
            {};

          const name =
            typeof (snap as any).name === "string" &&
            (snap as any).name.trim()
              ? (snap as any).name
              : typeof item.title === "string" && item.title.trim()
              ? item.title
              : "Unknown album";

          const snapArtists: LibraryArtist[] = Array.isArray(
            (snap as any).artists
          )
            ? (snap as any).artists
            : [];

          const flatArtists: string[] = Array.isArray(item.artists)
            ? item.artists
            : [];

          const artistsSource =
            snapArtists.length > 0 ? snapArtists : flatArtists;

          const artists =
            artistsSource.length > 0
              ? artistsSource
                  .map((a) =>
                    typeof a === "string"
                      ? a
                      : (a?.name ?? "").toString()
                  )
                  .filter((s) => s.trim().length > 0)
                  .join(", ")
              : "Unknown Artist";

          const images: LibraryImage[] = Array.isArray(
            (snap as any).images
          )
            ? (snap as any).images
            : [];

          const imageUrl =
            images[0]?.url ??
            item.coverUrl ??
            "/placeholder-album.png";

          return {
            albumId: item.albumId,
            name,
            artists,
            imageUrl,
          };
        });

        if (!cancelled) {
          setItems(mapped);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load library.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top navigation / branding */}
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-bold">Your Library</h1>

          <Link
            href="/"
            className="text-sm text-gray-300 underline-offset-4 hover:underline"
          >
            ← Back to home
          </Link>
        </div>

        {loading && (
          <p className="text-sm text-gray-400">Loading your saved albums…</p>
        )}

        {error && !loading && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-gray-400">
            You don&apos;t have any albums in your library yet.
            Go add some from the album pages!
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <section>
            <div className="mb-4 text-sm text-gray-400">
              {items.length} album{items.length === 1 ? "" : "s"} saved
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <Link
                  key={item.albumId}
                  href={`/album/${item.albumId}`}
                  className="group block"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-zinc-900 shadow-md">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2">
                    <div className="truncate text-sm font-semibold">
                      {item.name}
                    </div>
                    <div className="truncate text-xs text-gray-400">
                      {item.artists}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}