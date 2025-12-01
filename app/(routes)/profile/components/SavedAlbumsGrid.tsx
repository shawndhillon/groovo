/**
 * Purpose:
 *   Reusable album grid component for profile pages and other views.
 *
 * Scope:
 *   - Used in:
 *       - Profile "My Library" section
 *       - Profile "My Reviews" section
 *       - Top Favorites read-only view
 *   - Renders SavedAlbum tiles with optional rating + review snippet
 *
 * Role:
 *   - Handle loading / error / empty states for album collections
 *   - Display albums in a responsive grid layout
 *   - Provide optional CTA hooks (retry, discover) to parent components
 *   - Allow callers to inject a per-album action (e.g. "Add to Top 5" button)
 *
 * Deps:
 *   - next/navigation: useRouter for default "Discover" CTA
 *   - next/link: Link for navigation to album detail page
 *   - app/utils/albumCollections: SavedAlbum type
 *
 * Notes:
 *   - This component is intentionally dumb about where the data comes from;
 *     it expects albums already normalized to SavedAlbum.
 *   - Empty state copy is driven by the `emptyAs` variant ("saved" | "reviews")
 *     so we can reuse the grid in multiple contexts.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import type { SavedAlbum } from "@/app/utils/albumCollections";
/**
 * Empty state variants help us reuse the grid for different contexts
 * without hardcoding copy. Extend as needed (e.g., "likes", "history").
 */
type EmptyVariant = "saved" | "reviews";

/**
 * Props:
 *  - albums      : Data to render (already mapped to SavedAlbum[])
 *  - loading     : Show skeleton grid instead of content
 *  - error       : Error message from parent (network / server)
 *  - emptyAs     : Controls empty-state copy ("saved" | "reviews")
 *  - showRating  : Whether to render the rating badge on tiles
 *  - showSnippet : Whether to render review snippet under title
 *  - onRetry     : Optional retry handler (defaults to window.location.reload)
 *  - onDiscover  : Optional "Discover" CTA handler (defaults to /discover)
 *  - renderAction: Optional per-album action row (e.g., Add to Top 5 button)
 */
export interface SavedAlbumsGridProps {
  albums: SavedAlbum[];
  loading: boolean;
  error: string | null;
  emptyAs?: EmptyVariant;
  showRating?: boolean;
  showSnippet?: boolean;
  onRetry?: () => void;
  onDiscover?: () => void;
  renderAction?: (album: SavedAlbum) => ReactNode;
}

export default function SavedAlbumsGrid({
  albums,
  loading,
  error,
  emptyAs = "saved",
  showRating = true,
  showSnippet = true,
  onRetry,
  onDiscover,
  renderAction,
}: SavedAlbumsGridProps) {
  const router = useRouter();

  // 1) Loading state
  if (loading) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-lg bg-zinc-800 p-2">
              <div className="aspect-square w-full rounded-md bg-zinc-700 mb-2" />
              <div className="h-4 bg-zinc-700 rounded mb-1" />
              <div className="h-3 bg-zinc-700 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2) Error: present a retry button (call parent handler if provided, otherwise reload).
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6 text-center">
        <p className="text-red-200 mb-2">Failed to load {emptyAs === "reviews" ? "reviews" : "saved albums"}</p>
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={onRetry ?? (() => window.location.reload())}
          className="mt-3 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200 hover:bg-red-500/30 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  
  // 3) Empty: adjust copy depending on context ("saved" vs "reviews").
  if (albums.length === 0) {
    const title =
      emptyAs === "reviews" ? "No reviews yet" : "No saved albums yet";
    const body =
      emptyAs === "reviews"
        ? "Write your first review from an album page."
        : "Start discovering music and save albums you love!";

    const handleDiscover =
      onDiscover ?? (() => router.push("/discover"));

    return (
      <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-8 text-center">
        <h3 className="text-lg font-semibold text-zinc-300 mb-2">{title}</h3>
        <p className="text-zinc-400 mb-4">{body}</p>
        <button
          onClick={handleDiscover}
          className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition"
        >
          Discover Music
        </button>
      </div>
    );
  }

  // 4) Grid of albums
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      aria-live="polite"
    >
      {albums.map((album) => {
        const cover = album.images?.[0]?.url || "/placeholder-album.svg";
        const rating = album.review?.rating;
        const hasRating = showRating && typeof rating === "number";

        return (
          <div key={album.id} className="rounded-lg">
            {/* Clickable card */}
            <Link
              href={`/album/${album.id}`}
              className="group block rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              {/* Artwork */}
              <div className="relative mb-2">
                <img
                  src={cover}
                  alt={`${album.name} cover`}
                  className="w-full aspect-square rounded-md object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {hasRating && (
                  <div
                    className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white"
                    aria-label={`Rating ${rating} out of 5`}
                  >
                    ⭐ {rating}/5
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors line-clamp-2">
                  {album.name}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-1">
                  {album.artists?.map((a) => a.name).join(", ")}
                </p>
                {showSnippet && album.review?.reviewText && (
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                    “{album.review.reviewText}”
                  </p>
                )}
              </div>
            </Link>

            {/* Action row (non-link) */}
            {typeof renderAction === "function" && (
              <div className="mt-2">
                {renderAction(album)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
