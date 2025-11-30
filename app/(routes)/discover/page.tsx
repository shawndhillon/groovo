"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import { useSearchParams } from "next/navigation";

export default function Discover() {
  const searchParams = useSearchParams();
  
  // Read the "?query=..." from the URL
  const initialQuery = searchParams.get("query") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);

  // Fetch from your custom Spotify API route any time the query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    fetch(`/api/spotify?query=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        const albums = data.albums?.items || [];
        setResults(albums);
      })
      .catch((err) => console.error("Error fetching:", err));
  }, [query]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header showSearch={false} />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <h1 className="text-2xl font-bold mb-4">Discover Music</h1>

        {/* Search input so user can adjust the query */}
        <input
          className="w-full mb-6 rounded-lg border border-white/10 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an artist or album..."
        />

        {/* Results grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((album) => (
            <Link
              key={album.id}
              href={`/album/${album.id}`}
              className="group rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700 transition"
            >
              <img
                src={album.images?.[0]?.url}
                alt={album.name}
                className="rounded-md mb-2 w-full aspect-square object-cover"
              />
              <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition line-clamp-2">
                {album.name}
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-1">
                {album.artists?.[0]?.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
