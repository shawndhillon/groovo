"use client";

import { useCallback, useEffect, useState } from "react";
import { FavoriteApiItem, getFavoritesTop5 } from "@/app/utils/top5";

export function useFavoritesTop5(userId?: string) {
  const [items, setItems] = useState<FavoriteApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFavoritesTop5(userId);
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load favorites");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("favorites:updated", handler);
    return () => window.removeEventListener("favorites:updated", handler);
  }, [refresh]);

  return { items, loading, error, refresh, setItems };
}
