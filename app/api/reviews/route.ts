/**
 * Purpose:
 *   Reviews API endpoint for creating and listing reviews
 *
 * Scope:
 *   - Used by review creation forms and review listing pages
 *   - Supports both global feed and filtered views
 *
 * Role:
 *   - POST: Creates new reviews with validation and duplicate prevention
 *   - GET: Lists reviews with filtering by albumId or userId
 *   - Formats reviews with author info and like status for global feed mode
 *   - Handles pagination for large result sets
 *
 * Deps:
 *   - lib/validation for input schemas (ReviewCreateSchema, PageSchema)
 *   - app/utils/reviewResponse for formatting review data
 *   - app/utils/users for batch fetching author information
 *   - app/utils/likes for checking viewer like status
 *   - lib/ensure-indexes for database indexes
 *   - app/api/auth/[...nextauth] for session management
 *
 * References:
 *   - Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 *   - Input validation with Zod: https://zod.dev/
 *   - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 *
 * Notes:
 *   - POST: Returns 409 if user already reviewed the album
 *   - GET: Use ?global=true to include author info and like status (requires auth)
 *   - albumSnapshot preserved in responses for client display
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

export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorizedResponse();

  const parsed = ReviewCreateSchema.safeParse(await req.json());
  if (!parsed.success) return errorResponse(parsed.error.message, 400);

  const { albumId, rating, body, album } = parsed.data;
  const database = await db();
  const now = new Date();

  try {
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
      return errorResponse("You already reviewed this album.", 409);
    }
    console.error("Error creating review:", e);
    return serverErrorResponse("Failed to create review");
  }
}

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

  // Always explicitly map items to ensure proper serialization, especially albumSnapshot
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

    // Batch fetch author information
    const userMap = await fetchUsersByIds(uniqueUserIds);

    // Check which reviews the user has liked
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
