"use client";

import Link from "next/link";
import { useRecommendations } from "@/app/hooks/useRecommendations";

export default function RecommendedForYou() {
  const { data, isLoading, isError } = useRecommendations();

  // If there's no data at all, hide the section
  if (!isLoading && !isError && (!data || data.length === 0)) {
    return null;
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          Recommended For You
        </h2>
        <p className="text-xs text-zinc-400">
          Personalized by your listening and reviewing tastes
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-zinc-400">Loading recommendations…</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          Couldn't load recommendations.
        </p>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.map((rec) => (
            <div
              key={rec.albumId}
              className="group rounded-lg bg-zinc-900/60 p-3 hover:bg-zinc-900 transition flex flex-col gap-2"
            >
              <Link href={`/album/${rec.albumId}`} className="block">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-zinc-800">
                  {rec.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rec.imageUrl}
                      alt={rec.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium line-clamp-1">{rec.name}</p>
                  <p className="text-xs text-zinc-400 line-clamp-1">
                    {rec.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
              </Link>

              <div className="mt-auto flex flex-col gap-1">
                {rec.spotifyUrl && (
                  <a
                    href={rec.spotifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-emerald-600 hover:border-emerald-500 transition"
                  >
                    Listen on Spotify
                  </a>
                )}
                {rec.reason && (
                  <p className="text-[10px] text-zinc-500 line-clamp-2">
                    {rec.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}