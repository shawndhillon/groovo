export type FeedArtist = { id?: string; name: string };
export type FeedImage = { url: string; width?: number; height?: number };

export type FeedAlbumSnapshot = {
  name?: string;
  artists?: FeedArtist[] | string[];
  images?: FeedImage[];
} | null;

export type FeedItem = {
  _id?: string | { $oid: string };
  id?: string;
  userId: string;
  albumId: string;
  rating: number;
  body: string;
  createdAt: string;
  author?: {
    id?: string;
    username?: string | null;
    name?: string | null;
    image?: string | null;
  } | null;
  albumSnapshot?: FeedAlbumSnapshot;
  likeCount?: number;
  viewerLiked?: boolean;
};

export type BatchUser = {
  id: string;
  username?: string | null;
  name?: string | null;
  image?: string | null;
};

export type FeedMode = "following" | "global";
