/**
 * Purpose:
 *   Profile API (GET) endpoint for fetching public user information and stats
 *
 * Scope:
 *   - Profile pages and profile panels that show user bios and activity counts
 *   - Features that need to know if the viewer follows a given user
 *
 * Role:
 *   - Read a single user's profile data and stats
 *   - Attach viewer context such as: whether you follow this user or are viewing yourself
 *   - Handle basic ID validation and not found behavior
 *
 * Deps:
 *   - MongoDB via lib/mongodb for users, reviews, and follows collections
 *   - Validation helpers from lib/validation for safe ObjectId handling
 *   - NextAuth via authOptions and getServerSession for viewer identity
 *
 * Notes:
 *   - Always returns no cache headers so profile and stats stay fresh
 *   - Viewer context fields are populated when a session is present
 *
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { errorResponse, NO_CACHE_HEADERS, notFoundResponse } from "@/app/utils/response";
import { db } from "@/lib/mongodb";
import { safeObjectId } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Purpose:
 *   Fetch user profile information with stats and viewer context
 *
 * Params:
 *   - _req: Next.js request object (unused)
 *   - params: route parameters with id string (user ID)
 *
 * Returns:
 *   - JSON response with user object including stats and viewer context
 *
 * Notes:
 *   - assumes user may or may not be signed in
 *   - returns 404 response if user ID is invalid or user does not exist
 *   - viewer context (isSelf, youFollow) only included when session exists
 *   - always returns no cache headers for fresh data
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;

  // step 1: get MongoDB collections for users, reviews, and follows using db from lib/mongodb
  const database = await db();
  const users = database.collection("users");
  const reviews = database.collection("reviews");
  const follows = database.collection("follows");

  // step 2: convert the user id from params into a safe ObjectId using safeObjectId from lib/validation
  const _id = safeObjectId(id);
  if (!_id) {
    return errorResponse("Invalid user id", 400);
  }

  const user = await users.findOne(
    { _id },
    { projection: { _id: 1, username: 1, name: 1, image: 1, bio: 1, createdAt: 1 } }
  );
  if (!user) {
    return notFoundResponse();
  }

  // step 3: compute review and follow counts in parallel so profile stats load with a single trip
  const [reviewsCount, followersCount, followingCount] = await Promise.all([
    reviews.countDocuments({ userId: String(_id), deletedAt: null }),
    follows.countDocuments({ targetUserId: String(_id) }),
    follows.countDocuments({ followerId: String(_id) }),
  ]);

  // step 4: read viewer session with getServerSession from next-auth so we can attach viewer context fields
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  let youFollow = false;
  if (viewerId && viewerId !== String(_id)) {
    // skip follow lookup when viewing your own profile to avoid extra follows query
    const rel = await follows.findOne({
      followerId: viewerId,
      targetUserId: String(_id),
    });
    youFollow = !!rel;
  }

  // step 5: build profile payload with stats and viewer context for profile pages and profile panels
  return NextResponse.json(
    {
      user: {
        id: String(user._id),
        username: user.username ?? null,
        name: user.name ?? null,
        image: user.image ?? null,
        bio: user.bio ?? null,
        createdAt: user.createdAt ?? null,
        stats: {
          reviewsCount,
          followersCount,
          followingCount,
        },
        viewer: {
          you: viewerId,
          isSelf: viewerId === String(_id),
          youFollow,
        },
      },
    },
    { headers: NO_CACHE_HEADERS }
  );
}
