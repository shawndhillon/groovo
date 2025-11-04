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
  const review = await database.collection("reviews").findOne({
    _id: new ObjectId(id),
    deletedAt: null,
  });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(review);
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
