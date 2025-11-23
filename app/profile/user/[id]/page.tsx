"use client";

import FollowButton from "@/app/components/FollowButton";
import Header from "@/app/components/Header";
import { useUserReviews } from "@/app/hooks/useUserReviews";
import SavedAlbumsGrid, { SavedAlbum } from "@/app/profile/SavedAlbumsGrid";
import TopFiveFavoritesView from "@/app/profile/TopFiveFavoritesView";
import { useEffect, useMemo, useState } from "react";

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

  // Map reviews
  const albumsForGrid: SavedAlbum[] = useMemo(() => {
    return (reviews || []).map((r) => {
      // prefer albumSnapshot; fallback to legacy album
      const snap = r.albumSnapshot ?? (r as any).album ?? {};

      const name = typeof snap.name === "string" && snap.name.trim() ? snap.name : "Unknown";
      const artists =
        Array.isArray(snap.artists) && snap.artists.length > 0
          ? snap.artists
          : [{ id: "unknown", name: "Unknown Artist" }];

      const images =
        Array.isArray(snap.images) && snap.images.length > 0
          ? snap.images
          : [{ url: "/placeholder-album.svg", width: 640, height: 640 }];

      return {
        id: r.albumId,
        name,
        artists,
        images,
        review: {
          rating: r.rating,
          reviewText: r.body,
          createdAt: r.createdAt,
        },
        savedAt: r.createdAt,
      } as SavedAlbum;
    });
  }, [reviews]);

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
            {/* Header card */}
            <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
              <div className="flex items-start gap-4">
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt={profile.username ?? "avatar"}
                    className="h-16 w-16 rounded-full object-cover border-2 border-violet-500/20"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-violet-500/20 flex items-center justify-center border-2 border-violet-500/20">
                    <span className="text-2xl font-semibold text-violet-400">
                      {(profile.name || profile.username || "U")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-xl font-semibold text-white truncate">
                        {profile.name || profile.username || "User"}
                      </h1>
                      <div className="text-sm text-zinc-400 truncate">
                        @{profile.username ?? profile.id.slice(0, 6)}
                      </div>
                    </div>

                    {!profile.viewer.isSelf && (
                      <FollowButton
                        targetUserId={profile.id}
                        initialFollowing={profile.viewer.youFollow}
                        initialFollowersCount={profile.stats.followersCount}
                        onChange={({ following, followersCount }) => {
                          setProfile((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  viewer: { ...prev.viewer, youFollow: following },
                                  stats: { ...prev.stats, followersCount },
                                }
                              : prev
                          );
                        }}
                      />

                    )}
                  </div>

                  {profile.bio && (
                    <p className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-sm text-zinc-400">
                    <span>{profile.stats.reviewsCount} reviews</span>
                    <span>{profile.stats.followersCount} followers</span>
                    <span>{profile.stats.followingCount} following</span>
                  </div>
                </div>
              </div>
            </section>

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
