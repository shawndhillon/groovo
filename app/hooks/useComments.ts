/**
 * Purpose:
 *   Client-side hook for loading, organizing, and posting comments on a review.
 *
 * Scope:
 *   - Used on album review pages to display comments and threaded replies.
 *   - Fetches top-level comments + replies from `/utils/social` files.
 *   - Handles posting new top-level comments 
 *
 * Role:
 *   - Loads comment threads for a given `reviewId` using `fetchComments()`.
 *   - Separates top-level comments from replies.
 *   - Groups replies by their parent comment.
 *   - Provides an API for posting new comments (`addTopLevel` → `postComment`).
 *
 * Deps:
 *   - `fetchComments` and `postComment` from `@/app/utils/social`.
 *   - React hooks (`useState`, `useCallback`, `useMemo`).
 *
 * Notes:
 *   - `repliesByParent` is memoized for efficient nested rendering.
 *   - On posting a comment, the hook re-loads comments to stay in sync.
 *
 * Returns:
 *   {
 *     items: CommentItem[]        // top-level comments
 *     replies: CommentItem[]      // all replies
 *     repliesByParent: Map        // replies that are grouped by parentId
 *     loading: boolean
 *     error: string | null
 *   }
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import type { CommentItem } from "@/app/utils/social";
import { fetchComments, postComment } from "@/app/utils/social";

function groupRepliesByParent(replies: CommentItem[]) {
  const map = new Map<string, CommentItem[]>();

  for (const r of replies) {
    if (!r.parentId) continue;
    const key = String(r.parentId);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  for (const [, arr] of map) {
    arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }

  return map;
}

export function useComments(reviewId: string) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [replies, setReplies] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!reviewId) {
      setError("Missing review id");
      setItems([]);
      setReplies([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { items, replies } = await fetchComments(reviewId, 1, 20);
      setItems(items);
      setReplies(replies);
    } catch (e: any) {
      setError(e?.message || "Failed to load comments");
      setItems([]);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  const repliesByParent = useMemo(
    () => groupRepliesByParent(replies),
    [replies]
  );

  const addTopLevel = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!text || !reviewId) return;
      await postComment(reviewId, text);
      await load();
    },
    [reviewId, load]
  );

  return {
    items,
    replies,
    repliesByParent,
    loading,
    error,
    load,
    addTopLevel,
  };
}
