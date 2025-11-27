import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { PageSchema, ReviewCreateSchema } from "@/lib/validation";
import { ObjectId } from "mongodb";

/**
 * Docs:
 * - Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * - Input validation with Zod: https://zod.dev/
 * - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 * - createIndexes: https://www.mongodb.com/docs/drivers/node/current/indexes/
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReviewCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

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
      updatedAt: now,
      deletedAt: null as Date | null,
    };
    const res = await database.collection("reviews").insertOne(doc);
    return NextResponse.json({ id: String(res.insertedId) }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "You already reviewed this album." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
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
    const users = database.collection("users");
    const uniqueUserIds = Array.from(new Set(items.map((r) => r.userId).filter(Boolean)));
    
    const authorObjectIds: ObjectId[] = [];
    for (const s of uniqueUserIds) {
      try {
        authorObjectIds.push(new ObjectId(s));
      } catch {
        // Skip invalid ObjectIds
      }
    }

    const authorDocs = authorObjectIds.length
      ? await users
          .find(
            { _id: { $in: authorObjectIds } },
            { projection: { _id: 1, username: 1, name: 1, image: 1 } }
          )
          .toArray()
      : [];

    const byId = new Map<string, { username?: string | null; name?: string | null; image?: string | null }>();
    for (const u of authorDocs) {
      byId.set(String(u._id), {
        username: u.username ?? null,
        name: u.name ?? null,
        image: u.image ?? null,
      });
    }

    // Check which reviews the user has liked
    const reviewIds = items.map((r) => String(r._id));
    const likedReviewIds = new Set<string>();
    if (viewerId && reviewIds.length > 0) {
      const likes = await database.collection("likes")
        .find({
          targetType: "review",
          targetId: { $in: reviewIds },
          userId: viewerId,
        })
        .toArray();
      likes.forEach((l) => likedReviewIds.add(l.targetId));
    }

    const out = mappedItems.map((r) => ({
      ...r,
      author: {
        id: r.userId,
        username: byId.get(String(r.userId))?.username ?? null,
        name: byId.get(String(r.userId))?.name ?? null,
        image: byId.get(String(r.userId))?.image ?? null,
      },
      viewerLiked: likedReviewIds.has(String(r._id)),
    }));

    return NextResponse.json({ items: out });
  }

  return NextResponse.json({ items: mappedItems });
}
