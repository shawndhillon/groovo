"use client";

import { useMemo, useState } from "react";
import SavedAlbumsGrid from "@/app/profile/SavedAlbumsGrid";
import FavoritesEditableGrid from "@/app/profile/TopFiveEditableGrid";
import { useFavoritesTop5 } from "@/app/hooks/useTop5";
import {
  mapFavoritesToSavedAlbums,
  putFavoritesTop5,
  dispatchFavoritesUpdated,
  FavoritePutItem,
} from "@/app/utils/top5";

export default function TopFiveFavoritesView({
  userId, // optional: if omitted, API uses the current user
  title = "Top 5 Favorites Albums",
  isOwner = true,
}: {
  userId?: string;
  title?: string;
  isOwner?: boolean;
}) {
  const { items, loading, error, refresh } = useFavoritesTop5(userId);

  const albumsForGrid = useMemo(() => mapFavoritesToSavedAlbums(items), [items]);

  // Edit state (only in owner view)
  const [editing, setEditing] = useState(false);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEdit = () => { setRemoved(new Set()); setSaveError(null); setEditing(true); };
  const cancelEdit = () => { setRemoved(new Set()); setSaveError(null); setEditing(false); };
  const onToggleRemove = (albumId: string) =>
    setRemoved((prev) => {
      const next = new Set(prev);
      next.has(albumId) ? next.delete(albumId) : next.add(albumId);
      return next;
    });

  const confirm = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const kept: FavoritePutItem[] = items
        .filter((it) => !removed.has(it.albumId))
        .sort((a, b) => a.rank - b.rank)
        .map((it, idx) => ({ rank: idx + 1, albumId: it.albumId }));
      await putFavoritesTop5(kept);
      await refresh();
      setEditing(false);
      setRemoved(new Set());
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

        {isOwner && !loading && !error && albumsForGrid.length > 0 && (
          !editing ? (
            <button
              onClick={startEdit}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white hover:bg-zinc-800 transition"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {saveError && <span className="text-xs text-red-300 mr-2">{saveError}</span>}
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={removed.size === 0 || saving}
                className="rounded-lg bg-violet-600 px-3 py-1 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : `Confirm (${removed.size})`}
              </button>
            </div>
          )
        )}
      </div>

      {loading ? (
        <SavedAlbumsGrid albums={[]} loading={true} error={null} emptyAs="saved" />
      ) : error ? (
        <SavedAlbumsGrid albums={[]} loading={false} error={error} emptyAs="saved" />
      ) : albumsForGrid.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-8 text-center">
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">No favorites yet</h3>
          <p className="text-sm text-zinc-400">Pin up to five of your all-time favorite albums here.</p>
        </div>
      ) : !editing ? (
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