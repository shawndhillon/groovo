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

