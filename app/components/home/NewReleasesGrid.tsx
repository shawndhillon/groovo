import Link from "next/link";

type NewReleasesAlbum = {
  id: string;
  name: string;
  images?: { url: string }[];
  artists?: { name: string }[];
  position?: number; // <- add this
};

type NewReleasesGridProps = {
  albums: NewReleasesAlbum[];
  loading: boolean;
};

export default function NewReleasesGrid({ albums, loading }: NewReleasesGridProps) {
  if (loading) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  if (albums.length === 0) {
    return <p className="text-sm text-zinc-400">No albums found.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {albums.map((a) => (
        <Link
          key={a.id}
          href={`/album/${a.id}`}
          className="rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700 overflow-hidden"
        >
          <div className="relative mb-2">
            <img
              src={a.images?.[0]?.url}
              alt={a.name}
              className="w-full rounded-md"
            />

            {typeof a.position === "number" && (
              <div className="absolute left-1 top-1 rounded-full bg-gradient-to-br from-black/80 via-black/60 to-transparent px-2 py-1">
                #
                <span className="text-xl font-semibold text-white font-bold">
                  {a.position}
                </span>
              </div>
            )}
          </div>

          <div className="text-sm font-medium">{a.name}</div>
          <div className="text-xs text-zinc-400">
            {a.artists?.map((x) => x.name).join(", ")}
          </div>
        </Link>
      ))}
    </div>
  );
}
