"use client";

import { useEffect, useMemo, useState } from "react";
import type { BatchUser, FeedItem, FeedMode } from "@/app/types/feed";

export function useFeed(initialMode: FeedMode = "following") {
  const [feedMode, setFeedMode] = useState<FeedMode>(initialMode);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [fetchedUserIds, setFetchedUserIds] = useState<Set<string>>(new Set());

  // 1) Fetch feed based on mode
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setFeedLoading(true);
      setFeedError(null);

      try {
        const url =
          feedMode === "global"
            ? "/api/reviews?global=true&page=1&pageSize=20"
            : "/api/feed?page=1&pageSize=20";

        const r = await fetch(url, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (r.status === 401) {
          if (!cancelled) {
            setIsAuthed(false);
            setFeed([]);
          }
          return;
        }

        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);

        if (!cancelled) {
          setIsAuthed(true);
          setFeed(Array.isArray(j?.items) ? (j.items as FeedItem[]) : []);
          setFetchedUserIds(new Set()); // reset batch-cache
        }
      } catch (e: any) {
        if (!cancelled) {
          setFeedError(e?.message || "Failed to load feed");
        }
      } finally {
        if (!cancelled) {
          setFeedLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [feedMode]);

  // 2) Hydrate missing author info with batch user lookup
  useEffect(() => {
    const missing = Array.from(
      new Set(
        feed
          .filter((r) => {
            const uid = (r.author?.id || r.userId) as string;
            return uid && !r.author?.username && !fetchedUserIds.has(uid);
          })
          .map((r) => (r.author?.id || r.userId) as string)
          .filter(Boolean)
      )
    );

    if (missing.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/users/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ ids: missing }),
        });

        if (!res.ok) return;

        const data = (await res.json().catch(() => ({}))) as {
          items?: BatchUser[];
        };

        const byId = new Map<string, BatchUser>();
        (data.items || []).forEach((u) => byId.set(u.id, u));

        if (cancelled) return;

        setFetchedUserIds((prev) => {
          const next = new Set(prev);
          missing.forEach((id) => next.add(id));
          return next;
        });

        setFeed((prev) =>
          prev.map((r) => {
            const uid = (r.author?.id as string) || r.userId;
            const fromBatch = uid ? byId.get(uid) : undefined;
            if (!fromBatch) return r;

            return {
              ...r,
              author: {
                id: uid,
                username: fromBatch.username ?? r.author?.username ?? null,
                name: fromBatch.name ?? r.author?.name ?? null,
                image: fromBatch.image ?? r.author?.image ?? null,
              },
            };
          })
        );
      } catch {
        // silent fail for hydration
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [feed, fetchedUserIds]);

  const feedSorted = useMemo(
    () =>
      [...feed].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [feed]
  );

  return {
    feedMode,
    setFeedMode,
    feed,
    feedSorted,
    feedLoading,
    feedError,
    isAuthed,
  };
}
