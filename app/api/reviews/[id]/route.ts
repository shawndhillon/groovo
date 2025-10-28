import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { ReviewEditSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await ensureIndexes();
  const database = await db();
  const review = await database.collection("reviews").findOne({ _id: new ObjectId(params.id), deletedAt: null });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(review);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReviewEditSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const database = await db();
  const review = await database.collection("reviews").findOne({ _id: new ObjectId(params.id), deletedAt: null });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const $set: any = { updatedAt: new Date() };
  if (parsed.data.body !== undefined) $set.body = parsed.data.body;
  if (parsed.data.rating !== undefined) $set.rating = parsed.data.rating;

  await database.collection("reviews").updateOne({ _id: review._id }, { $set });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const database = await db();
  const review = await database.collection("reviews").findOne({ _id: new ObjectId(params.id), deletedAt: null });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await database.collection("reviews").updateOne({ _id: review._id }, { $set: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
