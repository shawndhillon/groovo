/**
 * GET /api/genre-seeds
 * Returns a list of genres from Last.fm API
 * Fetches from Last.fm's chart.getTopTags endpoint
 */

import { NextResponse } from "next/server";

const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "";

// Default popular genres organized by category
const POPULAR_GENRES_BY_CATEGORY = [
  {
    category: "Pop",
    genres: ["pop", "dance-pop", "synthpop", "electropop", "bubblegum pop", "chamber pop"]
  },
  {
    category: "Rock",
    genres: ["rock", "classic rock", "hard rock", "punk rock", "post-punk", "alternative rock", "indie rock", "grunge", "progressive rock", "psychedelic rock", "glam rock", "garage rock", "southern rock", "folk rock", "blues rock", "gothic rock"]
  },
  {
    category: "Metal",
    genres: ["heavy metal", "thrash metal", "death metal", "black metal", "doom metal", "power metal", "progressive metal", "nu metal", "metalcore", "symphonic metal", "gothic metal"]
  },
  {
    category: "Electronic",
    genres: ["electronic", "edm", "house", "deep house", "techno", "trance", "drum and bass", "jungle", "dubstep", "electro", "ambient", "idm", "downtempo", "acid house"]
  },
  {
    category: "Hip-Hop",
    genres: ["hip-hop", "rap", "trap", "boom bap", "gangsta rap", "conscious hip hop", "alternative hip hop"]
  },
  {
    category: "R&B & Soul",
    genres: ["rnb", "contemporary rnb", "soul", "neo-soul", "funk", "disco"]
  },
  {
    category: "Country & Folk",
    genres: ["country", "classic country", "contemporary country", "americana", "bluegrass", "folk"]
  },
  {
    category: "Jazz",
    genres: ["jazz", "bebop", "cool jazz", "hard bop", "jazz fusion", "smooth jazz", "avant-garde jazz", "free jazz", "latin jazz"]
  },
  {
    category: "World Music",
    genres: ["reggae", "ska", "dancehall", "afrobeat", "highlife", "soukous", "samba", "bossa nova", "tango", "flamenco", "k-pop", "j-pop", "cantopop", "mandopop", "bollywood", "gagaku", "middle eastern"]
  },
  {
    category: "Experimental & Alternative",
    genres: ["experimental", "noise", "post-rock", "shoegaze", "lo-fi", "chillwave", "vaporwave", "industrial", "math rock", "minimalism"]
  },
  {
    category: "Classical",
    genres: ["classical", "contemporary classical", "film score", "soundtrack", "choral", "sacred"]
  }
];

// Flatten for API response
const POPULAR_GENRES = POPULAR_GENRES_BY_CATEGORY.flatMap(cat => cat.genres).map(g => g.toLowerCase());


// Filter out invalid tags that don't work with tag.getTopAlbums
function filterInvalidTags(tags: string[]): string[] {
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
    // Filter out invalid tags
    if (invalidTags.has(lower)) return false;
    // Filter out tags that are too short or too long
    if (lower.length < 2 || lower.length > 50) return false;
    // Filter out tags that are just numbers
    if (/^\d+$/.test(lower)) return false;
    return true;
  });
}

// Fetch top tags from Last.fm API
async function fetchLastFMTags(): Promise<string[]> {
  if (!LASTFM_API_KEY) {
    return [];
  }

  try {
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

    // Extract tag names and normalize
    const tagNames = tagArray
      .map((tag: any) => tag?.name?.toLowerCase().trim())
      .filter((name: string): name is string => Boolean(name && name.length > 0));

    if (tagNames.length > 0) {
      // Filter out invalid tags
      const validTags = filterInvalidTags(tagNames);
      return validTags.sort();
    }

    return [];
  } catch (error) {
    console.error("Error fetching Last.fm tags:", error);
    return [];
  }
}

// Cache for tags
let cachedTags: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    const now = Date.now();

    // Return cached tags
    if (cachedTags && (now - cacheTimestamp) < CACHE_TTL) {
    return NextResponse.json({
      genres: cachedTags,
      popularGenres: POPULAR_GENRES,
      popularGenresByCategory: POPULAR_GENRES_BY_CATEGORY
    });
    }

    // Fetch fresh tags from Last.fm
    const tags = await fetchLastFMTags();

    // Update cache
    cachedTags = tags;
    cacheTimestamp = now;

    return NextResponse.json({
      genres: tags,
      popularGenres: POPULAR_GENRES,
      popularGenresByCategory: POPULAR_GENRES_BY_CATEGORY
    });
  } catch (error: any) {
    console.error("Error fetching genre seeds:", error);
    return NextResponse.json({
      genres: [],
      popularGenres: POPULAR_GENRES,
      popularGenresByCategory: POPULAR_GENRES_BY_CATEGORY
    });
  }
}
