/**
 * Purpose:
 *   Comments API for viewing and adding discussion on a single review
 *
 * Scope:
 *   - Review detail pages that show comment threads
 *   - Flows where users reply to reviews or to other comments
 *
 * Role:
 *   - Expose handlers for creating new comments and threaded replies
 *   - API (GET) that returns top level comments and nested replies
 *   - Enrich comments with author info and viewer like state
 *
 * Deps:
 *   - MongoDB via lib/mongodb and lib/ensure-indexes
 *   - Validation helpers and schemas from lib/validation
 *   - Shared user and like utilities for author and viewer context
 *   - NextAuth via authOptions and getServerSession for authenticated posting
 *
 * Notes:
 *   - Auth is required for creating comments but not for reading them
 *   - Response shape is designed for threaded comment UIs on review pages
 *
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

/**
 * Purpose:
 *   Create a new comment or threaded reply on a review
 *
 * Params:
 *   - req: Next.js request object with JSON body (body text, optional parentId for replies)
 *   - params: route parameters with id string (review ID)
 *
 * Returns:
 *   - JSON response with id string of the newly created comment (status 201)
 *
 * Notes:
 *   - returns 401 response when there is no active session
 *   - returns 404 response if review does not exist
 *   - returns 400 response if parent comment does not exist (for replies)
 *   - supports infinite nesting of threaded replies (we limit to 10 in practice)
 */
export async function POST(req: Request, { params }: Ctx) {
  // step 1: call ensureIndexes from lib/ensure-indexes so comment reads and writes use the expected MongoDB indexes
  await ensureIndexes();
  // step 2: require an authenticated user before allowing comment creation
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorizedResponse();

  // step 3: validate incoming comment payload against the CommentCreateSchema
  const parsed = CommentCreateSchema.safeParse(await req.json());
  if (!parsed.success) return errorResponse(parsed.error.message, 400);

  const { id } = await params;
  const database = await db();
  // step 4: validate the review id from route params before querying MongoDB
  const reviewId = validateObjectId(id, "Invalid review ID");

  const review = await database.collection("reviews").findOne({ _id: reviewId, deletedAt: null });
  if (!review) return notFoundResponse("Review not found");

  let parentId = null;
  if (parsed.data.parentId) {
    // for threaded replies, validate the parent comment id and ensure it belongs to this review
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

  // step 5: insert the new comment document for this review and user
  const res = await database.collection("comments").insertOne(doc);

  // return the new comment id so the client can reload or append the thread
  return NextResponse.json({ id: String(res.insertedId) }, { status: 201 });
}

/**
 * Purpose:
 *   Fetch paginated top-level comments for a review with all nested replies
 *
 * Params:
 *   - req: Next.js request object with query parameters: page (optional), pageSize (optional)
 *   - params: route parameters with id string (review ID)
 *
 * Returns:
 *   - JSON response with items array (top-level comments) and replies array (nested replies)
 *
 * Notes:
 *   - User may or may not be signed in
 *   - returns 404 response if review ID is invalid
 *   - recursively fetches all nested replies for complete thread display
 *   - includes author info and viewer like status for all comments
 *   - supports pagination for top-level comments only
 */
export async function GET(req: Request, { params }: Ctx) {
  // step 1: ensure comment indexes exist before running read queries
  await ensureIndexes();
  const url = new URL(req.url);
  // step 2: read pagination settings from the query string
  const page = PageSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const { id } = await params;
  const database = await db();
  // step 3: validate the review id used to scope the comment query
  const reviewId = validateObjectId(id, "Invalid review ID");

  // step 4: read viewer id so we can compute viewerLiked flags per comment
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  const items = await database.collection("comments")
    .find({ reviewId: String(reviewId), parentId: null, deletedAt: null })
    .sort({ createdAt: -1 })
    .skip((page.page - 1) * page.pageSize)
    .limit(page.pageSize)
    .toArray();

  // collect ids for all comments so we can check like status in a single helper call
  const allCommentIds: string[] = items.map(c => String(c._id));

  // recursively fetch replies for the given parent ids so nested threads are preserved
  async function fetchAllReplies(parentIds: string[]): Promise<any[]> {
    if (parentIds.length === 0) return [];
    const replies = await database.collection("comments")
      .find({ reviewId: String(reviewId), parentId: { $in: parentIds }, deletedAt: null })
      .sort({ createdAt: 1 })
      .toArray();

    const replyIds = replies.map(r => String(r._id));
    allCommentIds.push(...replyIds);

    // recursively traverse deeper reply levels to support arbitrarily nested threads
    const nestedReplies = await fetchAllReplies(replyIds);
    return [...replies, ...nestedReplies];
  }

  const replies = await fetchAllReplies(allCommentIds.slice(0, items.length));

  // merge top level comments and replies so we can derive all unique author ids
  const allComments = [...items, ...replies];
  const uniqueUserIds = Array.from(new Set(allComments.map((c) => c.userId).filter(Boolean)));

  // fetchUsersByIds from app/utils/users loads all author profiles in one call to avoid long/extra lookups
  const userMap = await fetchUsersByIds(uniqueUserIds);

  // getLikedItemIds from app/utils/likes returns the set of comment ids liked by the current viewer
  const likedCommentIds = await getLikedItemIds(viewerId, "comment", allCommentIds);

  // attach viewerLiked and user fields expected by the comment UI for top-level comments
  const itemsWithLikes = items.map((c) => ({
    ...c,
    viewerLiked: likedCommentIds.has(String(c._id)),
    user: userMap.get(c.userId) || null,
  }));

  // attach viewerLiked and user fields for all nested replies using the same mappings
  const repliesWithLikes = replies.map((r) => ({
    ...r,
    viewerLiked: likedCommentIds.has(String(r._id)),
    user: userMap.get(r.userId) || null,
  }));

  return NextResponse.json({ items: itemsWithLikes, replies: repliesWithLikes });
}
