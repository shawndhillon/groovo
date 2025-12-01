/**
 * Purpose:
 *   Likes API endpoint for toggling likes on reviews and comments
 *
 * Scope:
 *   - Used by LikeButton component for like/unlike actions
 *   - Supports both reviews and comments as targets
 *
 * Role:
 *   - Creates or deletes like records based on action (like/unlike)
 *   - Updates likeCount on target items atomically using $inc
 *   - Validates target exists and is not deleted before allowing like
 *   - Prevents duplicate likes with unique index (returns success if already liked)
 *
 * Deps:
 *   - lib/validation for input schema (LikeTargetSchema)
 *   - lib/mongodb for database access
 *   - lib/ensure-indexes for database indexes
 *   - app/api/auth/[...nextauth] for session management
 *
 * References:
 *   - Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 *   - getServerSession in Route Handlers: https://authjs.dev/reference/nextjs#server-components--route-handlers
 *   - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 *
 * Notes:
 *   - Returns liked: true even if like already exists (idempotent operation)
 *
 * Contributions (Shawn):
 *   - Implemented likes API endpoint with atomic count updates
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

export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorizedResponse();

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
