import Link from "next/link";

type NewReleasesAlbum = {
  id: string;
  name: string;
  images?: { url: string }[];
  artists?: { name: string }[];
};

type NewReleasesGridProps = {
  albums: NewReleasesAlbum[];
  loading: boolean;
};

export default function NewReleasesGrid({ albums, loading }: NewReleasesGridProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="mb-4 text-2xl font-semibold">Top New Releases</h1>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : albums.length === 0 ? (
        <p className="text-sm text-zinc-400">No new releases found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {albums.map((a) => (
            <Link
              key={a.id}
              href={`/album/${a.id}`}
              className="rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700"
            >
              <img
                src={a.images?.[0]?.url}
                alt={a.name}
                className="mb-2 w-full rounded-md"
              />
              <div className="text-sm font-medium">{a.name}</div>
              <div className="text-xs text-zinc-400">
                {a.artists?.map((x) => x.name).join(", ")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
