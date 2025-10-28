import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { CommentEditSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CommentEditSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const database = await db();
  const _id = new ObjectId(params.id);
  const comment = await database.collection("comments").findOne({ _id, deletedAt: null });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await database.collection("comments").updateOne({ _id }, { $set: { body: parsed.data.body, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const database = await db();
  const _id = new ObjectId(params.id);
  const comment = await database.collection("comments").findOne({ _id, deletedAt: null });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await database.collection("comments").updateOne({ _id }, { $set: { deletedAt: new Date() } });

  if (comment.parentId) {
    await database.collection("comments").updateOne({ _id: new ObjectId(comment.parentId) }, { $inc: { replyCount: -1 } });
  } else {
    await database.collection("reviews").updateOne({ _id: new ObjectId(comment.reviewId) }, { $inc: { commentCount: -1 } });
  }

  return NextResponse.json({ ok: true });
}
