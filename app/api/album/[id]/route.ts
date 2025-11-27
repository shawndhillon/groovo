import { NextResponse } from "next/server";
import SpotifyWebApi from "spotify-web-api-node";
import { SpotifyAlbumWithTracks } from "@/app/types/spotify";

const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

// Fetch album info and tracks from Last.fm
async function getLastFMAlbumInfo(albumName: string, artistName: string) {
  if (!LASTFM_API_KEY) {
    throw new Error("LASTFM_API_KEY not configured");
  }

  const params = new URLSearchParams({
    method: "album.getInfo",
    api_key: LASTFM_API_KEY,
    artist: artistName,
    album: albumName,
    format: "json",
  });

  const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Last.fm API error: ${data.message || data.error}`);
  }

  const album = data.album || {};
  const tracks = album.tracks?.track || [];
  const trackArray = Array.isArray(tracks) ? tracks : tracks ? [tracks] : [];

  // Convert Last.fm images to Spotify format
  const images = album.image ? (Array.isArray(album.image) ? album.image : [album.image])
    .filter((img: any) => img && img["#text"] && img["#text"].trim().length > 0)
    .map((img: any) => {
      const sizeMap: Record<string, number> = {
        "small": 34,
        "medium": 64,
        "large": 174,
        "extralarge": 300,
        "mega": 600,
      };
      const size = sizeMap[img.size?.toLowerCase() || ""] || 300;
      return {
        url: img["#text"],
        height: size,
        width: size,
      };
    })
    .sort((a: any, b: any) => (b.height || 0) - (a.height || 0)) : [];

  // Convert Last.fm tracks to Spotify format
  const spotifyTracks = trackArray.map((track: any, index: number) => ({
    id: `lastfm-track-${index}`,
    name: track.name || "",
    artists: album.artist ? [{ id: "", name: album.artist, external_urls: { spotify: "" } }] : [],
    duration_ms: parseInt(track.duration) * 1000 || 0,
    track_number: index + 1,
    preview_url: null,
    external_urls: {
      spotify: track.url || "",
    },
  }));

  // Format
  const formattedAlbum: SpotifyAlbumWithTracks = {
    id: `lastfm::${encodeURIComponent(albumName)}::${encodeURIComponent(artistName)}`,
    name: album.name || albumName,
    artists: album.artist ? [{ id: "", name: album.artist, external_urls: { spotify: "" } }] : [],
    images: images,
    release_date: album.wiki?.published || album.releasedate || "",
    release_date_precision: album.wiki?.published ? "day" as const : (album.releasedate ? "year" as const : "day" as const),
    total_tracks: trackArray.length,
    genres: album.tags?.tag ? (Array.isArray(album.tags.tag) ? album.tags.tag : [album.tags.tag])
      .map((t: any) => t.name)
      .filter(Boolean) : [],
    popularity: 0,
    album_type: "album",
    external_urls: {
      spotify: "",
    },
    tracks: {
      items: spotifyTracks,
      total: trackArray.length,
    },
    // Add Last.fm specific data
    lastfm: {
      url: album.url || "",
      playcount: parseInt(album.playcount) || 0,
      listeners: parseInt(album.listeners) || 0,
    },
  };

  return formattedAlbum;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  try {
    // Check if this is a Last.fm album ID
    if (decodedId.startsWith("lastfm::")) {
      const parts = decodedId.split("::");
      if (parts.length === 3) {
        const albumName = decodeURIComponent(parts[1]);
        const artistName = decodeURIComponent(parts[2]);

        const album = await getLastFMAlbumInfo(albumName, artistName);
        return NextResponse.json(album);
      }
    }

    // Otherwise, treat as Spotify ID
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Spotify credentials not configured" },
        { status: 500 }
      );
    }

    // Get client credentials token
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);

    // Fetch album details
    const albumResponse = await spotifyApi.getAlbum(decodedId);
    const album = albumResponse.body;

    // Fetch all tracks (Spotify only returns first 50 tracks in getAlbum)
    const allTracks: any[] = [];
    let offset = 0;
    const limit = 50;

    while (offset < album.tracks.total) {
      const tracksResponse = await spotifyApi.getAlbumTracks(decodedId, {
        limit: limit,
        offset: offset,
      });

      allTracks.push(...tracksResponse.body.items);
      offset += limit;
      
      if (tracksResponse.body.items.length < limit) {
        break;
      }
    }

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
        items: allTracks,
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
