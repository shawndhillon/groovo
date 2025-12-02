/**
 * Purpose:
 *   Main reviews API for creating reviews and listing them across the app
 *
 * Scope:
 *   - Review creation flows and album detail pages
 *   - Global and filtered review listings (by album, by user, or in feeds)
 *
 * Role:
 *   - Expose HTTP handlers for adding new reviews
 *   - Provide listing endpoints that can filter reviews and paginate results
 *   - Use shared helpers for formatting reviews and attaching context
 *
 * Deps:
 *   - MongoDB via lib/mongodb and lib/ensure-indexes
 *   - Validation helpers and schemas from lib/validation
 *   - Shared review, user, and like utilities for response shaping and viewer context
 *   - NextAuth via authOptions and getServerSession for authenticated operations
 *
 * Notes:
 *   - Assumes a valid session from NextAuth
 *   - Response shapes are kept consistent with other review endpoints
 *
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getLikedItemIds } from "@/app/utils/likes";
import { errorResponse, serverErrorResponse, unauthorizedResponse } from "@/app/utils/response";
import { formatReview } from "@/app/utils/reviewResponse";
import { fetchUsersByIds } from "@/app/utils/users";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { PageSchema, ReviewCreateSchema } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Purpose:
 *   Create a new review for an album
 *
 * Params:
 *   - req: Next.js request object with JSON body (albumId, rating, body, optional album snapshot)
 *
 * Returns:
 *   - JSON response with id string of the newly created review (status 201)
 *
 * Notes:
 *   - returns 401 response when there is no active session
 *   - returns 409 response if user already reviewed the album
 *   - albumSnapshot preserved in response for client display
 */
export async function POST(req: Request) {
  // step 1: call ensureIndexes from lib/ensure-indexes so review writes use the expected MongoDB indexes
  await ensureIndexes();
  // step 2: require an authenticated user via getServerSession using authOptions from the NextAuth route
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorizedResponse();

  // step 3: validate the incoming review payload with ReviewCreateSchema from lib/validation
  const parsed = ReviewCreateSchema.safeParse(await req.json());
  if (!parsed.success) return errorResponse(parsed.error.message, 400);

  const { albumId, rating, body, album } = parsed.data;
  const database = await db();
  const now = new Date();

  try {
    // step 4: insert the new review document with optional albumSnapshot for display on album pages
    const doc = {
      userId: session.user.id,
      albumId,
      rating,
      body,
      albumSnapshot: album ?? null,
      likeCount: 0,
      commentCount: 0,
      createdAt: now,
      deletedAt: null as Date | null,
    };
    const res = await database.collection("reviews").insertOne(doc);
    return NextResponse.json({ id: String(res.insertedId) }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) {
      // return 409 when a user has already created a review for this album
      return errorResponse("You already reviewed this album.", 409);
    }
    console.error("Error creating review:", e);
    return serverErrorResponse("Failed to create review");
  }
}

/**
 * Purpose:
 *   List reviews with optional filtering by albumId or userId
 *
 * Params:
 *   - req: Next.js request object with query parameters: albumId (optional), userId (optional), global (optional boolean), page (optional), pageSize (optional)
 *
 * Returns:
 *   - JSON response with items array of review objects
 *
 * Notes:
 *   - user may or may not be signed in
 *   - use ?global=true to include author info and like status (requires auth for like status)
 *   - supports pagination with page and pageSize parameters
 */
export async function GET(req: Request) {
  await ensureIndexes();
  const url = new URL(req.url);
  const albumId = url.searchParams.get("albumId");
  const userId = url.searchParams.get("userId");
  const global = url.searchParams.get("global") === "true";

  const page = PageSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const database = await db();
  const q: any = { deletedAt: null };
  if (albumId) q.albumId = albumId;
  if (userId) q.userId = userId;

  const items = await database.collection("reviews")
    .find(q)
    .sort({ createdAt: -1 })
    .skip((page.page - 1) * page.pageSize)
    .limit(page.pageSize)
    .toArray();

  // map items into plain objects so fields like albumSnapshot serialize correctly in JSON
  const mappedItems = items.map((r) => ({
    _id: String(r._id),
    id: String(r._id),
    userId: r.userId,
    albumId: r.albumId,
    rating: r.rating,
    body: r.body,
    likeCount: r.likeCount ?? 0,
    commentCount: r.commentCount ?? 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    albumSnapshot: r.albumSnapshot ?? null, // Always preserve albumSnapshot
  }));

  // If global feed, fetch user info and like status
  if (global) {
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id ?? null;
    const uniqueUserIds = Array.from(new Set(items.map((r) => r.userId).filter(Boolean)));

    // fetchUsersByIds from app/utils/users loads author info for all user ids in one query
    const userMap = await fetchUsersByIds(uniqueUserIds);

    // getLikedItemIds from app/utils/likes returns the set of review ids liked by the current viewer
    const reviewIds = items.map((r) => String(r._id));
    const likedReviewIds = await getLikedItemIds(viewerId, "review", reviewIds);

    const out = items.map((r) => {
      const author = userMap.get(r.userId) ?? null;
      return formatReview(r, author, likedReviewIds.has(String(r._id)));
    });

    return NextResponse.json({ items: out });
  }

  return NextResponse.json({ items: mappedItems });
}
