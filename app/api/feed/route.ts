/**
 * Purpose:
 *   Endpoint (Get) for following-based review feed for the home page
 *
 * Scope:
 *   - Home page feed section that shows activity from followed users
 *   - Any feature that needs user based/scoped reviews
 *
 * Role:
 *   - Expose an authenticated API endpoint that returns reviews from followed users
 *   - Include the current user's own reviews in the feed
 *   - Attach author information and viewer like status to each review
 *   - Paginate so the client can load the feed in pages
 *
 * Deps:
 *   - MongoDB via lib/mongodb for reviews and follows data
 *   - NextAuth via authOptions and getServerSession for viewer
 *   - Shared helpers for reviews, users, likes, and index management
 *
 * Notes:
 *   - assumes user is signed in for all requests in this file
 *   - returns 401 response when there is no active session
 *   - response shape is designed for the home feed UI and other follow-based views
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getLikedItemIds } from "@/app/utils/likes";
import { unauthorizedResponse } from "@/app/utils/response";
import { formatReview } from "@/app/utils/reviewResponse";
import { fetchUsersByIds } from "@/app/utils/users";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function num(v: any, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

/**
 * Purpose:
 *   Fetch paginated feed of reviews from users the current user follows
 *
 * Params:
 *   - req: Next.js request object with query parameters: page (optional, default 1), pageSize (optional, default 20, max 50)
 *
 * Returns:
 *   - JSON response with items array of review objects with author info and like status
 */
export async function GET(req: Request) {
  await ensureIndexes();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  const url = new URL(req.url);
  const page = num(url.searchParams.get("page"), 1);
  const pageSize = Math.min(num(url.searchParams.get("pageSize"), 20), 50); // Cap at 50 for performance

  const database = await db();
  const follows = database.collection("follows");
  const reviews = database.collection("reviews");

  // Get all users the current user follows
  const followRows = await follows
    .find({ followerId: session.user.id })
    .project({ _id: 0, targetUserId: 1 })
    .toArray();

  // Build set of followed user IDs
  const followedIds = new Set<string>();
  for (const row of followRows) {
    if (row?.targetUserId) followedIds.add(String(row.targetUserId));
  }
  // Include current user's own reviews in feed
  followedIds.add(session.user.id);

  const authorIds = Array.from(followedIds);

  // Fetch reviews from followed users (excluding deleted)
  const items = await reviews
    .find({ userId: { $in: authorIds }, deletedAt: null })
    .sort({ createdAt: -1 }) // Newest first
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  // Get unique author IDs to fetch user info
  const uniqueAuthorIds = Array.from(new Set(items.map((r) => r.userId).filter(Boolean)));

  // Batch fetch author information
  const userMap = await fetchUsersByIds(uniqueAuthorIds);

  // Check which reviews the current user has liked
  const reviewIds = items.map((r) => String(r._id));
  // getLikedItemIds from app/utils/likes returns the set of review ids liked by the current user
  const likedReviewIds = await getLikedItemIds(session.user.id, "review", reviewIds);

  // formatReview from app/utils/reviewResponse shapes each MongoDB review for the feed response with author and like info
  const out = items.map((r) => {
    const author = userMap.get(r.userId) ?? null;
    return formatReview(r, author, likedReviewIds.has(String(r._id)));
  });

  return NextResponse.json({ items: out });
}
