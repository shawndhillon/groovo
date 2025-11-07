import { db } from "@/lib/mongodb";

let done = false;

export async function ensureIndexes() {
  if (done) return; done = true;
  const database = await db();

  await database.collection("reviews").createIndexes([
    { key: { userId: 1, albumId: 1 }, name: "uniq_user_album", unique: true },
    { key: { albumId: 1, createdAt: -1 }, name: "by_album_created" },
    { key: { userId: 1, createdAt: -1 }, name: "by_user_created" },
    { key: { deletedAt: 1 }, name: "by_deleted" },
  ]);

  await database.collection("comments").createIndexes([
    { key: { reviewId: 1, parentId: 1, createdAt: -1 }, name: "by_review_parent_created" },
    { key: { userId: 1, createdAt: -1 }, name: "by_user_created" },
    { key: { deletedAt: 1 }, name: "by_deleted" },
  ]);

  await database.collection("likes").createIndexes([
    { key: { targetType: 1, targetId: 1, userId: 1 }, name: "uniq_like", unique: true },
    { key: { targetType: 1, targetId: 1 }, name: "by_target" },
  ]);

  await database.collection("albums").createIndexes([
    { key: { userId: 1, albumId: 1 }, name: "uniq_user_album", unique: true },
    { key: { userId: 1, savedAt: -1 }, name: "by_user_savedAt_desc" },
  ]);
}
