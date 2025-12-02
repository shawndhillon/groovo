/**
 * Purpose:
 *   Reusable UI for liking reviews and comments across the app
 *
 * Scope:
 *   - Review cards, comment threads, and detail views that show like counts
 *   - Any UI that needs a small like control wired to the likes API
 *
 * Role:
 *   - Render a like button with current count and state
 *   - Optimistic like and unlike interactions on the client
 *   - Notify parent components when like status or count changes
 *
 * Deps:
 *   - toggleLike helper from app/utils/social for API communication
 *
 * Notes:
 *   - Relies on server routes in /api/likes for persistence
 *
 */

"use client";

import { useState } from "react";
import { toggleLike, LikeAction } from "@/app/utils/social";

type Props = {
  targetType: "review" | "comment";
  targetId: string;
  initialLiked?: boolean;
  initialCount?: number;
  className?: string;
  onChange?: (liked: boolean, nextCount: number) => void;
};

/**
 * Purpose:
 *   Interactive like button component that shows like count and allows toggling likes
 *
 * Params:
 *   - targetType: whether button is for a "review" or "comment"
 *   - targetId: ID of the review or comment to like
 *   - initialLiked: whether the item is initially liked (default false)
 *   - initialCount: initial like count to display (default 0)
 *   - className: optional CSS classes for styling
 *   - onChange: optional callback called when like status changes with new liked state and count
 *
 * Returns:
 *   - React element that renders a like button with count
 *
 * Notes:
 *   - User may or may not be signed in
 *   - immediately updates button state and count after a click using local React state
 *   - sends a request to the likes API to keep the server in sync with the new state
 *   - reverts optimistic update if API call fails
 *   - redirects to login page on 401 response
 */
export default function LikeButton({
  targetType,
  targetId,
  initialLiked = false,
  initialCount = 0,
  className = "",
  onChange,
}: Props) {
  const [liked, setLiked] = useState<boolean>(initialLiked);
  const [count, setCount] = useState<number>(initialCount);
  const [busy, setBusy] = useState<boolean>(false);

  async function handleToggle() {
    // prevent overlapping requests while a like or unlike is being resolved
    if (busy) return;
    setBusy(true);

    // apply optimistic like toggle in local state so the button updates before the server responds
    const nextLiked = !liked;
    const nextCount = Math.max(0, count + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setCount(nextCount);

    try {
      // call toggleLike from app/utils/social to sync the optimistic state with the /api/likes endpoint
      const action: LikeAction = nextLiked ? "like" : "unlike";
      const res = await toggleLike(targetType, targetId, action);

      const finalLiked = !!res.liked;
      const finalCount = finalLiked
        ? Math.max(nextCount, count + 1)
        : Math.min(nextCount, count);
      setLiked(finalLiked);
      setCount(finalCount);
      onChange?.(finalLiked, finalCount);
    } catch {
      // revert optimistic state when the server call fails so the UI matches the like state
      setLiked(liked);
      setCount(count);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-sm ${liked ? "bg-violet-600 text-white" : "text-zinc-200 hover:bg-zinc-800"} ${busy ? "opacity-60" : ""} ${className}`}
      aria-pressed={liked}
    >
      <span>♥</span>
      <span>{count}</span>
    </button>
  );
}
