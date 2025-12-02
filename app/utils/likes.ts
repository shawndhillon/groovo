/**
 * Purpose:
 *   Server-side helpers for checking like status on reviews and comments
 *
 * Scope:
 *   - API routes that need to know which items a viewer has liked
 *   - Review and comment endpoints that enrich responses with viewer like flags
 *
 * Role:
 *   - Offer batch and single item helpers for like lookups
 *   - Hide the underlying likes collection queries behind simple functions
 *
 * Deps:
 *   - MongoDB via lib/mongodb
 *
 * Notes:
 *   - Designed for server side use within API handlers
 *   - Treats unauthenticated viewers as having no likes
 *
 */

import { db } from "@/lib/mongodb";

/**
 * Purpose:
 *   Batch check which items a user has liked
 *
 * Params:
 *   - userId: user ID string or null for unauthenticated users
 *   - targetType: whether checking "review" or "comment" likes
 *   - targetIds: array of item IDs to check
 *
 * Returns:
 *   - Set of item ID strings that the user has liked
 *
 * Notes:
 *   - Returns empty Set if userId or targetIds is null
 *   - Used by API routes to attach viewer like status to multiple items at once
 */
export async function getLikedItemIds(
  userId: string | null,
  targetType: "review" | "comment",
  targetIds: string[]
): Promise<Set<string>> {
  // return empty set when there is no viewer or no ids to check
  if (!userId || targetIds.length === 0) return new Set();

  const database = await db();
  // read all like documents for this user and target ids
  const likes = await database
    .collection("likes")
    .find({
      targetType,
      targetId: { $in: targetIds },
      userId,
    })
    .toArray();

  return new Set(likes.map((l) => l.targetId));
}

/**
 * Purpose:
 *   Check if a single item is liked by a user
 *
 * Params:
 *   - userId: user ID string or null for unauthenticated users
 *   - targetType: whether checking "review" or "comment" like
 *   - targetId: item ID string to check
 *
 * Returns:
 *   - bool indicating if the item is liked
 *
 * Notes:
 *   - Returns false if userId is null
 *   - wrapper around getLikedItemIds for single item checks
 *   - Used by API routes that need like status for a single review or comment
 */
export async function isItemLiked(
  userId: string | null,
  targetType: "review" | "comment",
  targetId: string
): Promise<boolean> {
  // unauthenticated viewers never have likes
  if (!userId) return false;
  // call getLikedItemIds with a single target id so single checks use the same query as the multi item version
  const likedIds = await getLikedItemIds(userId, targetType, [targetId]);
  return likedIds.has(targetId);
}

