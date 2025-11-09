// app/hooks/useUserReviews.ts
"use client";

import { useEffect, useRef, useState } from "react";

export interface ReviewApiItem {
  _id: string;
  userId: string;
  albumId: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  albumSnapshot?: {
    name: string;
    artists: Array<{ id: string; name: string }>;
    images: Array<{ url: string; width: number; height: number }>;
  };
}

interface UseUserReviewsResult {
  items: ReviewApiItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetch all reviews by userId.
 * If userId is null/undefined, the hook becomes a no-op but is still called,
 * preserving hook order in the parent component.
 */
export function useUserReviews(
  userId: string | null | undefined,
  page = 1,
  pageSize = 20
): UseUserReviewsResult {
  const [items, setItems] = useState<ReviewApiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // No userId yet → no request, reset to idle state.
    if (!userId) {
      abortRef.current?.abort();
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const url = new URL("/api/reviews", window.location.origin);
    url.searchParams.set("userId", userId);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));

    fetch(url.toString(), { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Failed to load reviews");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [userId, page, pageSize]);

  return { items, loading, error };
}
