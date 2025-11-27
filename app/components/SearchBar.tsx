"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Simple debounce hook to prevent excessive API calls
function useDebouncedValue(value: string, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

type UserHit = {
  id: string;
  username: string;
  name?: string | null;
  image?: string | null;
};

export default function SearchBar() {
  const router = useRouter();

  // --- state variables ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<UserHit[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 250); // wait 250ms before search
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. FETCH FUNCTIONALITY ---
  // runs every time debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    fetch(`/api/spotify?query=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        const albums = data.albums?.items || [];
        setResults(albums.slice(0, 5)); // only show top 5
        setOpen(true);
      })
      .catch(() => {
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setUsers([]);
      return;
    }

    setLoadingUsers(true);
    fetch(`/api/users/?q=${encodeURIComponent(q)}&limit=5`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((d) => {
        setUsers(Array.isArray(d?.items) ? d.items : []);
        setOpen(true);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [debouncedQuery]);

  // --- 2. CLOSE DROPDOWN WHEN CLICKING OUTSIDE ---
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // --- 3. HANDLE ENTER KEY ---
  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/discover?query=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  const hasAny = results.length > 0 || users.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      {/* Search Input */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => (results.length > 0 || users.length > 0) && setOpen(true)}
        onKeyDown={handleEnter}
        placeholder="Search albums, artists, or users..."
        className="w-full rounded-lg border border-white/10 bg-zinc-800/90 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
      />


      {/* Dropdown Results */}
      {open && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-xl overflow-hidden">
          {(loading || loadingUsers) && (
            <div className="px-4 py-3 text-sm text-zinc-400">Searching…</div>
          )}



          {!loading &&
            results.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/80 transition"
                onClick={() => setOpen(false)}
              >
                <img
                  src={album.images?.[0]?.url}
                  alt={album.name}
                  className="h-10 w-10 rounded object-cover"
                />
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">
                    {album.name}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {album.artists?.[0]?.name}
                  </div>
                </div>
              </Link>
            ))}

          {!loadingUsers && users.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
                Users
              </div>
              {users.map((u) => (
                <Link
                  key={u.id}
                  href={`/profile/user/${u.id}`}   // ⬅️ was `/u/${u.id}`
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/80 transition"
                  onClick={() => setOpen(false)}
                >
                  <img
                    src={u.image || "/avatar.svg"}
                    alt={u.username}
                    className="h-8 w-8 rounded-full object-cover bg-zinc-800"
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">@{u.username}</div>
                    {u.name ? <div className="text-xs text-zinc-400 truncate">{u.name}</div> : null}
                  </div>
                </Link>
              ))}
              <div className="border-t border-white/10" />
            </>
          )}

          {!loading && !loadingUsers && !hasAny && debouncedQuery && (
            <div className="px-4 py-3 text-sm text-zinc-400">
              No results found.
            </div>
          )}

          {/* Footer */}
          {(results.length > 0 || users.length > 0) && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
              <button
                onClick={() => {
                  router.push(`/discover?query=${encodeURIComponent(query.trim())}`);
                  setOpen(false);
                }}
                className="text-xs text-violet-300 hover:text-violet-200 transition"
              >
                View all results
              </button>
              <span className="text-[11px] text-zinc-500">
                Enter to search • Esc to close
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
