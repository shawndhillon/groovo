// components/SearchBar.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchSuggestions } from "@/app/hooks/useSearchSuggestions";
import type { AlbumHit, UserHit } from "@/app/types/search";

/**
 * SearchBar
 *
 * Reusable search component (typically used in the header) that supports:
 * - Live search suggestions for albums (Spotify) and users (internal API).
 * - Debounced API calls to avoid spamming the backend while typing.
 * - Keyboard search via Enter → navigates to the /discover page.
 * - Click-outside behavior to close the dropdown.
 *
 * Data flow:
 * - The input maintains a `query` state (live user input).
 * - `useSearchSuggestions(query)` handles debouncing and fetching:
 *   - Returns `albums`, `users`, and loading flags.
 * - Search suggestions are rendered in a dropdown under the input.
 *   - Clicking an album → `/album/[id]`
 *   - Clicking a user → `/profile/user/[id]`
 *   - "View all results" → `/discover?query=...`
 *
 * UX details:
 * - Dropdown opens when results arrive, or when the input is focused and
 *   we still have old results.
 * - Dropdown closes on:
 *   - Clicking outside the container.
 *   - Navigating via a suggestion.
 *   - Pressing Escape.
 */
export default function SearchBar() {
  const router = useRouter();

  /**
   * Local input state.
   * This is the raw, immediately updated value as the user types.
   */
  const [query, setQuery] = useState("");

  /**
   * Ref used to detect clicks outside the search area.
   */
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * useSearchSuggestions encapsulates the debounced search logic and
   * remote API calls.
   */
  const {
    albums,
    users,
    loadingAlbums,
    loadingUsers,
    debouncedQuery,
  } = useSearchSuggestions(query);

  /**
   * Controls visibility of the suggestion dropdown.
   */
  const [open, setOpen] = useState(false);

  const hasAny = albums.length > 0 || users.length > 0;
  const loading = loadingAlbums || loadingUsers;

  /**
   * Global click handler: close dropdown when clicking outside
   * the SearchBar container.
   */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /**
   * Key handling for the search input:
   * - Enter: navigate to /discover with the current query.
   * - Escape: close the suggestion dropdown.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/discover?query=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }

    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      {/* Search Input */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => hasAny && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search albums, artists, or users..."
        className="w-full rounded-lg border border-white/10 bg-zinc-800/90 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
      />

      {/* Suggestion Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Loading state (albums or users still fetching) */}
          {loading && (
            <div className="px-4 py-3 text-sm text-zinc-400">Searching…</div>
          )}

          {/* Album Results */}
          {!loading &&
            albums.map((album: AlbumHit) => (
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
                  <div className="text-sm text-white truncate">{album.name}</div>
                  <div className="text-xs text-zinc-400 truncate">
                    {album.artists?.[0]?.name}
                  </div>
                </div>
              </Link>
            ))}

          {/* User Results */}
          {users.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
                Users
              </div>
              {users.map((u: UserHit) => (
                <Link
                  key={u.id}
                  href={`/profile/user/${u.id}`}
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
                    {u.name && (
                      <div className="text-xs text-zinc-400 truncate">{u.name}</div>
                    )}
                  </div>
                </Link>
              ))}
              <div className="border-t border-white/10" />
            </>
          )}

          {/* Empty state when search completes with no matches */}
          {!loading && !hasAny && debouncedQuery && (
            <div className="px-4 py-3 text-sm text-zinc-400">
              No results found.
            </div>
          )}

          {/* Footer with "View all results" CTA and keyboard hints */}
          {hasAny && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
              <button
                onClick={() => {
                  if (!query.trim()) return;
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
