"use client";

interface SavedAlbum {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string; height: number; width: number }>;
  review?: {
    rating: number;
    reviewText: string;
    createdAt: string;
  };
  savedAt: string;
}

interface SavedAlbumsGridProps {
  albums: SavedAlbum[];
  loading: boolean;
  error: string | null;
}

export default function SavedAlbumsGrid({ albums, loading, error }: SavedAlbumsGridProps) {

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
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

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6 text-center">
        <p className="text-red-200 mb-2">Failed to load saved albums</p>
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-200 hover:bg-red-500/30 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-zinc-900/40 p-8 text-center">
        <div className="text-6xl mb-4">🎵</div>
        <h3 className="text-lg font-semibold text-zinc-300 mb-2">No saved albums yet</h3>
        <p className="text-zinc-400 mb-4">
          Start discovering music and save albums you love!
        </p>
        <button className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 transition">
          Discover Music
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {albums.map((album) => (
        <div
          key={album.id}
          className="group rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700 transition-all duration-200"
        >
          {/* Album Artwork */}
          <div className="relative mb-2">
            <img
              src={album.images?.[0]?.url || "/placeholder-album.png"}
              alt={album.name}
              className="w-full aspect-square rounded-md object-cover"
            />
            {/* Rating overlay */}
            {album.review?.rating && (
              <div className="absolute top-2 right-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                ⭐{album.review.rating}/5
              </div>
            )}
          </div>

          {/* Album Info */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors line-clamp-2">
              {album.name}
            </h3>
            <p className="text-xs text-zinc-400 line-clamp-1">
              {album.artists?.map(artist => artist.name).join(", ")}
            </p>
            
            {/* Review snippet */}
            {album.review?.reviewText && (
              <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                "{album.review.reviewText}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
