/**
 * Purpose:
 *   View component for displaying a user's Top Favorites (Top 5) albums.
 *
 * Scope:
 *   - Used on profile pages and user detail views
 *   - Supports both "self" profile and other users' profiles via userId prop
 *
 * Role:
 *   - Reads Top Favorites via useTopFavorites(userId)
 *   - Maps favorites into SavedAlbum cards for grid rendering
 *   - Renders either a read-only grid or an editable grid based on ownership
 *   - Handles client-side removal and re-ranking of the Top 5 list
 *   - Persists changes through saveTopFavorites() and notifies listeners via
 *     a global "favorites:updated" event
 *
 * Deps:
 *   - app/hooks/useTopFavorites for loading favorites and refresh()
 *   - app/utils/albumCollections for mapping & saving Top Favorites
 *   - app/hooks/useCurrentUser to infer ownership when isOwner is not provided
 *   - SavedAlbumsGrid for read-only display
 *   - TopFiveEditableGrid for owner-only edit mode
 *
 * Notes:
 *   - Ownership can be:
 *       - Explicit: isOwner={true|false}
 *       - Inferred: me._id === userId when isOwner is undefined
 *       - Default: true when neither userId nor isOwner are provided
 *   - When edits are confirmed, ranks are recomputed as 1..N in the kept order.
 *   - This component does not add new favorites; it only removes / reorders
 *     existing ones. Use AddFavoriteButton for adding to Top Favorites.
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import SavedAlbumsGrid from "@/app/(routes)/profile/components/SavedAlbumsGrid";
import FavoritesEditableGrid from "@/app/(routes)/profile/components/TopFiveEditableGrid";

import { useTopFavorites } from "@/app/hooks/useTopFavorites";
import {
  mapFavoritesToSavedAlbums,
  saveTopFavorites,
  dispatchFavoritesUpdated,
  type TopFavoriteItem,
} from "@/app/utils/albumCollections";

import { useCurrentUser } from "@/app/hooks/useCurrentUser";

export default function TopFiveFavoritesView({
  userId, // optional: if omitted, API uses the current user
  title = "Top 5 Favorite Albums",
  isOwner,
}: {
  userId?: string;
  title?: string;
  isOwner?: boolean;
}) {
  const { user: me } = useCurrentUser();

  // Determine whether the viewing user is the owner of this Top 5
  const effectiveIsOwner =
    typeof isOwner === "boolean"
      ? isOwner
      : userId
      ? me?._id && String(me._id) === String(userId)
      : true;

  // Load favorites for the given user (or current user if none provided)
  const { items, loading, error, refresh } = useTopFavorites(userId);

  const albumsForGrid = useMemo(
    () => mapFavoritesToSavedAlbums(items),
    [items],
  );

  // Edit state (only meaningful when viewing as owner)
  const [editing, setEditing] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // If we lose ownership (e.g., props change), reset edit state
  useEffect(() => {
    if (!effectiveIsOwner && editing) {
      setEditing(false);
      setRemoved(new Set());
      setSaveError(null);
    }
  }, [effectiveIsOwner, editing]);

  const startEdit = () => {
    setRemoved(new Set());
    setSaveError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setRemoved(new Set());
    setSaveError(null);
    setEditing(false);
  };

  const onToggleRemove = (albumId: string) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      next.has(albumId) ? next.delete(albumId) : next.add(albumId);
      return next;
    });

  const confirm = async () => {
    if (!effectiveIsOwner) return;

    setSaving(true);
    setSaveError(null);

    try {
      // Keep only those favorites not marked for removal, preserving rank order
      const kept: TopFavoriteItem[] = items
        .filter((it) => !removed.has(it.albumId))
        .sort((a, b) => a.rank - b.rank)
        .map((it, idx) => ({
          rank: idx + 1,
          albumId: it.albumId,
        }));

      await saveTopFavorites(kept);
      await refresh();

      setEditing(false);
      setRemoved(new Set());

      // Notify any listeners (e.g., useTopFavorites in other components)
      dispatchFavoritesUpdated();
    } catch (e: any) {
      setSaveError(e.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // ---- Render states ----
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>

        {effectiveIsOwner &&
          !loading &&
          !error &&
          albumsForGrid.length > 0 &&
          (!editing ? (
            <button
              onClick={startEdit}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white transition hover:bg-zinc-800"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {saveError && (
                <span className="mr-2 text-xs text-red-300">{saveError}</span>
              )}
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white disabled:opacity-60 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={removed.size === 0 || saving}
                className="rounded-lg bg-violet-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-60 hover:bg-violet-700"
              >
                {saving ? "Saving…" : `Confirm (${removed.size})`}
              </button>
            </div>
          ))}
      </div>

      {loading ? (
        <SavedAlbumsGrid
          albums={[]}
          loading={true}
          error={null}
          emptyAs="saved"
        />
      ) : error ? (
        <SavedAlbumsGrid
          albums={[]}
          loading={false}
          error={error}
          emptyAs="saved"
        />
      ) : albumsForGrid.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold text-zinc-300">
            No favorites yet
          </h3>
          <p className="text-sm text-zinc-400">
            Pin up to five of your all-time favorite albums here.
          </p>
        </div>
      ) : !editing || !effectiveIsOwner ? (
        <SavedAlbumsGrid
          albums={albumsForGrid}
          loading={false}
          error={null}
          emptyAs="saved"
          showRating
          showSnippet
        />
      ) : (
        <FavoritesEditableGrid
          albums={albumsForGrid}
          removed={removed}
          onToggleRemove={onToggleRemove}
        />
      )}
    </section>
  );
}
