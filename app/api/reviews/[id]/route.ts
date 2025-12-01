/**
 * Purpose:
 *   Individual review API endpoint for fetching review details
 *
 * Scope:
 *   - Used by review detail pages (/review/[id])
 *   - Provides complete review information with author and viewer context
 *
 * Role:
 *   - Fetches single review by ID with validation
 *   - Includes author information (username, name, image)
 *   - Includes viewer like status (whether current user liked the review)
 *   - Returns formatted review response for client display
 *
 * Deps:
 *   - app/utils/reviewResponse for formatting review data
 *   - app/utils/users for fetching author information
 *   - app/utils/likes for checking viewer like status
 *   - lib/validation for ObjectId validation
 *   - lib/ensure-indexes for database indexes
 *
 * References:
 *   - Next.js Dynamic Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 *   - Route params: https://nextjs.org/docs/messages/sync-dynamic-apis
 *   - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 *
 * Notes:
 *   - Author and viewer like status included in single response to reduce client requests
 *
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isItemLiked } from "@/app/utils/likes";
import { notFoundResponse } from "@/app/utils/response";
import { formatReview } from "@/app/utils/reviewResponse";
import { fetchUserById } from "@/app/utils/users";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { safeObjectId } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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
