/**
 * Purpose:
 *   Interactive follow/unfollow button component
 *
 * Scope:
 *   - Used on user profile pages
 *   - Provides follow action with follower count updates
 *
 * Role:
 *   - Displays current follow status (Following/Follow)
 *   - Handles follow/unfollow actions with optimistic updates
 *   - Shows loading state during API calls (disabled when busy)
 *   - Redirects to login on unauthorized requests (401)
 *   - Calls onChange callback with updated follow status and count
 *
 * Deps:
 *   - /api/follows endpoint for follow actions
 *
 * Notes:
 *   - Uses optimistic updates, reverts on failure
 */

"use client";

import { useState } from "react";

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing: boolean;
  initialFollowersCount?: number;
  onChange?: (next: { following: boolean; followersCount: number }) => void;
  className?: string;
};

export default function FollowButton({
  targetUserId,
  initialFollowing,
  initialFollowersCount = 0,
  onChange,
  className = "",
}: FollowButtonProps) {
  const [following, setFollowing] = useState<boolean>(initialFollowing);
  const [followersCount, setFollowersCount] = useState<number>(initialFollowersCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    const next = !following;
    setFollowing(next);

    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetUserId,
          action: next ? "follow" : "unfollow",
        }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const j = await res.json().catch(() => ({}));
      if (!res.ok || typeof j?.following !== "boolean") {
        setFollowing(!next);
        setFollowersCount(initialFollowersCount);
        return;
      }
      setFollowing(j.following);
      const newCount = typeof j?.followersCount === "number" ? j.followersCount : followersCount + (next ? 1 : -1);
      setFollowersCount(newCount);
      onChange?.({ following: j.following, followersCount: newCount });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        following ? "bg-zinc-800 text-white border border-white/10" : "bg-violet-600 text-white hover:bg-violet-500"
      } ${busy ? "opacity-60" : ""} ${className}`}
      aria-pressed={following}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
