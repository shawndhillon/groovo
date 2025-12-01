/**
 * Purpose:
 *   Last.fm API integration utilities and data transformation
 *
 * Scope:
 *   - Used by API routes that fetch data from Last.fm
 *   - Used for converting Last.fm data formats to Spotify-compatible shapes
 *
 * Role:
 *   - Makes authenticated requests to Last.fm API
 *   - Converts Last.fm image format to Spotify format
 *   - Creates and parses Last.fm album IDs
 *   - Filters invalid tags/genres from Last.fm responses
 *
 * Deps:
 *   - LASTFM_API_KEY environment variable
 *   - app/types/lastfm for type definitions
 *
 * Notes:
 *   - Handles Last.fm API error codes (e.g., code 6 for invalid tags)
 *   - Image conversion maps Last.fm size strings to pixel dimensions
 *   - Tag filtering removes user collections, cities, and other non-genre tags
 *
 * Contributions (Shawn):
 *   - Implemented Last.fm API integration and data transformation utilities
 */

import type { LastFMImage } from "@/app/types/lastfm";

// Last.fm API constants
export const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
export const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";


export function normalizeLastFMArray<T>(item: T | T[] | undefined | null): T[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

/**
 * Convert Last.fm image format to Spotify image format
 * Last.fm: [{ "#text": "url", "size": "small" }, ...]
 * Spotify: [{ "url": "url", "height": 640, "width": 640 }, ...]
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


export function createLastFMAlbumId(
  albumName: string,
  artistName: string
): string {
  return `lastfm::${encodeURIComponent(albumName)}::${encodeURIComponent(
    artistName
  )}`;
}


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

