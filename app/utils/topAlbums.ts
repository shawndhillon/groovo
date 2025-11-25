// app/utils/topAlbums.ts

// Shape of data coming from your scraper / JSON
export type BillboardAlbum = {
  position: number;
  title: string;
  artist: string;
  spotifyAlbumId: string | null;
  spotifyUrl: string | null;
  imageUrl: string | null;
};

// Shape expected by NewReleasesGrid
export type NewReleasesAlbum = {
  id: string;
  name: string;
  images?: { url: string }[];
  artists?: { name: string }[];
};

/**
 * Convert Billboard+Spotify albums into the shape NewReleasesGrid expects.
 */
export function mapBillboardToNewReleases(
  albums: BillboardAlbum[],
): NewReleasesAlbum[] {
  return albums.map((a) => ({
    // Use Spotify album id when available, otherwise fallback
    id: a.spotifyAlbumId ?? `billboard-${a.position}`,
    name: a.title,
    images: a.imageUrl ? [{ url: a.imageUrl }] : [],
    artists: [{ name: a.artist }],
    position: a.position,
  }));
}
