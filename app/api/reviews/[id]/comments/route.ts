import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { CommentCreateSchema, PageSchema } from "@/lib/validation";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


/**
 * Docs:
 * - Next.js Dynamic Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * - Dynamic route params: https://nextjs.org/docs/messages/sync-dynamic-apis
 * - Input validation with Zod: https://zod.dev/
 * - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 */



export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CommentCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { id } = await params;
  const database = await db();
  const reviewId = new ObjectId(id);

  const review = await database.collection("reviews").findOne({ _id: reviewId, deletedAt: null });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  let parentId: ObjectId | null = null;
  if (parsed.data.parentId) {
    parentId = new ObjectId(parsed.data.parentId);
    const parent = await database.collection("comments").findOne({
      _id: parentId,
      reviewId: String(reviewId),
      deletedAt: null,
    });
    if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
  }

  const now = new Date();
  const doc = {
    reviewId: String(reviewId),
    userId: session.user.id,
    parentId: parentId ? String(parentId) : null,
    body: parsed.data.body,
    likeCount: 0,
    replyCount: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null as Date | null,
  };

  const res = await database.collection("comments").insertOne(doc);

  if (parentId) {
    await database.collection("comments").updateOne({ _id: parentId }, { $inc: { replyCount: 1 } });
  } else {
    await database.collection("reviews").updateOne({ _id: reviewId }, { $inc: { commentCount: 1 } });
  }

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
  const reviewId = new ObjectId(id);

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
  const userObjectIds: ObjectId[] = [];
  for (const s of uniqueUserIds) {
    try {
      userObjectIds.push(new ObjectId(s));
    } catch {
      // Skip invalid ObjectIds
    }
  }

  const users = database.collection("users");
  const userDocs = userObjectIds.length
    ? await users
        .find(
          { _id: { $in: userObjectIds } },
          { projection: { _id: 1, username: 1, name: 1, image: 1 } }
        )
        .toArray()
    : [];

  const userById = new Map<string, { username?: string | null; name?: string | null; image?: string | null }>();
  for (const u of userDocs) {
    userById.set(String(u._id), {
      username: u.username ?? null,
      name: u.name ?? null,
      image: u.image ?? null,
    });
  }

  // Check which comments the user has liked
  const likedCommentIds = new Set<string>();
  if (viewerId && allCommentIds.length > 0) {
    const likes = await database.collection("likes")
      .find({
        targetType: "comment",
        targetId: { $in: allCommentIds },
        userId: viewerId,
      })
      .toArray();
    likes.forEach((l) => likedCommentIds.add(l.targetId));
  }

  // Add viewerLiked and user properties to items and replies
  const itemsWithLikes = items.map((c) => ({
    ...c,
    viewerLiked: likedCommentIds.has(String(c._id)),
    user: userById.get(c.userId) || null,
  }));

  const repliesWithLikes = replies.map((r) => ({
    ...r,
    viewerLiked: likedCommentIds.has(String(r._id)),
    user: userById.get(r.userId) || null,
  }));

  return NextResponse.json({ items: itemsWithLikes, replies: repliesWithLikes });
}
