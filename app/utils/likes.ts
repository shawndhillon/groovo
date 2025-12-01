/**
 * Purpose:
 *   Server-side utilities for checking like status
 *
 * Scope:
 *   - Used by API routes that need to check if items are liked
 *   - Supports both reviews and comments
 *
 * Role:
 *   - Batch checks like status for multiple items efficiently
 *   - Returns Set of liked item IDs for fast lookups
 *   - Provides single-item like check helper
 *
 * Deps:
 *   - lib/mongodb for database access
 *
 * Notes:
 *   - Returns empty Set if userId is null (unauthenticated users)
 *   - Only queries non-deleted items (deletedAt: null)
 *
 * Contributions (Shawn):
 *   - Implemented like status checking utilities
 */

import { db } from "@/lib/mongodb";

export async function getLikedItemIds(
  userId: string | null,
  targetType: "review" | "comment",
  targetIds: string[]
): Promise<Set<string>> {
  if (!userId || targetIds.length === 0) return new Set();

  const database = await db();
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

export async function isItemLiked(
  userId: string | null,
  targetType: "review" | "comment",
  targetId: string
): Promise<boolean> {
  if (!userId) return false;
  const likedIds = await getLikedItemIds(userId, targetType, [targetId]);
  return likedIds.has(targetId);
}

