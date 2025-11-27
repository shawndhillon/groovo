import { NextResponse } from "next/server";
import SpotifyWebApi from "spotify-web-api-node";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Get client credentials token
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);

    // Fetch artist details
    const artistResponse = await spotifyApi.getArtist(id);
    const artist = artistResponse.body;

    // Fetch artist albums (all types, market: US)
    const albumsResponse = await spotifyApi.getArtistAlbums(id, {
      include_groups: "album,single,compilation",
      market: "US",
      limit: 50, // max per request
    });

    // Format albums
    const albums = albumsResponse.body.items.map((album) => ({
      id: album.id,
      name: album.name,
      images: album.images,
      total_tracks: album.total_tracks,
      release_date: album.release_date,
    }));

    // Fetch top tracks
    const topTracksResponse = await spotifyApi.getArtistTopTracks(id, "US");

    const topTracks = topTracksResponse.body.tracks.map((track) => ({
      id: track.id,
      name: track.name,
      album: {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images,
      },
      external_urls: track.external_urls,
      preview_url: track.preview_url,
      popularity: track.popularity,
    }));

    return NextResponse.json({
      id: artist.id,
      name: artist.name,
      images: artist.images,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total,
      external_urls: artist.external_urls,
      topTracks,
      albums,
    });
  } catch (err: any) {
    console.error("Error fetching artist:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch artist" },
      { status: 500 }
    );
  }
}
