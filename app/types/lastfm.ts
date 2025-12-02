/**
 * Purpose:
 *   TypeScript type definitions for Last.fm API responses
 *
 * Scope:
 *   - Server side utilities and API routes that use Last.fm data
 *
 * Role:
 *   - Defines interfaces matching Last.fm API response structure
 *   - Handles Last.fm's flexible array/single-object patterns
 *   - Includes error response types for API failures
 *
 * Deps:
 *   - None (pure type definitions)
 *
 * Notes:
 *   - Reflects the Last.fm REST API responses used by rest of the app
 *   - Last.fm API can return single objects or arrays for many fields
 *   - Types reflect actual API structure from Last.fm documentation
 *
 */

/**
 * Purpose:
 *   Last.fm image object with URL and size information
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition matching Last.fm API image response structure
 *
 * Notes:
 *   - Used by Last.fm API integration code
 *   - "#text" field contains the image URL
 */
export interface LastFMImage {
  "#text": string;
  size: "small" | "medium" | "large" | "extralarge" | "mega";
}

/**
 * Purpose:
 *   Last.fm track information structure
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition for track data from Last.fm API
 *
 * Notes:
 *   - Used when fetching album tracklists from Last.fm
 */
export interface LastFMTrack {
  name: string;
  duration?: string;
  url?: string;
  artist?: {
    name: string;
  };
}

/**
 * Purpose:
 *   Last.fm tag/genre information structure
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition for tag data from Last.fm API
 */
export interface LastFMTag {
  name: string;
  url?: string;
}

/**
 * Purpose:
 *   Last.fm album information structure
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition for album data from Last.fm API responses
 *
 * Notes:
 *   - Artist field can be string or object with name property
 */
export interface LastFMAlbum {
  name: string;
  artist: string | { name: string };
  image?: LastFMImage | LastFMImage[];
  tracks?: {
    track?: LastFMTrack | LastFMTrack[];
  };
  tags?: {
    tag?: LastFMTag | LastFMTag[];
  };
  wiki?: {
    published?: string;
    summary?: string;
    content?: string;
  };
  releasedate?: string;
  playcount?: string;
  listeners?: string;
  url?: string;
}

/**
 * Purpose:
 *   Last.fm API response wrapper for album.getInfo method
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition for single album API responses
 *
 * Notes:
 *   - Includes error and message fields for API error handling
 */
export interface LastFMAPIResponse {
  album?: LastFMAlbum;
  error?: number;
  message?: string;
}

/**
 * Purpose:
 *   Last.fm API response wrapper for tag.getTopAlbums method
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition for top albums by tag API responses
 *
 * Notes:
 *   - Used by trending-albums-by-genre API route
 */
export interface LastFMTopAlbumsResponse {
  albums?: {
    album?: LastFMAlbum | LastFMAlbum[];
  };
  error?: number;
  message?: string;
}

/**
 * Purpose:
 *   Last.fm API response wrapper for chart.getTopTags method
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition for top tags API responses
 *
 * Notes:
 *   - Used by genre-seeds API route to fetch available genres
 */
export interface LastFMTopTagsResponse {
  tags?: {
    tag?: LastFMTag | LastFMTag[];
  };
  error?: number;
  message?: string;
}

