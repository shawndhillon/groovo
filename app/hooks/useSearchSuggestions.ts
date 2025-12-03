/**
 * Purpose:
 *   Custom hook that is responsible for the dynamic search suggestion dropdown in the SearchBar.
 *   It debounces the raw input query, and fetches album + user suggestion
 *
 * Scope:
 *   - To fetch album suggestions from `/api/spotify?query=...`
 *   - To fetch user suggestions from `/api/users/?q=...&limit=5`
 *   - Runs whenever the debounced query changes (250ms delay)
 *   - Clears suggestions automatically if the query is empty
 *
 * Role:
 *   - Performs two parallel fetches (albums + users) with separate loading flags
 *   - Normalizes responses into AlbumHit[] and UserHit[] for the search dropdown UI
 *   - Clears suggestions automatically if the query is empty
 *   - Handles API failures by resetting the affected suggestions
 *
 * Deps:
 *   - React (useState, useEffect)
 *   - useDebouncedValue (custom hook for 250ms debouncing)
 *   - /api/spotify route (queries Spotify API for album search)
 *   - /api/users search route (internal user search → { items: UserHit[] })
 *
 * Notes:
 *   - Albums and users load independently, so this allows for partial results, e.g. albums loaded while users are still fetching
 *   - Returns the debouncedQuery so parent components can detect “no results”
 *   - Clears local state when query is empty, avoiding stale suggestions
 */

// hooks/useSearchSuggestions.ts
"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";
import type { AlbumHit, UserHit } from "@/app/types/search";

/**
 * Return shape for the useSearchSuggestions hook.
 *
 * - albums / users: current suggestion lists.
 * - loadingAlbums / loadingUsers: separate loading flags so the UI
 *   can show partial results (e.g. albums loaded, users still loading).
 * - debouncedQuery: the internally debounced version of the raw query,
 *   exposed for "No results" checks or debugging.
 */
type UseSearchSuggestionsResult = {
  albums: AlbumHit[];
  users: UserHit[];
  loadingAlbums: boolean;
  loadingUsers: boolean;
  debouncedQuery: string;
};

/**
 * useSearchSuggestions
 *
 * Central hook for search suggestions used by the SearchBar.
 * It takes the *raw* query string from the input, debounces it,
 * and then:
 *
 * 1) Fetches album suggestions from `/api/spotify?query=...`.
 * 2) Fetches user suggestions from `/api/users/?q=...&limit=5`.
 *
 * Both requests are:
 * - Triggered when `debouncedQuery` changes.
 * - Cancelled logically when the query becomes empty (we clear state).
 * - Independent: albums and users have their own loading states.
 *
 * Notes:
 * - We intentionally slice album results to the top 5 for a compact dropdown.
 * - We defensively handle unexpected responses from `/api/users` by
 *   checking that `d.items` is an array.
 *
 * @param query - The live (non-debounced) search string from the input.
 * @returns An object with albums, users, loading flags, and debouncedQuery.
 */
export function useSearchSuggestions(query: string): UseSearchSuggestionsResult {
  const debouncedQuery = useDebouncedValue(query, 250);

  const [albums, setAlbums] = useState<AlbumHit[]>([]);
  const [users, setUsers] = useState<UserHit[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  /**
   * Fetch album suggestions from the Spotify API route whenever
   * the debounced query changes.
   */
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      // If the query is cleared, also clear results.
      setAlbums([]);
      return;
    }

    setLoadingAlbums(true);

    fetch(`/api/spotify?query=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        const items: AlbumHit[] = data.albums?.items || [];
        // Limit to top 5 to keep the dropdown concise.
        setAlbums(items.slice(0, 5));
      })
      .catch(() => {
        // On error, fail gracefully and hide album suggestions.
        setAlbums([]);
      })
      .finally(() => setLoadingAlbums(false));
  }, [debouncedQuery]);

  /**
   * Fetch user suggestions from the internal users search API
   * whenever the debounced query changes.
   */
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
        // API response is expected to be { items: UserHit[] }
        const items: UserHit[] = Array.isArray(d?.items) ? d.items : [];
        setUsers(items);
      })
      .catch(() => {
        // On error, just show no users rather than crashing.
        setUsers([]);
      })
      .finally(() => setLoadingUsers(false));
  }, [debouncedQuery]);

  return { albums, users, loadingAlbums, loadingUsers, debouncedQuery };
}
