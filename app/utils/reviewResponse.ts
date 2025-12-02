/**
 * Purpose:
 *   Shared server side utilities for shaping review data in API responses
 *
 * Scope:
 *   - Review related API routes that need a consistent response shape
 *   - Server side features that attach author and viewer context to reviews
 *
 * Role:
 *   - Define types for review documents and response payloads
 *   - Map MongoDB review records into a normalized structure
 *   - Optionally enrich reviews with author metadata and viewer like status
 *
 * Deps:
 *   - Review types from app/types/reviews
 *   - User helpers and types from app/utils/users
 *
 * Notes:
 *   - Shared by multiple review endpoints so clients see a stable review shape
 *   - Keeps formatting logic out of individual route handlers
 *
 */

import type { ReviewAuthor } from "@/app/types/reviews";
import type { Document, WithId } from "mongodb";
import type { UserInfo } from "./users";

/**
 * Purpose:
 *   MongoDB review document shape with all review fields
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition for review documents stored in MongoDB
 *
 * Notes:
 *   - Used internally by formatReview to type review input
 *   - Includes optional likeCount and commentCount with defaults applied during formatting
 */
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

/**
 * Purpose:
 *   Formatted review response shape for API endpoints
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Type definition for review data with author and viewer context
 *
 * Notes:
 *   - Includes optional author and viewerLiked fields when available
 */
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

/**
 * Purpose:
 *   Format MongoDB review document into ServerReviewResponse shape with author and like status
 *
 * Params:
 *   - review: MongoDB review document to format
 *   - author: optional UserInfo for the review author
 *   - viewerLiked: optional bool indicating if current user liked the review
 *
 * Returns:
 *   - ServerReviewResponse object ready for API response
 *
 * Notes:
 *   - Always includes likeCount and commentCount with defaults
 *   - Author and viewerLiked are only added when provided
 */
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

