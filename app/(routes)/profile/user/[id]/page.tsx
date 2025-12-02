/**
 * Purpose:
 *   Public user profile page for viewing other users' profiles
 *
 * Scope:
 *   - Used for /profile/user/[id] route
 *   - Displays public profile information and reviews
 *
 * Role:
 *   - Fetches user profile data from /api/users/[id]
 *   - Displays user header with stats (reviews, followers, following)
 *   - Shows user's Top 5 favorite albums (editable if viewing own profile)
 *   - Renders user's reviews as an album grid
 *   - Handles loading and error states
 *
 * Deps:
 *   - useCurrentUser hook for current user context
 *   - useUserReviews hook for fetching user's reviews
 *   - UserHeader, SavedAlbumsGrid, TopFiveFavoritesView components
 *   - app/utils/albumsGrid for review-to-album mapping
 *
 * Notes:
 *   - Top 5 section is editable only when viewer.isSelf is true
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/app/components/Header";
import UserHeader from "@/app/(routes)/profile/components/UserHeader";
import SavedAlbumsGrid from "@/app/(routes)/profile/components/SavedAlbumsGrid";
import TopFiveFavoritesView from "@/app/(routes)/profile/components/TopFiveFavoritesView";

import { useUserReviews } from "@/app/hooks/useUserReviews";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

import type { SavedAlbum } from "@/app/utils/albumCollections";
import { mapReviewsToSavedAlbums } from "@/app/utils/albumCollections";

type Params = { id: string };
type PageProps = { params: Promise<Params> };

type PublicUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  bio: string | null;
  createdAt: string | null;
  stats: {
    reviewsCount: number;
    followersCount: number;
    followingCount: number;
  };
  viewer: {
    you: string | null;
    isSelf: boolean;
    youFollow: boolean;
  };
};

type ProfilePayload = { user: PublicUser };

export default function OtherUserProfilePage({ params }: PageProps) {
  const [targetId, setTargetId] = useState<string>("");
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { user: currentUser, isLoading: isCurrentUserLoading } = useCurrentUser();
  const {
    items: reviews,
    loading: reviewsLoading,
    error: reviewsError,
  } = useUserReviews(targetId || null);

  useEffect(() => {
    let mounted = true;
    params.then(({ id }) => {
      if (!mounted) return;
      setTargetId(id);
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/users/${targetId}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const data = (await res.json()) as ProfilePayload;
        if (!res.ok) throw new Error((data as any)?.error || `HTTP ${res.status}`);
        if (!cancelled) setProfile(data.user);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || "Failed to load user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [targetId]);

  /**
   * Normalize the target user's reviews into SavedAlbum entries for the grid.
   * Uses the shared mapper so the card shape matches everywhere (own profile,
   * other user profile, Top 5, editable grid, etc.).
   */
  const albumsForGrid: SavedAlbum[] = useMemo(
    () => mapReviewsToSavedAlbums(reviews as any),
    [reviews],
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-6 pb-12">
        {loading ? (
          <div className="py-16 text-center text-zinc-400">Loading…</div>
        ) : err ? (
          <div className="py-16 text-center text-red-400">{err}</div>
        ) : !profile ? (
          <div className="py-16 text-center text-zinc-400">User not found.</div>
        ) : (
          <>
            {/* Header card - use UserHeader if it's the current user's own profile */}
            <UserHeader
              user={{
                // this object just needs to match what UserHeader expects
                ...profile,
                // map stats into the fields UserHeader uses
                albumsCount: (profile as any).albumsCount ?? 0, // or whatever you track
                reviewsCount: profile.stats.reviewsCount,
                followersCount: profile.stats.followersCount,
              }}
              loading={false}
              isSelf={profile.viewer.isSelf}
            />


            {/* Top 5 (read-only for others; editable only if you are the owner) */}
            <section className="mt-8">
              <TopFiveFavoritesView
                userId={profile.id}
                title={`${profile.username ? "@" + profile.username : "User"}'s Top 5`}
                isOwner={profile.viewer.isSelf}
              />
            </section>

            {/* Reviews section - read-only view matching own profile format */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                {profile.viewer.isSelf ? "My Reviews" : `${profile.username ? "@" + profile.username : "User"}'s Reviews`}
              </h2>
              <SavedAlbumsGrid
                albums={albumsForGrid}
                loading={reviewsLoading}
                error={reviewsError}
                emptyAs="reviews"
                showRating
                showSnippet
              />
            </section>

          </>
        )}
      </div>
    </main>
  );
}
