/**
 * Purpose:
 *   User data fetching and formatting utilities
 *
 * Scope:
 *   - Used by API routes that need user information (reviews, comments, profiles)
 *   - Used by components that display user data
 *
 * Role:
 *   - Batch fetches user data by IDs for efficient queries
 *   - Formats MongoDB user documents into consistent UserInfo shape
 *   - Handles ObjectId conversion and validation
 *
 * Deps:
 *   - lib/mongodb for database access
 *
 * Notes:
 *   - Invalid ObjectIds are silently filtered out in batch operations
 *   - Returns null for missing users rather than throwing errors
 *
 */

import { db } from "@/lib/mongodb";
import { ObjectId, type Document, type WithId } from "mongodb";


type UserDocument = WithId<Document> & {
  username?: string | null;
  name?: string | null;
  image?: string | null;
};

export type UserInfo = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};


export function stringIdsToObjectIds(ids: string[]): ObjectId[] {
  const objectIds: ObjectId[] = [];
  for (const id of ids) {
    try {
      objectIds.push(new ObjectId(id));
    } catch {

    }
  }
  return objectIds;
}


export async function fetchUsersByIds(
  userIds: string[]
): Promise<Map<string, UserInfo>> {
  if (userIds.length === 0) return new Map();

  const database = await db();
  const objectIds = stringIdsToObjectIds(userIds);

  if (objectIds.length === 0) return new Map();

  const users = database.collection("users");
  const userDocs = await users
    .find(
      { _id: { $in: objectIds } },
      { projection: { _id: 1, username: 1, name: 1, image: 1 } }
    )
    .toArray();

  const userMap = new Map<string, UserInfo>();
  for (const u of userDocs) {
    userMap.set(String(u._id), {
      id: String(u._id),
      username: u.username ?? null,
      name: u.name ?? null,
      image: u.image ?? null,
    });
  }

  return userMap;
}


export async function fetchUserById(userId: string): Promise<UserInfo | null> {
  const map = await fetchUsersByIds([userId]);
  return map.get(userId) ?? null;
}


export function formatUserInfo(user: UserDocument): UserInfo {
  return {
    id: String(user._id),
    username: user.username ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}


export function formatAuthor(
  userId: string,
  userMap: Map<string, UserInfo>
): {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
} {
  const user = userMap.get(userId);
  return {
    id: userId,
    username: user?.username ?? null,
    name: user?.name ?? null,
    image: user?.image ?? null,
  };
}

