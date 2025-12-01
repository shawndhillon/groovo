import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isItemLiked } from "@/app/utils/likes";
import { errorResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "@/app/utils/response";
import { formatReview } from "@/app/utils/reviewResponse";
import { fetchUserById } from "@/app/utils/users";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { ReviewEditSchema, safeObjectId, validateObjectId } from "@/lib/validation";
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
  const asObjectId = safeObjectId(id);
  if (!asObjectId) {
    return notFoundResponse();
  }

  const review = await database.collection("reviews").findOne({
    _id: asObjectId,
    deletedAt: null,
  });
  if (!review) return notFoundResponse();

  const session = await getServerSession(authOptions);

  // Fetch author metadata so the client does not need a second request
  const author = await fetchUserById(review.userId);

  // Determine if the current viewer has liked this review
  const viewerLiked = await isItemLiked(
    session?.user?.id ?? null,
    "review",
    String(review._id)
  );

  // Return a normalized document so clients receive author and viewer context in a single call
  return NextResponse.json(formatReview(review, author, viewerLiked));
}

export async function PATCH(req: Request, { params }: Ctx) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorizedResponse();

  const parsed = ReviewEditSchema.safeParse(await req.json());
  if (!parsed.success) return errorResponse(parsed.error.message, 400);

  const { id } = await params;
  const database = await db();
  const reviewId = validateObjectId(id, "Invalid review ID");
  const review = await database.collection("reviews").findOne({
    _id: reviewId,
    deletedAt: null,
  });
  if (!review) return notFoundResponse();
  if (review.userId !== session.user.id) return forbiddenResponse();

  const $set: any = { updatedAt: new Date() };
  if (parsed.data.body !== undefined) $set.body = parsed.data.body;
  if (parsed.data.rating !== undefined) $set.rating = parsed.data.rating;

  await database.collection("reviews").updateOne({ _id: review._id }, { $set });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const database = await db();
  const reviewId = validateObjectId(id, "Invalid review ID");
  const review = await database.collection("reviews").findOne({
    _id: reviewId,
    deletedAt: null,
  });
  if (!review) return notFoundResponse();
  if (review.userId !== session.user.id) return forbiddenResponse();

  await database.collection("reviews").updateOne(
    { _id: review._id },
    { $set: { deletedAt: new Date() } }
  );
  return NextResponse.json({ ok: true });
}
