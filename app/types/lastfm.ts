/**
 * Purpose:
 *   TypeScript type definitions for Last.fm API responses
 *
 * Scope:
 *   - Used by Last.fm API integration code
 *   - Ensures type safety when working with Last.fm data
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
 *   - Last.fm API can return single objects or arrays for many fields
 *   - Types reflect actual API structure from Last.fm documentation
 *
 * Contributions (Shawn):
 *   - Defined Last.fm API response types
 */

export interface LastFMImage {
  "#text": string;
  size: "small" | "medium" | "large" | "extralarge" | "mega";
}

export interface LastFMTrack {
  name: string;
  duration?: string;
  url?: string;
  artist?: {
    name: string;
  };
}

export interface LastFMTag {
  name: string;
  url?: string;
}

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

export interface LastFMAPIResponse {
  album?: LastFMAlbum;
  error?: number;
  message?: string;
}

export interface LastFMTopAlbumsResponse {
  albums?: {
    album?: LastFMAlbum | LastFMAlbum[];
  };
  error?: number;
  message?: string;
}

export interface LastFMTopTagsResponse {
  tags?: {
    tag?: LastFMTag | LastFMTag[];
  };
  error?: number;
  message?: string;
}

