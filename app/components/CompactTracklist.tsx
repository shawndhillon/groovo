"use client";

type Track = {
  id: string;
  name: string;
  duration_ms: number;
};

export function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}:${rem.toString().padStart(2, "0")}`;
}

export default function CompactTracklist({
  tracks,
  total,
  limit = 12,
  title = "Tracklist",
}: {
  tracks: Track[];
  total: number;
  limit?: number;
  title?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>

      <div className="max-h-65 overflow-y-auto space-y-1 pr-2" role="list">
        {tracks.slice(0, limit).map((track, idx) => (
          <div
            key={track.id}
            role="listitem"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-800 transition"
          >
            <span className="text-zinc-500 text-xs w-6 text-right">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{track.name}</p>
            </div>
            <span className="text-xs text-zinc-500">
              {formatDuration(track.duration_ms)}
            </span>
          </div>
        ))}
      </div>

      {total > limit && (
        <p className="text-sm text-zinc-400 mt-3 text-center">
          +{total - limit} more tracks
        </p>
      )}
    </section>
  );
}
