/**
 * Purpose:
 *   Reusable follow/unfollow button for user profiles
 *
 * Scope:
 *   - Profile pages and any UI that shows follow relationships between users
 *   - Places where follower counts and follow state are needed
 *
 * Role:
 *   - Displays current follow status (Following/Follow)
 *   - Render a small control that reflects and toggles follow state
 *   - Notify parent components when following state or follower counts change
  *   - Calls onChange callback with updated follow status and count
 *
 * Deps:
 *   - /api/follows endpoint for server side follow data
 *
 * Notes:
 *   - Relies on the server for the true follower count and conflict handling
 *   - Intended to be embedded wherever user cards or profile headers appear
 *
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

/**
 * Purpose:
 *   Interactive follow/unfollow button component for user profiles
 *
 * Params:
 *   - targetUserId: ID of the user to follow or unfollow
 *   - initialFollowing: whether the user is initially being followed
 *   - initialFollowersCount: initial follower count to display (default 0)
 *   - onChange: optional callback called when follow status changes with new following state and followersCount
 *   - className: optional CSS classes for styling
 *
 * Returns:
 *   - React element that renders a follow button with current status
 *
 * Notes:
 *   - User may or may not be signed in
 *   - immediately updates button state after a click using local React state
 *   - sends a request to the follows API to keep the server in sync with the new state
 *   - reverts optimistic update if API call fails
 *   - redirects to login page on 401 response
 */
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
