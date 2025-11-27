import { db } from "@/lib/mongodb";

let done = false;

export async function ensureIndexes() {
  if (done) return; done = true;
  const database = await db();

  // Helper to safely create indexes - handles conflicts
  async function safeCreateIndexes(collection: string, indexes: any[]) {
    for (const idx of indexes) {
      try {
        const indexOptions: any = {
          name: idx.name,
          background: true
        };
        // Only include unique if set to true
        if (idx.unique === true) {
          indexOptions.unique = true;
        }
        await database.collection(collection).createIndex(idx.key, indexOptions);
      } catch (e: any) {
        // If index already exists, check if structure matches
        if (e?.code === 86 || e?.codeName === "IndexKeySpecsConflict" || e?.code === 85) {
          try {
            const existingIndexes = await database.collection(collection).indexes();
            const existing = existingIndexes.find((i: any) => i.name === idx.name);
            if (existing) {
              const existingKeys = JSON.stringify(existing.key);
              const newKeys = JSON.stringify(idx.key);
              const existingUnique = existing.unique || false;
              const newUnique = idx.unique || false;
              // If structure is different, drop and recreate
              if (existingKeys !== newKeys || existingUnique !== newUnique) {
                try {
                  await database.collection(collection).dropIndex(idx.name);
                  const indexOptions: any = {
                    name: idx.name,
                    background: true
                  };
                  // Only include unique if set to true
                  if (idx.unique === true) {
                    indexOptions.unique = true;
                  }
                  await database.collection(collection).createIndex(idx.key, indexOptions);
                } catch {
                  // Ignore errors during drop/recreate
                }
              }
            }
          } catch {
            // Ignore errors checking indexes
          }
        } else if (e?.code !== 85) {
          // Code 85 = IndexOptionsConflict (index exists with same name but different options)
          // Log other errors
          console.warn(`Index creation warning for ${collection}.${idx.name}:`, e.message);
        }
      }
    }
  }

  await safeCreateIndexes("reviews", [
    { key: { userId: 1, albumId: 1 }, name: "uniq_user_album", unique: true },
    { key: { albumId: 1, createdAt: -1 }, name: "by_album_created" },
    { key: { userId: 1, createdAt: -1 }, name: "by_user_created" },
    { key: { deletedAt: 1 }, name: "by_deleted" },
  ]);

  await safeCreateIndexes("comments", [
    { key: { reviewId: 1, parentId: 1, createdAt: -1 }, name: "by_review_parent_created" },
    { key: { userId: 1, createdAt: -1 }, name: "by_user_created" },
    { key: { deletedAt: 1 }, name: "by_deleted" },
  ]);

  await safeCreateIndexes("likes", [
    { key: { targetType: 1, targetId: 1, userId: 1 }, name: "uniq_like", unique: true },
    { key: { targetType: 1, targetId: 1 }, name: "by_target" },
  ]);

  await database.collection("albums").createIndexes([
    { key: { userId: 1, albumId: 1 }, name: "uniq_user_album", unique: true },
    { key: { userId: 1, savedAt: -1 }, name: "by_user_savedAt_desc" },
  ]);
  // Handle follows indexes - check for old structure
  try {
    const existingIndexes = await database.collection("follows").indexes();
    const uniqFollowIndex = existingIndexes.find((idx: any) => idx.name === "uniq_follow");
    if (uniqFollowIndex) {
      const keys = uniqFollowIndex.key;
      // If it's the old structure (followingId instead of targetUserId), drop it
      if (keys.followingId && !keys.targetUserId) {
        try {
          await database.collection("follows").dropIndex("uniq_follow");
        } catch {
          // Ignore if already dropped
        }
      }
    }
  } catch {
    // Ignore errors checking indexes
  }

  await safeCreateIndexes("follows", [
    { key: { followerId: 1, targetUserId: 1 }, name: "uniq_follow", unique: true },
    { key: { followerId: 1, createdAt: -1 }, name: "by_follower_created" },
    { key: { targetUserId: 1, createdAt: -1 }, name: "by_target_created" },
  ]);

  await safeCreateIndexes("users", [
    { key: { username: 1 }, name: "by_username" },
    { key: { name: 1 }, name: "by_name" },
  ]);

}

