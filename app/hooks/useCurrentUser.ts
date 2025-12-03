/**
 * Purpose:
 *   The hook for retrieving and tracking the authenticated user's profile.
 *
 * Scope:
 *   - Used across the application wherever components need to know the logged in user.
 *   - Calls the `/api/profile/me` route to fetch user identity + profile metadata.
 *
 * Role:
 *   - Fetches the current user's profile (name, email, username, bio, counts).
 *   - Tracks loading + error states for UI usage.
 *   - Implements a one-time retry for 401 responses to avoid race conditions during login.
 *   - Provides a `refresh()` function to re-fetch the user after login/logout/profile updates.
 *
 * Deps:
 *   - React hooks (`useState`, `useEffect`, `useRef`).
 *   - Internal API route `/api/profile/me` (returns `{ user: {...} }`).
 *
 * Notes:
 *   - `refresh()` resets retry state and forces a new API request.
 *
 * Returns:
 *   {
 *     user: CurrentUserProfile | null    // null when logged out or error occurred
 *     isLoading: boolean                 // true during fetch
 *     errorText: string | null           // network or server errors (not 401)
 *     refresh: () => Promise<void>       // manually re-fetch the user
 *   }
 */

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shape of the authenticated user profile returned by /api/profile/me.
 */
export interface CurrentUserProfile {
  _id: string;
  name: string;
  email: string;
  username?: string;
  image?: string;
  bio?: string;
  albumsCount?: number;
  reviewsCount?: number;
  followersCount?: number;
}

/**
 * useCurrentUser
 * - Single source of truth for auth state across the app.
 * - No automatic redirect; components decide how to react.
 * - Adds no-store (avoid cached 401s) and a single 401 retry (handles session race).
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Guard against state updates after unmount + ensure we retry at most once
  const hasRetried401 = useRef(false);
  const aborted = useRef(false);

  async function fetchMe(tryAgain = false) {
    try {
      const res = await fetch("/api/profile/me", {
        credentials: "include",
        cache: "no-store",         // ← prevent stale cached 401s
        headers: { "accept": "application/json" },
      });

      if (res.status === 401) {
        // If we haven't retried yet, wait briefly and try once more.
        if (!hasRetried401.current && !tryAgain) {
          hasRetried401.current = true;
          await new Promise(r => setTimeout(r, 150));
          if (!aborted.current) return fetchMe(true);
        }
        setUser(null);
        setErrorText(null);        // 401 isn't a "network error"—just unauthenticated
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch current user: ${res.status} ${res.statusText}`);
      }

      const payload = await res.json();
      setUser(payload.user ?? null);
      setErrorText(null);
    } catch (err: any) {
      if (!aborted.current) {
        console.error("useCurrentUser:", err);
        setErrorText(err?.message || "Unknown error");
        setUser(null);
      }
    } finally {
      if (!aborted.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    aborted.current = false;
    fetchMe();
    return () => {
      aborted.current = true;
    };
  }, []);

  /**
   * Expose a manual refresh, useful after login/logout or profile updates.
   */
  const refresh = () => {
    setIsLoading(true);
    hasRetried401.current = false;
    return fetchMe();
  };

  return { user, isLoading, errorText, refresh };
}
