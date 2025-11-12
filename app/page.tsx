"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "./components/Header";
import CommentSection from "@/app/components/CommentSection";
import LikeButton from "@/app/components/LikeButton";


type FeedArtist = { id?: string; name: string };
type FeedImage = { url: string; width?: number; height?: number };

type FeedItem = {
  _id?: string;
  id?: string;
  userId: string;
  albumId: string;
  rating: number;
  body: string;
  createdAt: string;
  author?: { id?: string; username?: string | null; name?: string | null; image?: string | null } | null;
  albumSnapshot?: {
    name?: string;
    artists?: FeedArtist[] | string[];
    images?: FeedImage[];
  } | null;
};

type BatchUser = { id: string; username?: string | null; name?: string | null; image?: string | null };

function getReviewId(r: any): string {
  const raw =
    r?.id ??
    (typeof r?._id === "object" && r?._id?.$oid ? r._id.$oid : r?._id);
  return String(raw ?? "");
}

export default function NewReleases() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [feedMode, setFeedMode] = useState<"following" | "global">("following");
  const [fetchedUserIds, setFetchedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/new-album-releases?market=US&limit=5")
      .then(r => r.json())
      .then(d => setAlbums(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFeedLoading(true);
      setFeedError(null);
      try {
        const url = feedMode === "global"
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
        } else {
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
          if (!cancelled) {
            setIsAuthed(true);
            setFeed(Array.isArray(j?.items) ? (j.items as FeedItem[]) : []);
            // Reset fetched user IDs when feed changes
            setFetchedUserIds(new Set());
          }
        }
      } catch (e: any) {
        if (!cancelled) setFeedError(e?.message || "Failed to load feed");
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [feedMode]);


  useEffect(() => {
    // Only fetch users that we haven't fetched yet and don't have username
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
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ids: missing }),
        });
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as { items?: BatchUser[] };
        const byId = new Map<string, BatchUser>();
        (data.items || []).forEach((u) => byId.set(u.id, u));
        if (cancelled) return;

        // Mark these user IDs as fetched
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [feed, fetchedUserIds]);
  const cover = (snap?: FeedItem["albumSnapshot"]) =>
    (Array.isArray(snap?.images) && snap!.images[0]?.url) || "/placeholder-album.png";

  const albumName = (snap?: FeedItem["albumSnapshot"]) =>
    (snap?.name && String(snap.name)) || "Unknown album";

  const artistLine = (artists?: FeedArtist[] | string[]) => {
    if (!Array.isArray(artists) || artists.length === 0) return "Unknown Artist";
    return artists
      .map((x: any) => (typeof x === "string" ? x : x?.name))
      .filter((s: any): s is string => typeof s === "string" && s.trim().length > 0)
      .join(", ") || "Unknown Artist";
  };

  const handle = (r: FeedItem) =>
    r.author?.username ? `@${r.author.username}` : r.author?.name ? `@${r.author.name}` : `@${r.userId.slice(0, 6)}`;

  const authorLinkId = (r: FeedItem) => (r.author?.id as string) || r.userId;

  const stars = (n: number) => {
    const c = Math.max(0, Math.min(5, Number(n) || 0));
    const full = Math.floor(c);
    const half = Math.abs(c - full - 0.5) < 1e-6 ? 1 : c - full >= 0.5 ? 1 : 0;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
  };

  const idOf = (r: FeedItem) => (r.id as string) || (r._id as string) || "";

  const feedSorted = useMemo(
    () => [...feed].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [feed]
  );

  return (

    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <h1 className="mb-4 text-2xl font-semibold">Top New Releases</h1>
        {loading ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {albums.map(a => (
              <Link key={a.id} href={`/album/${a.id}`} className="rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700">
                <img src={a.images?.[0]?.url} alt={a.name} className="mb-2 w-full rounded-md" />
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-xs text-zinc-400">
                  {a.artists?.map((x:any) => x.name).join(", ")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="mx-auto max-w-7xl px-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Feed</h2>
          {isAuthed && (
            <div className="flex items-center gap-2 rounded-lg bg-zinc-800/60 p-1 border border-white/10">
              <button
                onClick={() => setFeedMode("following")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  feedMode === "following"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Following
              </button>
              <button
                onClick={() => setFeedMode("global")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  feedMode === "global"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Global
              </button>
            </div>
          )}
        </div>

        {feedLoading && <div className="mt-4 text-sm text-zinc-400">Loading your feed…</div>}

        {!feedLoading && feedError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {feedError}
          </div>
        )}

        {!feedLoading && isAuthed === false && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/60 px-6 py-6">
            <p className="text-sm text-zinc-300">Sign in and follow people to see detailed reviews here.</p>
            <div className="mt-3">
              <Link
                href="/login"
                className="inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}

        {!feedLoading && isAuthed !== false && feedSorted.length === 0 && (
          <div className="mt-4 text-sm text-zinc-400">
            No reviews yet. Follow some users or write your first review!
          </div>
        )}

        {!feedLoading && feedSorted.length > 0 && (
          <ul className="mt-6 space-y-6">
            {feedSorted.map((r) => {
              const snap = r.albumSnapshot;
              const name = albumName(snap);
              const artists = artistLine(snap?.artists);
              return (
                <li key={idOf(r)} className="rounded-3xl border border-white/10 bg-zinc-900/70 p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <Link href={`/album/${r.albumId}`} className="shrink-0">
                      <img src={cover(snap)} alt={name} className="h-28 w-28 rounded-xl object-cover" />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/album/${r.albumId}`}
                            className="block truncate text-lg font-semibold text-white hover:text-violet-300"
                            title={name}
                          >
                            {name}
                          </Link>
                          <div className="truncate text-sm text-zinc-400">{artists}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-semibold text-violet-300">{stars(r.rating)}</div>
                          <div className="text-xs text-zinc-400">({r.rating}/5)</div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                        <Link href={`/profile/user/${authorLinkId(r)}`} className="text-zinc-300 hover:text-white">
                          {handle(r)}
                        </Link>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-zinc-100">{r.body}</p>
                  <CommentSection
                    reviewId={getReviewId(r)}
                    reviewLikeCount={Number((r as any).likeCount || 0)}
                    reviewInitiallyLiked={!!(r as any).viewerLiked}
                    initialOpen={true}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

    </main>
  );
}
