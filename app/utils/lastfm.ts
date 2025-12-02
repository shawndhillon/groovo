/**
 * Purpose:
 *   Utilities for talking to Last.fm API and shaping its data
 *
 * Scope:
 *   - API routes that fetch album and genre data from Last.fm
 *   - Features that need to convert Last.fm responses into Spotify-like shapes
 *
 * Role:
 *   - Wrap low level Last.fm HTTP calls in a small helper
 *   - Normalize Last.fm response shapes into predictable arrays and objects
 *   - Convert images, tags, and IDs into forms the rest of the app can reuse
 *
 * Deps:
 *   - LASTFM_API_KEY environment variable
 *   - app/types/lastfm for type definitions that mirror the API
 *
 * Notes:
 *   - Central place for Last.fm specific quirks like error codes and tag filtering
 *   - Keeps external API details out of individual route handlers
 *
 */

import type { LastFMImage } from "@/app/types/lastfm";

// Last.fm API constants
export const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
export const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";

/**
 * Purpose:
 *   Normalize Last.fm API responses that can be single objects or arrays
 *
 * Params:
 *   - item: value that may be a single object, array, undefined, or null
 *
 * Returns:
 *   - array of items (empty array if input is null/undefined)
 *
 * Notes:
 *   - Last.fm API returns single objects or arrays for many fields
 *   - Used internally by Last.fm utility functions to handle API response variations
 */
export function normalizeLastFMArray<T>(item: T | T[] | undefined | null): T[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

/**
 * Purpose:
 *   Convert Last.fm image format to Spotify compatible image format
 *
 * Params:
 *   - lastfmImage: Last.fm image object or array with "#text" and "size" fields
 *
 * Returns:
 *   - array of image objects with url, height, and width fields
 *
 * Notes:
 *   - Maps Last.fm size strings (small, medium, large, etc) to pixel dimensions
 *   - Sorts images by size (largest first) for client display
 *   - Used when converting Last.fm album data to Spotify compatible format
 */
export function convertLastFMImages(
  lastfmImage: LastFMImage | LastFMImage[] | undefined | null
): Array<{ url: string; height?: number; width?: number }> {
  if (!lastfmImage) return [];

  const imageArray = normalizeLastFMArray(lastfmImage);
  const sizeMap: Record<string, number> = {
    small: 34,
    medium: 64,
    large: 174,
    extralarge: 300,
    mega: 600,
  };

  return imageArray
    .filter((img) => img && img["#text"] && img["#text"].trim().length > 0)
    .map((img) => {
      const size = sizeMap[img.size?.toLowerCase() || ""] || 300;
      return {
        url: img["#text"],
        height: size,
        width: size,
      };
    })
    .sort((a, b) => (b.height || 0) - (a.height || 0));
}

/**
 * Purpose:
 *   Create a unique album ID string from Last.fm album and artist names
 *
 * Params:
 *   - albumName: name of the album
 *   - artistName: name of the artist
 *
 * Returns:
 *   - string ID in format "lastfm::album::artist" with URL encoded names
 *
 * Notes:
 *   - Used to identify Last.fm albums when Spotify data is not available
 *   - ID format allows parsing back to album
 */
export function createLastFMAlbumId(
  albumName: string,
  artistName: string
): string {
  return `lastfm::${encodeURIComponent(albumName)}::${encodeURIComponent(
    artistName
  )}`;
}

/**
 * Purpose:
 *   Parse a Last.fm album ID back into album and artist names
 *
 * Params:
 *   - id: Last.fm album ID string in format "lastfm::album::artist"
 *
 * Returns:
 *   - object with albumName and artistName, or null if ID format is invalid
 *
 * Notes:
 *   - Returns null if ID does not start with "lastfm::"
 *   - Used when working with Last.fm album IDs stored in the db
 */
export function parseLastFMAlbumId(
  id: string
): { albumName: string; artistName: string } | null {
  if (!id.startsWith("lastfm::")) return null;
  const parts = id.split("::");
  if (parts.length !== 3) return null;
  return {
    albumName: decodeURIComponent(parts[1]),
    artistName: decodeURIComponent(parts[2]),
  };
}

/**
 * Purpose:
 *   Make an auth request to the Last.fm API
 *
 * Params:
 *   - method: Last.fm API method name (ex: tag.getTopAlbums)
 *   - params: optional object with additional API parameters
 *
 * Returns:
 *   - Promise that resolves to the API response data
 *
 * Notes:
 *   - Requires LASTFM_API_KEY environment variable
 *   - Throws error if API returns error code (ex: code 6 for invalid tag/genre)
 */
export async function callLastFMAPI(
  method: string,
  params: Record<string, string> = {}
): Promise<any> {
  if (!LASTFM_API_KEY) {
    throw new Error("LASTFM_API_KEY not configured");
  }

  const urlParams = new URLSearchParams({
    method,
    api_key: LASTFM_API_KEY,
    format: "json",
    ...params,
  });

  const response = await fetch(`${LASTFM_API_BASE}?${urlParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    const errorCode = data.error;
    const errorMsg = data.message || String(errorCode) || "Unknown error";

    // Error code 6 = invalid tag/genre
    if (errorCode === 6) {
      throw new Error(`Invalid tag/genre: ${errorMsg}`);
    }

    throw new Error(`Last.fm API error: ${errorMsg}`);
  }

  return data;
}

/**
 * Purpose:
 *   Filter out invalid genre tags from Last.fm API responses
 *
 * Params:
 *   - tags: array of tag strings to filter
 *
 * Returns:
 *   - array of valid genre tag strings
 *
 * Notes:
 *   - Removes user based, cities, and other non genre tags
 *   - Filters by length (2-50 characters), format, and blacklist of invalid terms
 *   - Used when processing Last.fm genre tags for the genre selector
 */
export function filterInvalidTags(tags: string[]): string[] {
  const invalidTags = new Set([
    "albums i own", "albums-i-own", "my albums", "my-albums",
    "favorites", "library", "collection",
    "favorite", "favourite",
    "albums", "music", "songs", "tracks", "artists", "bands",
    "city", "cities",
    "tv-soundtrack", "tv soundtrack", "movie-soundtrack", "movie soundtrack",
    "all", "everything", "misc", "other", "unknown",
  ]);

  return tags.filter(tag => {
    const lower = tag.toLowerCase().trim();
    if (invalidTags.has(lower)) return false;
    if (lower.length < 2 || lower.length > 50) return false;
    if (/^\d+$/.test(lower)) return false;
    return true;
  });
}

