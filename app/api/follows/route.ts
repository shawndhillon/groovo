/**
 * Purpose:
 *   Follows API endpoint for user following relationships
 *
 * Scope:
 *   - Used by FollowButton component for follow/unfollow actions
 *   - Manages user-to-user following relationships
 *
 * Role:
 *   - Creates and deletes follow relationships
 *   - Returns current follower count in response
 *   - Prevents self-following and duplicate follows
 *
 * Deps:
 *   - lib/validation for input schema (FollowToggleSchema)
 *   - lib/mongodb for database access
 *   - lib/ensure-indexes for database indexes
 *   - app/api/auth/[...nextauth] for session management
 *
 * Notes:
 *   - Returns 409 if follow already exists, but treats as success
 *   - Always returns no-cache headers for fresh follower counts
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
