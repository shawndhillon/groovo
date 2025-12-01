/**
 * Purpose:
 *   Editable grid for managing the user's Top Favorites (Top 5) albums.
 *
 * Scope:
 *   - Used inside TopFiveFavoritesView when the profile owner enters edit mode
 *   - Only concerned with marking albums for removal; saving happens upstream
 *
 * Role:
 *   - Display the current Top Favorites in a responsive grid
 *   - Allow the user to toggle "remove" on individual albums
 *   - Visually distinguish albums marked for removal
 *
 * Deps:
 *   - app/utils/albumCollections: SavedAlbum type
 *
 * Notes:
 *   - This component is intentionally stateless; selection state is driven
 *     by the `removed` Set and `onToggleRemove` callback from the parent.
 *   - The parent is responsible for recomputing ranks and persisting changes.
 */

"use client";

import type { SavedAlbum } from "@/app/utils/albumCollections";

interface FavoritesEditableGridProps {
  albums: SavedAlbum[];
  removed: Set<string>;
  onToggleRemove: (albumId: string) => void;
}

export default function FavoritesEditableGrid({
  albums,
  removed,
  onToggleRemove,
}: FavoritesEditableGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {albums.map((album) => {
        const cover = album.images?.[0]?.url || "/placeholder-album.svg";
        const isMarked = removed.has(album.id);

        return (
          <div
            key={album.id}
            className={`relative rounded-lg p-2 border transition
              ${
                isMarked
                  ? "border-red-500/50 bg-red-500/10"
                  : "border-white/10 bg-zinc-800 hover:bg-zinc-700"
              }`}
          >
            {/* Remove / undo button */}
            <button
              type="button"
              onClick={() => onToggleRemove(album.id)}
              className={`absolute right-2 top-2 h-7 w-7 rounded-full text-sm font-bold
                ${
                  isMarked
                    ? "bg-red-600 text-white"
                    : "bg-black/70 text-white hover:bg-black/80"
                }`}
              title={isMarked ? "Undo remove" : "Remove from Top 5"}
              aria-label={isMarked ? "Undo remove from Top 5" : "Remove from Top 5"}
            >
              ×
            </button>

            {/* Album cover */}
            <img
              src={cover}
              alt={`${album.name} cover`}
              className="mb-2 aspect-square w-full rounded-md object-cover"
              loading="lazy"
              decoding="async"
            />

            {/* Title, artists, optional snippet */}
            <div className="space-y-1">
              <h3 className="line-clamp-2 text-sm font-medium text-white">
                {album.name}
              </h3>
              <p className="line-clamp-1 text-xs text-zinc-400">
                {album.artists?.map((artist) => artist.name).join(", ")}
              </p>
              {album.review?.reviewText && (
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                  “{album.review.reviewText}”
                </p>
              )}
            </div>

            {/* "Remove" badge overlay when marked */}
            {isMarked && (
              <div className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                Remove
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
