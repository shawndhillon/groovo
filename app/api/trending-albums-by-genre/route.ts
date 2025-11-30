import type { LastFMAlbum, LastFMTopAlbumsResponse } from "@/app/types/lastfm";
import {
  callLastFMAPI,
  convertLastFMImages,
  createLastFMAlbumId,
  normalizeLastFMArray,
} from "@/app/utils/lastfm";
import { errorResponse, notFoundResponse, serverErrorResponse } from "@/app/utils/response";
import { NextResponse } from "next/server";
// Documentation: https://www.last.fm/api/intro
/**
 * GET /api/trending-albums-by-genre
 * Returns the top albums for a given genre using Last.fm API
 */

// In memory cache for results
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const resultCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Cache for Spotify album lookups to avoid duplicate searches
const spotifyAlbumCache = new Map<string, { data: any; expiresAt: number }>();
const SPOTIFY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getTopAlbumsFromLastFM(genre: string, limit: number = 5, page: number = 1): Promise<LastFMAlbum[]> {
  const data = (await callLastFMAPI("tag.getTopAlbums", {
    tag: genre,
    limit: limit.toString(),
    page: page.toString(),
  })) as LastFMTopAlbumsResponse;

  // Last.fm API can return single object or array - normalize to array
  const albums = data.albums?.album || [];
  const albumArray = normalizeLastFMArray(albums);

  // Filter out any invalid entries (must have name and artist)
  const validAlbums = albumArray.filter((album: LastFMAlbum) =>
    album && album.name && (album.artist?.name || album.artist)
  );

  // Return valid albums (slice to ensure we don't exceed limit)
  return validAlbums.slice(0, limit);
}

async function enrichWithSpotifyData(albums: LastFMAlbum[]): Promise<any[]> {
  // If Spotify credentials not configured, return Last.fm data as-is
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return albums;
  }

  try {
    // Dynamic import to avoid loading Spotify library if not needed
    const SpotifyWebApi = (await import("spotify-web-api-node")).default;
    const spotify = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    });

    // Get client credentials token (no user auth needed for search)
    const tokenData = await spotify.clientCredentialsGrant();
    spotify.setAccessToken(tokenData.body.access_token);

    // Process albums in parallel with caching and timeout
    // Use Promise.allSettled so one failure doesn't block others
    const enrichedAlbums = await Promise.allSettled(
      albums.map(async (album: LastFMAlbum) => {
        try {
          const artistName = typeof album.artist === "string" ? album.artist : album.artist?.name || "";

          // Check cache first (24-hour TTL for Spotify lookups)
          const cacheKey = `${album.name}::${artistName}`;
          const cached = spotifyAlbumCache.get(cacheKey);
          if (cached && Date.now() < cached.expiresAt) {
            return {
              ...cached.data,
              playcount: album.playcount ? (parseInt(album.playcount, 10) || 0) : 0, // Keep Last.fm playcount
            };
          }

          // Search for album on Spotify with 3-second timeout
          // Timeout prevents slow searches from blocking the entire response
          const query = `album:"${album.name}" artist:"${artistName}"`;
          const searchPromise = spotify.searchAlbums(query, { limit: 1 });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Search timeout")), 3000)
          );

          const searchResp = await Promise.race([searchPromise, timeoutPromise]) as any;
          const spotifyAlbum = searchResp.body.albums?.items?.[0];

          if (spotifyAlbum) {
            // Use search result directly (skip full album fetch for speed (Full fetch gives popularity))
            const result = {
              id: spotifyAlbum.id,
              name: spotifyAlbum.name,
              artists: spotifyAlbum.artists?.map((a: any) => ({ id: a.id, name: a.name })) || [],
              images: spotifyAlbum.images && spotifyAlbum.images.length > 0
                ? spotifyAlbum.images
                : convertLastFMImages(album.image), // Fallback to Last.fm images
              release_date: spotifyAlbum.release_date || "",
              precision: spotifyAlbum.release_date_precision || "day",
              url: spotifyAlbum.external_urls?.spotify || "",
              popularity: 0, // Skip popularity fetch for speed
              playcount: album.playcount ? (parseInt(album.playcount, 10) || 0) : 0, // Keep Last.fm playcount
            };

            // Cache result for 24 hours
            spotifyAlbumCache.set(cacheKey, {
              data: result,
              expiresAt: Date.now() + SPOTIFY_CACHE_TTL,
            });

            return result;
          }
        } catch (error) {
          const artistName = typeof album.artist === "string" ? album.artist : album.artist?.name || "";
          console.error(`Error enriching album "${album.name}" with Spotify data:`, {
            error: error instanceof Error ? error.message : String(error),
            album: album.name,
            artist: artistName,
          });
          // Fall through to Last.fm fallback
        }

        // Fallback to Last.fm data only (still useful even without Spotify)
        const lastfmImages = convertLastFMImages(album.image);
        const artistName = typeof album.artist === 'string' ? album.artist : (album.artist?.name || '');

        return {
          id: createLastFMAlbumId(album.name || '', artistName),
          name: album.name,
          artists: album.artist ? [{ name: artistName }] : [],
          images: lastfmImages,
          release_date: "",
          precision: "day" as const,
          url: album.url || "",
          popularity: 0,
          playcount: album.playcount ? (parseInt(album.playcount, 10) || 0) : 0,
        };
      })
    );

    return enrichedAlbums.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      const album = albums[index];
      const lastfmImages = convertLastFMImages(album.image);
      const artistName = typeof album.artist === 'string' ? album.artist : (album.artist?.name || '');
      return {
        id: createLastFMAlbumId(album.name, artistName),
        name: album.name,
        artists: album.artist ? [{ name: artistName }] : [],
        images: lastfmImages,
        release_date: "",
        precision: "day" as const,
        url: album.url || "",
        popularity: 0,
        playcount: album.playcount ? (parseInt(album.playcount, 10) || 0) : 0,
      };
    });
  } catch (error) {
    console.error("Error enriching with Spotify data:", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Return Last.fm data as is if enrichment fails
    return albums.map((album: LastFMAlbum) => {
      const lastfmImages = convertLastFMImages(album.image);
      const artistName = typeof album.artist === 'string' ? album.artist : (album.artist?.name || '');
      return {
        id: createLastFMAlbumId(album.name, artistName),
        name: album.name,
        artists: album.artist ? [{ name: artistName }] : [],
        images: lastfmImages,
        release_date: "",
        precision: "day" as const,
        url: album.url || "",
        popularity: 0,
        playcount: album.playcount ? (parseInt(album.playcount, 10) || 0) : 0,
      };
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genreInput = searchParams.get("genre")?.trim();
  const limitParam = searchParams.get("limit");
  const pageParam = searchParams.get("page");

  // Validate genre parameter
  if (!genreInput || genreInput.length === 0) {
    return errorResponse("Genre parameter is required", 400);
  }

  // Validate genre length to prevent extremely long inputs
  if (genreInput.length > 100) {
    return errorResponse("Genre name too long (max 100 characters)", 400);
  }

  try {
    const genre = genreInput.toLowerCase();
    const limit = limitParam ? Math.min(parseInt(limitParam) || 5, 50) : 5; // Max 50 per Last.fm API
    const page = pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1;

    // Check cache (only cache default page 1, limit 5 to keep cache minimal)
    const cacheKey = `lastfm::${genre}::${limit}::${page}`;
    const cached = resultCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt && page === 1 && limit === 5) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
      });
    }

    // Get top albums from Last.fm
    let lastfmAlbums: LastFMAlbum[] = [];
    try {
      lastfmAlbums = await getTopAlbumsFromLastFM(genre, limit, page);
    } catch (lastfmError: any) {
      console.error(`Error fetching albums for genre "${genre}":`, {
        error: lastfmError instanceof Error ? lastfmError.message : String(lastfmError),
        genre,
      });
      return serverErrorResponse(
        `Failed to fetch albums for genre "${genre}". ${lastfmError.message || "Try a different genre."}`
      );
    }

    if (lastfmAlbums.length === 0) {
      return notFoundResponse(`No albums found for genre "${genre}". Try a different genre.`);
    }

    // Enrich with Spotify data if available (falls back to Last.fm if Spotify fails)
    const enrichedAlbums = await enrichWithSpotifyData(lastfmAlbums);

    // Sort by Spotify popularity first, then by Last.fm playcount as fallback
    // This prioritizes albums that are popular on Spotify, but still shows Last.fm-only albums
    enrichedAlbums.sort((a, b) => {
      if (a.popularity > 0 && b.popularity > 0) {
        return b.popularity - a.popularity;
      }
      if (a.popularity > 0) return -1; // Spotify albums before Last.fm-only
      if (b.popularity > 0) return 1;
      // Both Last.fm-only: sort by playcount
      return (b.playcount || 0) - (a.playcount || 0);
    });

    // Format response (only include fields needed by frontend)
    const payload = enrichedAlbums.map((album: any) => ({
      id: album.id,
      name: album.name,
      artists: album.artists || [],
      images: album.images || [],
      release_date: album.release_date || "",
      precision: album.precision || "day",
      url: album.url || "",
    }));

    const result = {
      genre: genre,
      count: payload.length,
      items: payload,
      page: page,
      limit: limit,
      hasMore: payload.length === limit, // Indicates if there might be more pages
    };

    // Cache the result (only default queries to keep cache size manageable)
    if (page === 1 && limit === 5) {
      resultCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + CACHE_TTL,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching albums:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return serverErrorResponse(error.message || "Internal server error");
  }
}

