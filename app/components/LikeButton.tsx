
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
    if (busy) return;
    setBusy(true);

    const nextLiked = !liked;
    const nextCount = Math.max(0, count + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setCount(nextCount);

    try {
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
