import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { CommentCreateSchema, PageSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CommentCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const database = await db();
  const reviewId = new ObjectId(params.id);
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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await ensureIndexes();
  const url = new URL(req.url);

  const page = PageSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const database = await db();
  const reviewId = new ObjectId(params.id);

  const items = await database.collection("comments")
    .find({ reviewId: String(reviewId), parentId: null, deletedAt: null })
    .sort({ createdAt: -1 })
    .skip((page.page - 1) * page.pageSize)
    .limit(page.pageSize)
    .toArray();

  const parentIds = items.map(c => String(c._id));
  const replies = await database.collection("comments")
    .find({ reviewId: String(reviewId), parentId: { $in: parentIds }, deletedAt: null })
    .sort({ createdAt: 1 })
    .toArray();

  return NextResponse.json({ items, replies });
}
