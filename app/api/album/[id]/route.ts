import { NextResponse } from "next/server";
import SpotifyWebApi from "spotify-web-api-node";
import { SpotifyAlbumWithTracks } from "@/app/types/spotify";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get client credentials token
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);

    // Fetch album details
    const albumResponse = await spotifyApi.getAlbum(id);
    const album = albumResponse.body;

    // Transform the data to match our interface
    const formattedAlbum: SpotifyAlbumWithTracks = {
      id: album.id,
      name: album.name,
      artists: album.artists,
      images: album.images,
      release_date: album.release_date,
      release_date_precision: album.release_date_precision,
      total_tracks: album.tracks.total,
      genres: album.genres || [],
      popularity: album.popularity,
      album_type: album.album_type,
      external_urls: album.external_urls,
      tracks: {
        items: album.tracks.items,
        total: album.tracks.total,
      },
    };

    return NextResponse.json(formattedAlbum);
  } catch (err: any) {
    console.error("Error fetching album:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch album" },
      { status: 500 }
    );
  }
}

