/**
 * Purpose:
 *   Follows API for managing who follows whom in the app
 *
 * Scope:
 *   - Profile pages and user lists that show follow state and follower counts
 *   - Any feature that lets users follow or unfollow other users
 *
 * Role:
 *   - Expose a single endpoint(POST) to create and remove follow relationships
 *   - Keep follower counts up to date for a target user
 *   - Enforce simple rules like preventing self follows and duplicates
 *
 * Deps:
 *   - MongoDB via lib/mongodb and lib/ensure-indexes
 *   - Validation schema FollowToggleSchema from lib/validation
 *   - NextAuth via authOptions and getServerSession for session management
 *
 * Notes:
 *   - returns 409 for duplicate follows but still treats the user as following
 *   - always returns no cache headers so follower counts stay current
 *
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { errorResponse, NO_CACHE_HEADERS, serverErrorResponse, unauthorizedResponse } from "@/app/utils/response";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { FollowToggleSchema } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Purpose:
 *   Create or delete a follow relationship between users
 *
 * Params:
 *   - req: Next.js request object with JSON body (targetUserId, action: "follow" or "unfollow")
 *
 * Returns:
 *   - JSON response with following boolean and followersCount number
 *
 * Notes:
 *   - returns 401 response when there is no active session
 *   - returns 400 response if attempting to follow yourself
 *   - returns 409 response if follow already exists, but treats as success
 *   - always returns no-cache headers for fresh follower counts
 *   - used by the FollowButton component
 */
export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  const parsed = FollowToggleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return errorResponse(parsed.error.message, 400);
  }

  const followerId = session.user.id;
  const { targetUserId, action } = parsed.data;

  // Prevent self following
  if (followerId === targetUserId) {
    return errorResponse("Cannot follow yourself", 400);
  }

  const database = await db();
  const follows = database.collection("follows");

  if (action === "follow") {
    try {
      // Create follow relationship (unique index prevents duplicates)
      await follows.insertOne({
        followerId,
        targetUserId,
        createdAt: new Date(),
      });
      const followersCount = await follows.countDocuments({ targetUserId });
      return NextResponse.json({ following: true, followersCount }, { headers: NO_CACHE_HEADERS });
    } catch (e: any) {
      // Handle duplicate follow (error code 11000 = duplicate key)
      // Return success since user is already following
      if (e?.code === 11000) {
        const followersCount = await follows.countDocuments({ targetUserId });
        return NextResponse.json({ following: true, followersCount }, { headers: NO_CACHE_HEADERS });
      }
      console.error("Error following user:", e);
      return serverErrorResponse("Failed to follow");
    }
  } else {
    // Unfollow: delete relationship
    await follows.deleteMany({
      followerId,
      targetUserId,
    });
    const followersCount = await follows.countDocuments({ targetUserId });
    return NextResponse.json({ following: false, followersCount }, { headers: NO_CACHE_HEADERS });
  }
}
