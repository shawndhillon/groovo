/**
 * Purpose:
 *   User profile API endpoint
 *
 * Scope:
 *   - Used by user profile pages (/profile/user/[id]) to fetch user data
 *   - Returns public user information with stats and viewer context
 *
 * Role:
 *   - Fetches user profile by ID with ObjectId validation
 *   - Calculates review, follower, and following counts
 *   - Includes viewer context (isSelf, youFollow) when authenticated
 *   - Returns 404 for invalid or missing users
 *
 * Deps:
 *   - lib/mongodb for database access
 *   - lib/validation for ObjectId validation (safeObjectId)
 *   - app/api/auth/[...nextauth] for session handling (getServerSession)
 *
 * Notes:
 *   - Always returns no-cache headers for fresh data
 *   - Viewer context only included when session exists
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

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const database = await db();
  const users = database.collection("users");
  const reviews = database.collection("reviews");
  const follows = database.collection("follows");

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

  const [reviewsCount, followersCount, followingCount] = await Promise.all([
    reviews.countDocuments({ userId: String(_id), deletedAt: null }),
    follows.countDocuments({ targetUserId: String(_id) }),
    follows.countDocuments({ followerId: String(_id) }),
  ]);

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  let youFollow = false;
  if (viewerId && viewerId !== String(_id)) {
    const rel = await follows.findOne({
      followerId: viewerId,
      targetUserId: String(_id),
    });
    youFollow = !!rel;
  }

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
