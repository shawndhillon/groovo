/**
 * Purpose:
 *   Shared helpers for looking up and formatting user data
 *
 * Scope:
 *   - API routes that need author or profile information for reviews, comments, and follows
 *   - Server side logic that needs a consistent user shape for responses
 *
 * Role:
 *   - Provide UserInfo shape used across the app
 *   - Batch fetch user documents by ID
 *   - Small helpers for converting and formatting user identifiers
 *
 * Deps:
 *   - MongoDB via lib/mongodb
 *
 * Notes:
 *   - Intended for server side code and API routes rather than client components
 *   - Fallbacks (nulls and empty maps) instead of throwing when users are missing
 *
 */

import { db } from "@/lib/mongodb";
import { ObjectId, type Document, type WithId } from "mongodb";


type UserDocument = WithId<Document> & {
  username?: string | null;
  name?: string | null;
  image?: string | null;
};

/**
 * Purpose:
 *   User information shape used throughout the app
 *
 * Returns:
 *   - Type definition for user data with id, username, name, and image fields
 *
 * Notes:
 *   - Used by API routes and components that display user info
 *   - All fields except id can be null
 */
export type UserInfo = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

/**
 * Purpose:
 *   Convert array of string IDs to MongoDB ObjectIds, filtering out invalid ones
 *
 * Params:
 *   - ids: array of string IDs to convert
 *
 * Returns:
 *   - array of valid ObjectIds (invalid strings are skipped)
 *
 * Notes:
 *   - Used internally by fetchUsersByIds to prepare query parameters
 *   - Invalid ObjectIds are caught and excluded from the result
 */
export function stringIdsToObjectIds(ids: string[]): ObjectId[] {
  const objectIds: ObjectId[] = [];
  for (const id of ids) {
    try {
      objectIds.push(new ObjectId(id));
    } catch {
      // ignore invalid ObjectId strings so they are skipped from the batch query
    }
  }
  return objectIds;
}

/**
 * Purpose:
 *   Batch fetch user information for multiple user IDs in a single database query
 *
 * Params:
 *   - userIds: array of user ID strings to fetch
 *
 * Returns:
 *   - Map from user ID string to UserInfo object
 *
 * Notes:
 *   - Returns empty Map if no valid IDs provided
 *   - Only fetches _id, username, name, and image fields for efficiency
 *   - Used by API routes that need author info for multiple reviews or comments
 */
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

/**
 * Purpose:
 *   Fetch user info for a single user ID
 *
 * Params:
 *   - userId: user ID string to fetch
 *
 * Returns:
 *   - UserInfo object if found, null if user does not exist
 *
 * Notes:
 *   - Wrapper around fetchUsersByIds for single user lookups
 *   - Used by API routes that need author info for a single review
 */
export async function fetchUserById(userId: string): Promise<UserInfo | null> {
  const map = await fetchUsersByIds([userId]);
  return map.get(userId) ?? null;
}

/**
 * Purpose:
 *   Convert MongoDB user document to UserInfo shape
 *
 * Params:
 *   - user: MongoDB user document with _id, username, name, and image fields
 *
 * Returns:
 *   - UserInfo object with id as string and null handling
 *
 * Notes:
 *   - Converts _id ObjectId to string
 *   - Handles undefined fields converting to null
 *   - Used internally by fetchUsersByIds to format query results
 */
export function formatUserInfo(user: UserDocument): UserInfo {
  return {
    id: String(user._id),
    username: user.username ?? null,
    name: user.name ?? null,
    image: user.image ?? null,
  };
}

/**
 * Purpose:
 *   Format author info from a user ID and user map lookup
 *
 * Params:
 *   - userId: user ID string to format
 *   - userMap: Map from user ID to UserInfo (from fetchUsersByIds)
 *
 * Returns:
 *   - Author object with id, username, name, and image fields
 *
 * Notes:
 *   - Returns userId as id even if user not found in map
 *   - Used by review formatting utilities to attach author info
 *   - Falls back to null for username, name, and image if user not in map
 */
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

