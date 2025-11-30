/**
 * Shape of an album result returned from the Spotify search API.
 *
 * This is a minimal subset of the full Spotify album object that
 * the UI needs to render search suggestions:
 * - id: used to build the album URL
 * - name: album title
 * - images: cover art (we usually use the first one)
 * - artists: used to display primary artist name in the dropdown
 */
export type AlbumHit = {
  id: string;
  name: string;
  images?: { url: string; height?: number; width?: number }[];
  artists?: { name: string }[];
};

/**
 * Shape of a user result returned from the internal `/api/users` search.
 *
 * This is intentionally lightweight and only includes the fields
 * needed for the search suggestions UI:
 * - id: used to build the profile URL
 * - username: shown as @username
 * - name: optional display name
 * - image: optional avatar URL (falls back to default if missing)
 */
export type UserHit = {
  id: string;
  username: string;
  name?: string | null;
  image?: string | null;
};
