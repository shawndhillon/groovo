"use client";

import { SavedAlbum } from "@/app/utils/top5";

export default function FavoritesEditableGrid({
  albums,
  removed,
  onToggleRemove,
}: {
  albums: SavedAlbum[];
  removed: Set<string>;
  onToggleRemove: (albumId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {albums.map((a) => {
        const cover = a.images?.[0]?.url || "/placeholder-album.svg";
        const isMarked = removed.has(a.id);
        return (
          <div
            key={a.id}
            className={`relative rounded-lg p-2 border transition ${
              isMarked
                ? "border-red-500/50 bg-red-500/10"
                : "border-white/10 bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            <button
              onClick={() => onToggleRemove(a.id)}
              className={`absolute right-2 top-2 h-7 w-7 rounded-full text-sm font-bold
                ${isMarked ? "bg-red-600 text-white" : "bg-black/70 text-white hover:bg-black/80"}`}
              title={isMarked ? "Undo remove" : "Remove from Top 5"}
            >
              ×
            </button>

            <img
              src={cover}
              alt={`${a.name} cover`}
              className="w-full aspect-square rounded-md object-cover mb-2"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-white line-clamp-2">{a.name}</h3>
              <p className="text-xs text-zinc-400 line-clamp-1">
                {a.artists?.map((x) => x.name).join(", ")}
              </p>
              {a.review?.reviewText && (
                <p className="text-xs text-zinc-500 line-clamp-2 mt-1">“{a.review.reviewText}”</p>
              )}
            </div>

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
