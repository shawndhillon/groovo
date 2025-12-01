
import type { LastFMAPIResponse, LastFMAlbum, LastFMTrack } from "@/app/types/lastfm";
import type { SpotifyAlbumWithTracks, SpotifyTrack } from "@/app/types/spotify";
import {
  callLastFMAPI,
  convertLastFMImages,
  createLastFMAlbumId,
  normalizeLastFMArray,
  parseLastFMAlbumId,
} from "@/app/utils/lastfm";
import { serverErrorResponse } from "@/app/utils/response";
import { NextResponse } from "next/server";
import SpotifyWebApi from "spotify-web-api-node";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

// Fetch album info and tracks from Last.fm
async function getLastFMAlbumInfo(albumName: string, artistName: string) {
  const data = (await callLastFMAPI("album.getInfo", {
    artist: artistName,
    album: albumName,
  })) as LastFMAPIResponse;

  const album: LastFMAlbum = data.album || {} as LastFMAlbum;
  // Last.fm API can return single track object or array - normalize to array
  const tracks = album.tracks?.track || [];
  const trackArray = normalizeLastFMArray(tracks);

  // Convert Last.fm image format to Spotify format
  const images = convertLastFMImages(album.image);

  const albumArtistName = typeof album.artist === "string" ? album.artist : album.artist?.name || "";

  // Convert Last.fm tracks to Spotify format
  const spotifyTracks: SpotifyTrack[] = trackArray.map((track: LastFMTrack, index: number) => ({
    id: `lastfm-track-${index}`, // Generate synthetic ID since Last.fm doesn't provide track IDs
    name: track.name || "",
    artists: albumArtistName ? [{ id: "", name: albumArtistName, external_urls: { spotify: "" } }] : [],
    duration_ms: track.duration ? (parseInt(track.duration, 10) * 1000 || 0) : 0, // Convert seconds to milliseconds
    track_number: index + 1,
    preview_url: null, // Last.fm doesn't provide preview URLs
    external_urls: {
      spotify: track.url || "", // Last.fm track URL (not Spotify, but keeps format consistent)
    },
  }));

    // Format album to match SpotifyAlbumWithTracks interface
    const formattedAlbum: SpotifyAlbumWithTracks = {
      id: createLastFMAlbumId(albumName, albumArtistName),
      name: album.name || albumName,
      artists: albumArtistName ? [{ id: "", name: albumArtistName, external_urls: { spotify: "" } }] : [],
      images: images,
      release_date: album.wiki?.published || album.releasedate || "",
      release_date_precision: album.wiki?.published ? "day" as const : (album.releasedate ? "year" as const : "day" as const),
      total_tracks: trackArray.length,
      genres: album.tags?.tag ? (Array.isArray(album.tags.tag) ? album.tags.tag : [album.tags.tag])
        .map((t: any) => t.name)
        .filter(Boolean) : [],
      popularity: 0, // Last.fm doesn't provide popularity score
      album_type: "album",
      external_urls: {
        spotify: "", // No Spotify link for Last.fm-only albums
      },
      tracks: {
        items: spotifyTracks,
        total: trackArray.length,
      },
      // Add Last.fm specific data (not in Spotify format, but useful)
      lastfm: {
        url: album.url || "",
        playcount: album.playcount ? (parseInt(album.playcount, 10) || 0) : 0,
        listeners: album.listeners ? (parseInt(album.listeners, 10) || 0) : 0,
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
    // Check if this is a Last.fm album ID (format: lastfm::album::artist)
    const parsed = parseLastFMAlbumId(decodedId);
    if (parsed) {
      const album = await getLastFMAlbumInfo(parsed.albumName, parsed.artistName);
      return NextResponse.json(album);
    }

    // Otherwise, treat as Spotify ID
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      return serverErrorResponse("Spotify credentials not configured");
    }

    // Get client credentials token (no user auth needed for public album data)
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);

    // Fetch album details
    const albumResponse = await spotifyApi.getAlbum(decodedId);
    const album = albumResponse.body;

    // Fetch all tracks (Spotify's getAlbum only returns first 50 tracks)
    // Paginate through all tracks for albums with more than 50 tracks
    const allTracks: any[] = [];
    let offset = 0;
    const limit = 50; // Spotify's max per request

    while (offset < album.tracks.total) {
      const tracksResponse = await spotifyApi.getAlbumTracks(decodedId, {
        limit: limit,
        offset: offset,
      });

      allTracks.push(...tracksResponse.body.items);
      offset += limit;

      // Break early if we got fewer tracks than requested (end of list)
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
        items: allTracks, // All tracks, not just first 50
        total: album.tracks.total,
      },
    };

    return NextResponse.json(formattedAlbum);
  } catch (err: any) {
    console.error("Error fetching album:", {
      error: err instanceof Error ? err.message : String(err),
      albumId: decodedId,
    });
    return serverErrorResponse(err.message || "Failed to fetch album");
  }
}
