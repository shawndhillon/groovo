import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { ReviewEditSchema } from "@/lib/validation";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


/**
 * Docs:
 * - Next.js Dynamic Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * - Route params: https://nextjs.org/docs/messages/sync-dynamic-apis
 * - getServerSession in Route Handlers: https://authjs.dev/reference/nextjs#server-components--route-handlers
 * - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 */



export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  await ensureIndexes();
  const { id } = await params;
  const database = await db();

  // Validate the identifier before querying MongoDB
  let asObjectId: ObjectId | null = null;
  try {
    asObjectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const review = await database.collection("reviews").findOne({
  
    _id: asObjectId,
    deletedAt: null,
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getServerSession(authOptions);

  // Fetch author metadata so the client does not need a second request
  let author: { id: string; username?: string | null; name?: string | null; image?: string | null } | null = null;
  try {
    const authorDoc = await database
      .collection("users")
      .findOne({ _id: new ObjectId(String(review.userId)) }, { projection: { _id: 1, username: 1, name: 1, image: 1 } });
    if (authorDoc) {
      author = {
        id: String(authorDoc._id),
        username: authorDoc.username ?? null,
        name: authorDoc.name ?? null,
        image: authorDoc.image ?? null,
      };
    }
  } catch {
    author = null;
  }

  // Determine if the current viewer has liked this review
  let viewerLiked = false;
  if (session?.user?.id) {
    const liked = await database.collection("likes").findOne({
      targetType: "review",
      targetId: String(review._id),
      userId: session.user.id,
    });
    viewerLiked = !!liked;
  }

  // Return a normalized document so clients receive author and viewer context in a single call
  return NextResponse.json({
    _id: String(review._id),
    id: String(review._id),
    userId: review.userId,
    albumId: review.albumId,
    rating: review.rating,
    body: review.body,
    likeCount: review.likeCount ?? 0,
    commentCount: review.commentCount ?? 0,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    albumSnapshot: review.albumSnapshot ?? null,
    author,
    viewerLiked,
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReviewEditSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { id } = await params;
  const database = await db();
  const review = await database.collection("reviews").findOne({
    _id: new ObjectId(id),
    deletedAt: null,
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const $set: any = { updatedAt: new Date() };
  if (parsed.data.body !== undefined) $set.body = parsed.data.body;
  if (parsed.data.rating !== undefined) $set.rating = parsed.data.rating;

  await database.collection("reviews").updateOne({ _id: review._id }, { $set });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const database = await db();
  const review = await database.collection("reviews").findOne({
    _id: new ObjectId(id),
    deletedAt: null,
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await database.collection("reviews").updateOne(
    { _id: review._id },
    { $set: { deletedAt: new Date() } }
  );
  return NextResponse.json({ ok: true });
}
