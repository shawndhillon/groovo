/**
 * Purpose:
 *   Renders a responsive grid of albums for a given artist.
 *   Each album links to its dedicated album page.
 *
 * Props:
 *   - albums: Array of album objects containing id, name, images, track count,
 *     and release date.
 *
 *   - Displays a placeholder message if no albums are available.
 */

"use client";

import Link from "next/link";

interface Album {
  id: string;
  name: string;
  images: { url: string; height?: number; width?: number }[];
  total_tracks: number;
  release_date: string;
}

interface ArtistAlbumsProps {
  albums: Album[];
}

export default function ArtistAlbums({ albums }: ArtistAlbumsProps) {
  if (!albums || albums.length === 0) {
    return <p className="text-zinc-500">No albums available</p>;
  }

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {albums.map((album) => (
        <Link
          key={album.id}
          href={`/album/${album.id}`}
          className="flex flex-col bg-zinc-900 rounded-lg shadow overflow-hidden hover:scale-105 transform transition"
        >
          <img
            src={album.images[0]?.url || "/placeholder-album.png"}
            alt={album.name}
            className="w-full aspect-square object-cover"
          />
          <div className="p-2">
            <h3 className="text-sm font-semibold text-white line-clamp-2">{album.name}</h3>
            <p className="text-xs text-zinc-400">{album.total_tracks} tracks</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
