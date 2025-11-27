// TypeScript interfaces for Spotify API data

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

