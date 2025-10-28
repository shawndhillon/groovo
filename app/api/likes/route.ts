import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { LikeTargetSchema } from "@/lib/validation";

export const runtime = "nodejs";

async function bumpLike(database: any, targetType: "review" | "comment", targetId: string, delta: 1 | -1) {
  const coll = targetType === "review" ? "reviews" : "comments";
  await database.collection(coll).updateOne({ _id: new ObjectId(targetId), deletedAt: null }, { $inc: { likeCount: delta } });
}

export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = LikeTargetSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { targetType, targetId, action } = parsed.data;
  const database = await db();

  // Validate target exists
  const coll = targetType === "review" ? "reviews" : "comments";
  const target = await database.collection(coll).findOne({ _id: new ObjectId(targetId), deletedAt: null });
  if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });

  if (action === "like") {
    try {
      await database.collection("likes").insertOne({
        targetType,
        targetId,
        userId: session.user.id,
        createdAt: new Date(),
      });
      await bumpLike(database, targetType, targetId, 1);
      return NextResponse.json({ liked: true });
    } catch (e: any) {
      // Unique index prevents double like
      if (e?.code === 11000) return NextResponse.json({ liked: true });
      return NextResponse.json({ error: "Failed to like" }, { status: 500 });
    }
  } else {
    const res = await database.collection("likes").deleteOne({
      targetType,
      targetId,
      userId: session.user.id,
    });
    if (res.deletedCount) await bumpLike(database, targetType, targetId, -1);
    return NextResponse.json({ liked: false });
  }
}
