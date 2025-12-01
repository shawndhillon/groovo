/**
 * Last.fm API Response Types
 *
 * These types match the actual Last.fm API response structure.
 * Reference: https://www.last.fm/api/show/album.getInfo
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

