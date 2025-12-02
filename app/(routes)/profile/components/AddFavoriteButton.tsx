/**
 * Purpose:
 *   Button for adding an album to the user's Top Favorites (Top 5) list.
 *
 * Scope:
 *   - Used anywhere an album tile appears (e.g., reviews grid, search, etc.)
 *   - Client-only component
 *
 * Role:
 *   - Fetch current Top Favorites and check for duplicates
 *   - Enforce the "maximum 5" constraint
 *   - Save new Top Favorites list when updating
 *   - Emit a global "favorites:updated" event so hooks can refresh
 *
 * Deps:
 *   - React useState
 *   - app/utils/albumCollections for fetchTopFavorites and saveTopFavorites
 *
 * Notes:
 *   - If the album is already in Top Favorites, the button just marks it
 *     as added and still emits "favorites:updated".
 */

"use client";

import { useState } from "react";
import {
  fetchTopFavorites,
  saveTopFavorites,
  type TopFavoriteItem,
} from "@/app/utils/albumCollections";

export default function AddFavoriteButton({
  albumId,
  className = "",
  label = "Add to Top 5",
}: {
  albumId: string;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);

    try {
      const currentApi = await fetchTopFavorites();

      // Normalize to the simple PUT payload shape
      const current: TopFavoriteItem[] = currentApi.map((item) => ({
        rank: item.rank,
        albumId: item.albumId,
      }));

      // Already present? Mark as added and emit event
      if (current.some((f) => f.albumId === albumId)) {
        setAdded(true);
        window.dispatchEvent(new CustomEvent("favorites:updated"));
        return;
      }

      // Enforce max 5
      if (current.length >= 5) {
        throw new Error("Top 5 is full. Remove one before adding another.");
      }

      // Determine next rank (1..5) based on current length
      const nextRank = current.length + 1;
      const updated: TopFavoriteItem[] = [
        ...current,
        { rank: nextRank, albumId },
      ];

      await saveTopFavorites(updated);
      setAdded(true);

      // Let subscribers refresh their Top Favorites
      window.dispatchEvent(new CustomEvent("favorites:updated"));
    } catch (e: any) {
      setError(e.message || "Failed to add favorite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <button
        onClick={onClick}
        disabled={busy || added}
        className={`rounded-lg px-3 py-1 text-sm font-medium transition
          ${
            added
              ? "bg-green-600 text-white"
              : "bg-violet-600 hover:bg-violet-700 text-white"
          }
          disabled:opacity-60`}
        aria-disabled={busy || added}
      >
        {busy ? "Adding…" : added ? "Added ✓" : label}
      </button>
      {error && <span className="mt-1 text-xs text-red-300">{error}</span>}
    </div>
  );
}
