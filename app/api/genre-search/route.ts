import { NextResponse } from "next/server";
/**
 * GET /api/genre-search?q=GENRE
 * Searches Last.fm for tags matching the query
 * Returns tags that work with tag.getTopAlbums
 */
const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";


// Filter out invalid tags
function isValidTag(tag: string): boolean {
  const lower = tag.toLowerCase().trim();

  const invalidTags = new Set([
    "albums i own", "albums-i-own", "my albums", "my-albums",
    "seen live", "seen-live", "favorites", "library", "collection",
    "favorite", "favourite", "albums", "music", "songs", "tracks",
    "artists", "bands", "city", "cities",
    "tv-soundtrack", "tv soundtrack", "movie-soundtrack", "movie soundtrack",
    "all", "everything", "misc", "other", "unknown",
  ]);

  if (invalidTags.has(lower)) return false;
  if (lower.length < 2 || lower.length > 50) return false;
  if (/^\d+$/.test(lower)) return false;

  return true;
}


// Check if tag works with Last.fm by trying to fetch albums
async function validateTag(tag: string): Promise<boolean> {
  if (!LASTFM_API_KEY || !isValidTag(tag)) {
    return false;
  }

  try {
    const params = new URLSearchParams({
      method: "tag.getTopAlbums",
      tag: tag,
      api_key: LASTFM_API_KEY,
      format: "json",
      limit: "1",
    });

    const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    // Tag doesn't exist
    if (data.error === 6) {
      return false;
    }

    // Tag is valid
    const albums = data.albums?.album || [];
    return Array.isArray(albums) ? albums.length > 0 : Boolean(albums);
  } catch (error) {
    return false;
  }
}

// Search for tags in Last.fm top tags that match the query
async function searchTagsInTopTags(query: string): Promise<string[]> {
  if (!LASTFM_API_KEY) {
    return [];
  }

  try {
    // Fetch a large number of top tags to search through
    const params = new URLSearchParams({
      method: "chart.getTopTags",
      api_key: LASTFM_API_KEY,
      format: "json",
      limit: "1000",
    });

    const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data.error) {
      return [];
    }

    const tags = data.tags?.tag || [];
    const tagArray = Array.isArray(tags) ? tags : tags ? [tags] : [];

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

    // Filter tags that match the query
    const matchingTags = tagArray
      .map((tag: any) => tag?.name?.toLowerCase().trim())
      .filter((name: string): name is string => {
        if (!name || !isValidTag(name)) return false;

        // Check if all words in query are in the tag name
        const allWordsMatch = queryWords.every(word => name.includes(word));
        // Check if tag name contains the full query
        const containsQuery = name.includes(queryLower);

        return allWordsMatch || containsQuery;
      });

    return matchingTags;
  } catch (error) {
    console.error("Error searching tags:", error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase();

    if (!query || query.length < 2) {
      return NextResponse.json({ genres: [] });
    }

    if (!LASTFM_API_KEY) {
      return NextResponse.json({ genres: [] });
    }

    // Search in top tags
    const matchingTags = await searchTagsInTopTags(query);

    // Also validate query as a potential tag
    const queryAsTag = query.trim();
    let validatedTags = [...matchingTags];

    // If query not in results, check if it's a valid tag
    if (!matchingTags.includes(queryAsTag) && isValidTag(queryAsTag)) {
      const isValid = await validateTag(queryAsTag);
      if (isValid) {
        validatedTags.push(queryAsTag);
      }
    }

    // Dedupe and sort
    const uniqueTags = Array.from(new Set(validatedTags)).sort();

    return NextResponse.json({ genres: uniqueTags });
  } catch (error: any) {
    console.error("Error in genre search:", error);
    return NextResponse.json({ genres: [] });
  }
}

