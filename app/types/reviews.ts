export type AlbumArtist = { id?: string; name?: string } | string;

export type AlbumImage = { url?: string; width?: number; height?: number };

export type AlbumSnapshot = {
  name?: string;
  artists?: AlbumArtist[];
  images?: AlbumImage[];
} | null;

export type ReviewAuthor = {
  id?: string;
  username?: string | null;
  name?: string | null;
  image?: string | null;
} | null;

export type ReviewResponse = {
  id: string;
  userId: string;
  albumId: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt?: string;
  likeCount?: number;
  commentCount?: number;
  albumSnapshot?: AlbumSnapshot;
  author?: ReviewAuthor;
  viewerLiked?: boolean;
};
