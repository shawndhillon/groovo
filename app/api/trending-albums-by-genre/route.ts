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

// Last.fm API base URL
const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";

/**
 * Convert Last.fm image format to Spotify image format
 * Last.fm: [{ "#text": "url", "size": "small" }, ...]
 * Spotify: [{ "url": "url", "height": 640, "width": 640 }, ...]
 */
function convertLastFMImages(lastfmImage: any): Array<{ url: string; height?: number; width?: number }> {
  if (!lastfmImage) return [];

  // Handle array of images
  const imageArray = Array.isArray(lastfmImage) ? lastfmImage : [lastfmImage];

  // Filter out empty images and convert format
  const converted = imageArray
    .filter((img: any) => img && img["#text"] && img["#text"].trim().length > 0)
    .map((img: any) => {
      const url = img["#text"];
      // Prefer larger images
      const sizeMap: Record<string, number> = {
        "small": 34,
        "medium": 64,
        "large": 174,
        "extralarge": 300,
        "mega": 600,
      };
      const size = sizeMap[img.size?.toLowerCase() || ""] || 300;

      return {
        url,
        height: size,
        width: size,
      };
    });

  return converted.sort((a, b) => (b.height || 0) - (a.height || 0));
}


// Get top albums by genre from Last.fm
async function getTopAlbumsFromLastFM(genre: string, limit: number = 5, page: number = 1): Promise<any[]> {
  if (!LASTFM_API_KEY) {
    throw new Error("LASTFM_API_KEY environment variable is not set");
  }

  const params = new URLSearchParams({
    method: "tag.getTopAlbums",
    tag: genre,
    api_key: LASTFM_API_KEY,
    format: "json",
    limit: limit.toString(),
    page: page.toString(),
  });

  const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    const errorCode = data.error;
    const errorMsg = data.message || String(errorCode) || "Unknown error";

    if (errorCode === 6) {
      throw new Error(`Invalid genre/tag: "${genre}" is not a valid Last.fm tag`);
    }

    throw new Error(`Last.fm API error: ${errorMsg}`);
  }

  const albums = data.albums?.album || [];

  const albumArray = Array.isArray(albums) ? albums : albums ? [albums] : [];

  // Filter out any invalid entries
  const validAlbums = albumArray.filter((album: any) =>
    album && album.name && (album.artist?.name || album.artist)
  );

  // Return valid albums
  return validAlbums.slice(0, limit);
}

// Enrich Last.fm album data with Spotify data
async function enrichWithSpotifyData(albums: any[]): Promise<any[]> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return albums;
  }

  try {
    const SpotifyWebApi = (await import("spotify-web-api-node")).default;
    const spotify = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    });

    const tokenData = await spotify.clientCredentialsGrant();
    spotify.setAccessToken(tokenData.body.access_token);

    // Process albums in parallel with caching and timeout
    const enrichedAlbums = await Promise.allSettled(
      albums.map(async (album: any) => {
        try {
          // Check cache
          const cacheKey = `${album.name}::${album.artist?.name || ""}`;
          const cached = spotifyAlbumCache.get(cacheKey);
          if (cached && Date.now() < cached.expiresAt) {
            return {
              ...cached.data,
              playcount: parseInt(album.playcount) || 0,
            };
          }

          // Search for album on Spotify with timeout (3 seconds max)
          const query = `album:"${album.name}" artist:"${album.artist?.name || ""}"`;
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
                : convertLastFMImages(album.image),
              release_date: spotifyAlbum.release_date || "",
              precision: spotifyAlbum.release_date_precision || "day",
              url: spotifyAlbum.external_urls?.spotify || "",
              popularity: 0, // Skip popularity fetch for speed
              playcount: parseInt(album.playcount) || 0,
            };

            // Cache result
            spotifyAlbumCache.set(cacheKey, {
              data: result,
              expiresAt: Date.now() + SPOTIFY_CACHE_TTL,
            });

            return result;
          }
        } catch (error) {

        }

        // Fallback to Last.fm data
        const lastfmImages = convertLastFMImages(album.image);
        const artistName = album.artist?.name || (typeof album.artist === 'string' ? album.artist : '');

        return {
          id: `lastfm::${encodeURIComponent(album.name)}::${encodeURIComponent(artistName)}`,
          name: album.name,
          artists: album.artist ? [{ name: artistName }] : [],
          images: lastfmImages,
          release_date: "",
          precision: "day" as const,
          url: album.url || "",
          popularity: 0,
          playcount: parseInt(album.playcount) || 0,
        };
      })
    );

    return enrichedAlbums.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      const album = albums[index];
      const lastfmImages = convertLastFMImages(album.image);
      const artistName = album.artist?.name || (typeof album.artist === 'string' ? album.artist : '');
      return {
        id: `lastfm::${encodeURIComponent(album.name)}::${encodeURIComponent(artistName)}`,
        name: album.name,
        artists: album.artist ? [{ name: artistName }] : [],
        images: lastfmImages,
        release_date: "",
        precision: "day" as const,
        url: album.url || "",
        popularity: 0,
        playcount: parseInt(album.playcount) || 0,
      };
    });
  } catch (error) {
    console.error("Error enriching with Spotify data:", error);
    // Return Last.fm data as is if enrichment fails
    return albums.map((album: any) => {
      const lastfmImages = convertLastFMImages(album.image);
      const artistName = album.artist?.name || (typeof album.artist === 'string' ? album.artist : '');
      return {
        id: `lastfm::${encodeURIComponent(album.name)}::${encodeURIComponent(artistName)}`,
        name: album.name,
        artists: album.artist ? [{ name: artistName }] : [],
        images: lastfmImages,
        release_date: "",
        precision: "day" as const,
        url: album.url || "",
        popularity: 0,
        playcount: parseInt(album.playcount) || 0,
      };
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genreInput = searchParams.get("genre")?.trim();
  const limitParam = searchParams.get("limit");
  const pageParam = searchParams.get("page");

  // Validate genre
  if (!genreInput || genreInput.length === 0) {
    return NextResponse.json(
      { error: "Genre parameter is required" },
      { status: 400 }
    );
  }

  try {
    const genre = genreInput.toLowerCase();
    const limit = limitParam ? Math.min(parseInt(limitParam) || 5, 50) : 5; // Max 50 per Last.fm
    const page = pageParam ? Math.max(1, parseInt(pageParam) || 1) : 1;

    // Check cache
    const cacheKey = `lastfm::${genre}::${limit}::${page}`;
    const cached = resultCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt && page === 1 && limit === 5) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
      });
    }

    // Get top albums from Last.fm
    let lastfmAlbums: any[] = [];
    try {
      lastfmAlbums = await getTopAlbumsFromLastFM(genre, limit, page);
    } catch (lastfmError: any) {
      console.error(`Error fetching albums for genre "${genre}":`, lastfmError);
      return NextResponse.json(
        {
          error: `Failed to fetch albums for genre "${genre}". ${lastfmError.message || "Try a different genre."}`
        },
        { status: 500 }
      );
    }

    if (lastfmAlbums.length === 0) {
      return NextResponse.json(
        { error: `No albums found for genre "${genre}". Try a different genre.` },
        { status: 404 }
      );
    }

    // Enrich with Spotify data if available
    const enrichedAlbums = await enrichWithSpotifyData(lastfmAlbums);

    // Sort by popularity (Spotify) first, then by playcount (Last.fm) as fallback
    enrichedAlbums.sort((a, b) => {
      if (a.popularity > 0 && b.popularity > 0) {
        return b.popularity - a.popularity;
      }
      if (a.popularity > 0) return -1;
      if (b.popularity > 0) return 1;

      return (b.playcount || 0) - (a.playcount || 0);
    });

    // Format response
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
      hasMore: payload.length === limit,
    };

    // Cache the result
    if (page === 1 && limit === 5) {
      resultCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + CACHE_TTL,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

