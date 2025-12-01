/**
 * Purpose:
 *   Comments API endpoint for a specific review
 *
 * Scope:
 *   - Used by review detail pages to display and create comments
 *   - Supports threaded replies with infinite nesting
 *
 * Role:
 *   - POST: Creates new comments and threaded replies
 *   - GET: Lists top-level comments with all nested replies recursively
 *   - Includes author info and viewer like status for all comments
 *   - Supports pagination for top-level comments
 *
 * Deps:
 *   - lib/validation for input schemas (CommentCreateSchema, PageSchema) and ObjectId validation
 *   - app/utils/users for batch fetching author information
 *   - app/utils/likes for checking viewer like status
 *   - lib/ensure-indexes for database indexes
 *
 * References:
 *   - Next.js Dynamic Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 *   - Dynamic route params: https://nextjs.org/docs/messages/sync-dynamic-apis
 *   - Input validation with Zod: https://zod.dev/
 *   - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 *
 * Notes:
 *   - GET: Recursively fetches all nested replies for complete thread display
 *   - Returns separate items (top-level) and replies (nested) arrays
 *
 * Contributions (Shawn):
 *   - Implemented comments API endpoint with threaded replies and like status
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getLikedItemIds } from "@/app/utils/likes";
import { errorResponse, notFoundResponse, unauthorizedResponse } from "@/app/utils/response";
import { fetchUsersByIds } from "@/app/utils/users";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { CommentCreateSchema, PageSchema, validateObjectId } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorizedResponse();

  const parsed = CommentCreateSchema.safeParse(await req.json());
  if (!parsed.success) return errorResponse(parsed.error.message, 400);

  const { id } = await params;
  const database = await db();
  const reviewId = validateObjectId(id, "Invalid review ID");

  const review = await database.collection("reviews").findOne({ _id: reviewId, deletedAt: null });
  if (!review) return notFoundResponse("Review not found");

  let parentId = null;
  if (parsed.data.parentId) {
    parentId = validateObjectId(parsed.data.parentId, "Invalid parent comment ID");
    const parent = await database.collection("comments").findOne({
      _id: parentId,
      reviewId: String(reviewId),
      deletedAt: null,
    });
    if (!parent) return errorResponse("Parent comment not found", 400);
  }

  const now = new Date();
  const doc = {
    reviewId: String(reviewId),
    userId: session.user.id,
    parentId: parentId ? String(parentId) : null,
    body: parsed.data.body,
    likeCount: 0,
    createdAt: now,
    deletedAt: null as Date | null,
  };

  const res = await database.collection("comments").insertOne(doc);

  return NextResponse.json({ id: String(res.insertedId) }, { status: 201 });
}

export async function GET(req: Request, { params }: Ctx) {
  await ensureIndexes();
  const url = new URL(req.url);
  const page = PageSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const { id } = await params;
  const database = await db();
  const reviewId = validateObjectId(id, "Invalid review ID");

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  const items = await database.collection("comments")
    .find({ reviewId: String(reviewId), parentId: null, deletedAt: null })
    .sort({ createdAt: -1 })
    .skip((page.page - 1) * page.pageSize)
    .limit(page.pageSize)
    .toArray();

  // Get all comment IDs (including nested replies) to check likes
  const allCommentIds: string[] = items.map(c => String(c._id));

  // Recursively fetch all replies (supporting infinite nesting)
  async function fetchAllReplies(parentIds: string[]): Promise<any[]> {
    if (parentIds.length === 0) return [];
    const replies = await database.collection("comments")
      .find({ reviewId: String(reviewId), parentId: { $in: parentIds }, deletedAt: null })
      .sort({ createdAt: 1 })
      .toArray();

    const replyIds = replies.map(r => String(r._id));
    allCommentIds.push(...replyIds);

    // Recursively fetch replies to replies
    const nestedReplies = await fetchAllReplies(replyIds);
    return [...replies, ...nestedReplies];
  }

  const replies = await fetchAllReplies(allCommentIds.slice(0, items.length));

  // Get all unique user IDs from comments
  const allComments = [...items, ...replies];
  const uniqueUserIds = Array.from(new Set(allComments.map((c) => c.userId).filter(Boolean)));

  // Fetch user info for all comment authors
  const userMap = await fetchUsersByIds(uniqueUserIds);

  // Check which comments the user has liked
  const likedCommentIds = await getLikedItemIds(viewerId, "comment", allCommentIds);

  // Add viewerLiked and user properties to items and replies
  const itemsWithLikes = items.map((c) => ({
    ...c,
    viewerLiked: likedCommentIds.has(String(c._id)),
    user: userMap.get(c.userId) || null,
  }));

  const repliesWithLikes = replies.map((r) => ({
    ...r,
    viewerLiked: likedCommentIds.has(String(r._id)),
    user: userMap.get(r.userId) || null,
  }));

  return NextResponse.json({ items: itemsWithLikes, replies: repliesWithLikes });
}
