/**
 * Purpose:
 *   Genre seeds API that powers genre selection and discovery in the app
 *
 * Scope:
 *   - GenreSelector and other UIs that need a list of genres to choose from
 *   - Discovery flows that suggest popular or curated genres
 *
 * Role:
 *   - Fetch tag data from Last.fm and turn it into a clean genre list
 *   - Provide both a comprehensive list and curated popular genres by category
 *   - Cache results to keep the endpoint fast and reduce external calls
 *
 * Deps:
 *   - Last.fm API for tag data
 *   - Last.fm utilities and types from app/utils/lastfm and app/types/lastfm
 *
 * Notes:
 *   - Uses an in memory cache with a 24-hour TTL that resets on server restart
 *   - Falls back to curated popular genres even when the API fails
 *
 */

import type { LastFMTag, LastFMTopTagsResponse } from "@/app/types/lastfm";
import { callLastFMAPI, filterInvalidTags, normalizeLastFMArray } from "@/app/utils/lastfm";
import { NextResponse } from "next/server";

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


async function fetchLastFMTags(): Promise<string[]> {
  try {
    const data = (await callLastFMAPI("chart.getTopTags", {
      limit: "1000", // Fetch large number to get comprehensive genre list
    })) as LastFMTopTagsResponse;

    // Last.fm API can return single object or array - normalize to array
    const tags = data.tags?.tag || [];
    const tagArray = normalizeLastFMArray(tags);

    // Extract tag names and normalize to lowercase
    const tagNames = tagArray
      .map((tag: LastFMTag) => tag?.name?.toLowerCase().trim())
      .filter((name: string): name is string => Boolean(name && name.length > 0));

    if (tagNames.length > 0) {
      // Filter out invalid tags (user collections, cities, etc.)
      const validTags = filterInvalidTags(tagNames);
      return validTags.sort();
    }

    return [];
  } catch (error) {
    console.error("Error fetching Last.fm tags:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

// In-memory cache for genre tags (resets on server restart)
// Cache TTL: 24 hours
let cachedTags: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Purpose:
 *   Fetch available music genres from Last.fm with popular genres by category
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - JSON response with genres array (all available), popularGenres array, and popularGenresByCategory array
 *
 * Notes:
 *   - uses in memory cache with 24-hour TTL (resets on server restart)
 *   - returns curated popular genres even if Last.fm API fails
 *   - filters tags by length, format, and blacklist
 *   - used by the GenreSelector component
 */
export async function GET() {
  try {
    const now = Date.now();

    // Return cached tags if still valid
    if (cachedTags && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json({
        genres: cachedTags,
        popularGenres: POPULAR_GENRES,
        popularGenresByCategory: POPULAR_GENRES_BY_CATEGORY
      });
    }

    // Fetch fresh tags from Last.fm API
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
    console.error("Error fetching genre seeds:", {
      error: error instanceof Error ? error.message : String(error),
    });
    // Return empty genres list but still include popular genres
    return NextResponse.json({
      genres: [],
      popularGenres: POPULAR_GENRES,
      popularGenresByCategory: POPULAR_GENRES_BY_CATEGORY
    });
  }
}
