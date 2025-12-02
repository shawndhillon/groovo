/**
 * Purpose:
 *   Strongly-typed representations of the Spotify Web API entities we use.
 *
 * Scope:
 *   - Used by:
 *       • Album routes (/album/[id])
 *       • Search + discovery components
 *       • Any Spotify data mapping utilities
 *
 * Responsibilities:
 *   - Describe the subset of Spotify API responses that we care about.
 *   - Provide type safety when calling Spotify or handling mapped responses.
 *
 * Notes:
 *   - These types are meant to mirror Spotify's Web API, but only include
 *     the fields the app actually uses.
 *   - For review-related UI, we generally convert Spotify types into a
 *     lighter AlbumSnapshot defined in app/types/reviews.ts.
 */
export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyImage {
  url: string;
  height?: number;
  width?: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  duration_ms: number;
  track_number: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  genres: string[];
  popularity: number;
  album_type: string;
  external_urls: {
    spotify: string;
  };
}

/**
 * SpotifyAlbumWithTracks
 *
 * Represents the common pattern where an album payload includes a nested
 * "tracks" object with paging metadata.
 */
export interface SpotifyAlbumWithTracks extends SpotifyAlbum {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
  // Last.fm data
  lastfm?: {
    url: string;
    playcount: number;
    listeners: number;
  };
}

