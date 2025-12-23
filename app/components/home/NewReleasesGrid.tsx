import Link from "next/link";

type Album = {
  id: string;
  name: string;
  images?: { url: string }[];
  artists?: { name: string }[];
  position?: number;
};

export default function ResponsiveGridOrCarousel({
  albums,
  loading,
}: {
  albums: Album[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  if (albums.length === 0) {
    return <p className="text-sm text-zinc-400">No albums found.</p>;
  }

  return (
    <>
      {/* DESKTOP GRID (same as before) */}
      <div className="hidden sm:grid grid-cols-2 gap-4 md:grid-cols-5">
        {albums.map((a) => (
          <AlbumCard key={a.id} a={a} />
        ))}
      </div>

      {/* MOBILE CAROUSEL */}
      <div className="flex sm:hidden overflow-x-auto gap-4 pb-3 scrollbar-none">
        {albums.map((a) => (
          <div className="min-w-[140px] flex-shrink-0" key={a.id}>
            <AlbumCard a={a} mobile />
          </div>
        ))}
      </div>
    </>
  );
}

function AlbumCard({ a, mobile = false }: { a: Album; mobile?: boolean }) {
  return (
    <Link
      href={`/album/${a.id}`}
      className="block rounded-lg bg-zinc-800 p-2 hover:bg-zinc-700 overflow-hidden"
    >
      <div className="relative mb-2">
        <img
          src={a.images?.[0]?.url}
          alt={a.name}
          className={`rounded-md w-full ${
            mobile ? "h-[140px] object-cover" : ""
          }`}
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

      <p className="text-sm font-medium truncate">{a.name}</p>
      <p className="text-xs text-zinc-400 truncate">
        {a.artists?.map((x) => x.name).join(", ")}
      </p>
    </Link>
  );
}
