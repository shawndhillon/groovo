import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { CommentEditSchema } from "@/lib/validation";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Docs:
 * - Next.js Dynamic Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * - Dynamic route params: https://nextjs.org/docs/messages/sync-dynamic-apis
 * - getServerSession in Route Handlers: https://authjs.dev/reference/nextjs#server-components--route-handlers
 * - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 */



export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = CommentEditSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { id } = await params;
  const database = await db();
  const _id = new ObjectId(id);

  const comment = await database.collection("comments").findOne({ _id, deletedAt: null });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await database.collection("comments").updateOne(
    { _id },
    { $set: { body: parsed.data.body, updatedAt: new Date() } }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const database = await db();
  const _id = new ObjectId(id);

  const comment = await database.collection("comments").findOne({ _id, deletedAt: null });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await database.collection("comments").updateOne({ _id }, { $set: { deletedAt: new Date() } });

  if (comment.parentId) {
    await database.collection("comments").updateOne(
      { _id: new ObjectId(comment.parentId) },
      { $inc: { replyCount: -1 } }
    );
  } else {
    await database.collection("reviews").updateOne(
      { _id: new ObjectId(comment.reviewId) },
      { $inc: { commentCount: -1 } }
    );
  }

  return NextResponse.json({ ok: true });
}
