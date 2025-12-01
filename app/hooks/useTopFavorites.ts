/**
 * Purpose:
 *   React hook for reading and refreshing a user's Top Favorites (Top 5).
 *
 * Scope:
 *   - Used in profile-related client components that show a Top 5 list
 *   - Supports current user (no userId) and explicit userId
 *
 * Role:
 *   - Fetch Top Favorites via fetchTopFavorites(userId?)
 *   - Expose loading / error state and a manual refresh() function
 *   - Automatically refresh when "favorites:updated" is fired
 *
 * Notes:
 *   - When userId changes (e.g., navigating to a different profile),
 *     the hook will refetch automatically.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchTopFavorites,
  type TopFavoriteApiItem,
} from "@/app/utils/albumCollections";

export type UseTopFavoritesState = {
  items: TopFavoriteApiItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useTopFavorites(userId?: string): UseTopFavoritesState {
  const [items, setItems] = useState<TopFavoriteApiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const favorites = await fetchTopFavorites(userId);
      setItems(favorites);
    } catch (e: any) {
      setError(e?.message || "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();

    const handler = () => {
      void refresh();
    };

    window.addEventListener("favorites:updated", handler);
    return () => window.removeEventListener("favorites:updated", handler);
  }, [refresh]);

  return { items, loading, error, refresh };
}
