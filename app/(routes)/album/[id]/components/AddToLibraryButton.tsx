/**
 * Purpose:
 *   Spotify-style button for adding/removing an album from the user's library.
 *
 * Scope:
 *   - Used directly in AlbumHeader next to the Play button
 *
 * Role:
 *   - Display a single button with the same shape + layout as Spotify/Last.fm buttons
 *   - Toggle saved/unsaved state using useLibrary()
 */

"use client";

import { useMemo } from "react";
import { useLibrary, type LibraryAlbum } from "@/app/hooks/useLibrary";

interface AddToLibraryButtonProps {
  album: LibraryAlbum;
  className?: string;
}

export default function AddToLibraryButton({
  album,
  className,
}: AddToLibraryButtonProps) {
  const { isSaved, add, remove } = useLibrary();

  const saved = useMemo(() => isSaved(album.id), [isSaved, album.id]);

  const handleClick = () => {
    if (saved) remove(album.id);
    else add(album);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2
        rounded-lg px-4 py-2 text-sm font-medium transition
        text-white
        ${saved
          ? "bg-violet-700 border border-violet-600 hover:bg-violet-600 text-white"
          : "bg-transparent border border-zinc-700 text-white hover:bg-zinc-800"}
        ${className ?? ""}
      `}
    >
      {/* Small symbol for add/remove */}
      <span className="text-lg">{saved ? "✓" : "＋"}</span>
      {saved ? "In Library" : "Add to Library"}
    </button>
  );
}
