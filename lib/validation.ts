/**
 * Purpose:
 *   Input validation schemas and ObjectId utilities
 *
 * Scope:
 *   - Used by all API routes for request validation
 *   - Provides type-safe validation with Zod schemas
 *
 * Role:
 *   - Validates ObjectId format and converts strings to ObjectIds
 *   - Defines Zod schemas for all API request bodies
 *   - Ensures data integrity before database operations
 *
 * Deps:
 *   - zod for schema validation
 *   - mongodb for ObjectId type
 *
 * Notes:
 *   - safeObjectId returns null for invalid IDs (non-throwing)
 *   - validateObjectId throws error for invalid IDs
 *   - All schemas include appropriate min/max constraints
 */

import { ObjectId } from "mongodb";
import { z } from "zod";

export function safeObjectId(id: string | null | undefined): ObjectId | null {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * Validates ObjectId format and throws if invalid
 */
export function validateObjectId(
  id: string,
  errorMessage = "Invalid ID"
): ObjectId {
  try {
    return new ObjectId(id);
  } catch {
    throw new Error(errorMessage);
  }
}

export const PageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ReviewCreateSchema = z.object({
  albumId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(1000),
  album: z
    .object({
      name: z.string(),
      artists: z.array(z.object({ id: z.string().optional().default(""), name: z.string() })).default([]),
      images: z.array(
        z.object({
          url: z.string().url(),
          width: z.number().int(),
          height: z.number().int(),
        })
      ).default([]),
    })
    .nullable()
    .optional(),
});

export const CommentCreateSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  parentId: z.string().optional(), // for threaded replies
});

export const LikeTargetSchema = z.object({
  targetType: z.enum(["review", "comment"]),
  targetId: z.string().min(1),
  action: z.enum(["like", "unlike"]),
});

export const FavoritesTop5ItemSchema = z.object({
  rank: z.number().int().min(1).max(5),
  albumId: z.string().min(1),
});

// Allow 0–5 so users can clear favorites if they want
export const FavoritesTop5PayloadSchema = z.object({
  favorites: z
    .array(FavoritesTop5ItemSchema)
    .max(5)
    .refine(arr => new Set(arr.map(x => x.rank)).size === arr.length, "Ranks must be unique")
    .refine(arr => new Set(arr.map(x => x.albumId)).size === arr.length, "Duplicate albums are not allowed"),
});

export const FollowToggleSchema = z.object({
  targetUserId: z.string().trim().min(1),
  action: z.enum(["follow", "unfollow"]),
});
