"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewReleases() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/new-album-releases?market=US&limit=5")
      .then(r => r.json())
      .then(d => setAlbums(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-violet-500" />
            <span className="text-lg font-semibold tracking-tight">Groovo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/discover" 
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Discover
            </Link>
            <Link 
              href="/profile" 
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
      <h1 className="mb-4 text-2xl font-semibold">Top New Releases</h1>
      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {albums.map(a => (
            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700">
              <img src={a.images?.[0]?.url} alt={a.name} className="mb-2 w-full rounded-md" />
              <div className="text-sm font-medium">{a.name}</div>
              <div className="text-xs text-zinc-400">
                {a.artists?.map((x:any) => x.name).join(", ")}
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
