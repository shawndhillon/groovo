/**
 * Purpose:
 *   Server-side review formatting utilities for API responses
 *
 * Scope:
 *   - Used by review API routes to format responses
 *   - Ensures consistent review shape across endpoints
 *
 * Role:
 *   - Formats MongoDB review documents into ServerReviewResponse shape
 *   - Attaches author information and viewer like status
 *   - Handles optional fields and null values consistently
 *
 * Deps:
 *   - app/types/reviews for ReviewAuthor type
 *   - app/utils/users for UserInfo type
 *
 * Notes:
 *   - Always includes likeCount and commentCount with defaults
 *   - Author and viewerLiked are optional and only added when provided
 *
 * Contributions (Shawn):
 *   - Implemented review formatting utilities and response shape
 */

import type { ReviewAuthor } from "@/app/types/reviews";
import type { Document, WithId } from "mongodb";
import type { UserInfo } from "./users";


export type ReviewDocument = WithId<Document> & {
  userId: string;
  albumId: string;
  rating: number;
  body: string;
  likeCount?: number;
  commentCount?: number;
  createdAt: Date;
  updatedAt: Date;
  albumSnapshot?: any;
  deletedAt?: Date | null;
};


export type ServerReviewResponse = {
  _id: string;
  id: string;
  userId: string;
  albumId: string;
  rating: number;
  body: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  albumSnapshot: any | null;
  author?: ReviewAuthor;
  viewerLiked?: boolean;
};


export function formatReview(
  review: ReviewDocument | WithId<Document>,
  author?: UserInfo | null,
  viewerLiked?: boolean
): ServerReviewResponse {
  const r = review as ReviewDocument;
  const formatted: ServerReviewResponse = {
    _id: String(r._id),
    id: String(r._id),
    userId: r.userId,
    albumId: r.albumId,
    rating: r.rating,
    body: r.body,
    likeCount: r.likeCount ?? 0,
    commentCount: r.commentCount ?? 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    albumSnapshot: r.albumSnapshot ?? null,
  };

  if (author) {
    formatted.author = {
      id: author.id,
      username: author.username,
      name: author.name,
      image: author.image,
    } as ReviewAuthor;
  }

  if (viewerLiked !== undefined) {
    formatted.viewerLiked = viewerLiked;
  }

  return formatted;
}

