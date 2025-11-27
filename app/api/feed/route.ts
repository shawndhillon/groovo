
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

function num(v: any, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: Request) {
  await ensureIndexes();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = num(url.searchParams.get("page"), 1);
  const pageSize = Math.min(num(url.searchParams.get("pageSize"), 20), 50);

  const database = await db();
  const follows = database.collection("follows");
  const reviews = database.collection("reviews");
  const users = database.collection("users");

  const followRows = await follows
    .find({ followerId: session.user.id })
    .project({ _id: 0, targetUserId: 1, followingId: 1 })
    .toArray();

  const followedIds = new Set<string>();
  for (const row of followRows) {
    if (row?.targetUserId) followedIds.add(String(row.targetUserId));
    if (row?.followingId) followedIds.add(String(row.followingId));
  }
  followedIds.add(session.user.id);

  const authorIds = Array.from(followedIds);

  const items = await reviews
    .find({ userId: { $in: authorIds }, deletedAt: null })
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();


  const uniqueAuthorIds = Array.from(new Set(items.map((r) => r.userId).filter(Boolean)));


  const authorObjectIds: ObjectId[] = [];
  for (const s of uniqueAuthorIds) {
    try {
      authorObjectIds.push(new ObjectId(s));
    } catch {

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

  // Check which reviews/comments the user has liked
  const reviewIds = items.map((r) => String(r._id));
  const likes = await database.collection("likes")
    .find({
      targetType: "review",
      targetId: { $in: reviewIds },
      userId: session.user.id,
    })
    .toArray();

  const likedReviewIds = new Set(likes.map((l) => l.targetId));

  const out = items.map((r) => ({
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
    albumSnapshot: r.albumSnapshot ?? null,
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
