/**
 * Purpose:
 *   Likes API for tracking which reviews and comments a user has liked
 *
 * Scope:
 *   - UI components, LikeButton that toggle like state
 *   - Review and comment detail views that reflect current like status
 *
 * Role:
 *   - Expose a single endpoint for liking and unliking reviews and comments
 *   - Maintain like documents and keep like counts in sync on target items
 *   - Guard against invalid targets and duplicate like records
 *
 * Deps:
 *   - MongoDB via lib/mongodb and lib/ensure-indexes
 *   - Validation schema LikeTargetSchema from lib/validation
 *   - NextAuth via authOptions and getServerSession for viewer identity
 *
 * Notes:
 *   - returns liked: true even if a like already exists so clients can treat it as idempotent
 *
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { unauthorizedResponse } from "@/app/utils/response";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { LikeTargetSchema } from "@/lib/validation";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function bumpLike(database: any, targetType: "review" | "comment", targetId: string, delta: 1 | -1) {
  const coll = targetType === "review" ? "reviews" : "comments";
  await database.collection(coll).updateOne({ _id: new ObjectId(targetId), deletedAt: null }, { $inc: { likeCount: delta } });
}

/**
 * Purpose:
 *   Toggle like status for a review or comment
 *
 * Params:
 *   - req: Next.js request object with JSON body (targetType, targetId, action: "like" or "unlike")
 *
 * Returns:
 *   - JSON response with liked boolean indicating final like status
 *
 * Notes:
 *   - returns 401 response when there is no active session
 *   - returns 404 response if target review or comment does not exist
 *   - updates both the likes collection and the review/comment document count
 *   - returns liked: true even if like already exists (idempotent)
 *   - used by the LikeButton component
 */
export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorizedResponse();

  const parsed = LikeTargetSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { targetType, targetId, action } = parsed.data;
  const database = await db();

  // avoid creating likes for reviews or comments that no longer exist
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
      // unique index on likes collection prevents double likes for the same user and target
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
