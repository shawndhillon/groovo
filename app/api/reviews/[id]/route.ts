/**
 * Purpose:
 *   Review detail API for fetching a single review with context
 *
 * Scope:
 *   - Review detail pages that need the full review and metadata
 *   - Places where a single review needs to be shown with author and viewer state
 *
 * Role:
 *   - Look up one review by ID and validate that it exists
 *   - Enrich the review with author details and whether the viewer has liked it
 *   - Return a normalized shape that matches other review responses
 *
 * Deps:
 *   - MongoDB via lib/mongodb and lib/ensure-indexes
 *   - Validation helpers from lib/validation for safe ID handling
 *   - Shared review, user, and like utilities for formatting and viewer context
 *
 * Notes:
 *   - Designed so clients do not need follow up calls for author or like status
 *   - Uses NextAuth session data when present to compute viewerLiked
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

/**
 * Purpose:
 *   Fetch a single review by ID with author information and viewer like status
 *
 * Params:
 *   - _: Next.js request object
 *   - params: route parameters with review ID
 *
 * Returns:
 *   - JSON response with formatted review object including author and viewerLiked fields
 *
 * Notes:
 *   - returns 404 response if review ID is invalid or review does not exist
 *   - author and viewer like status included in single response
 */
export async function GET(_: Request, { params }: Ctx) {
  // step 1: ensure review indexes exist before querying using ensureIndexes from lib/ensure-indexes
  await ensureIndexes();
  const { id } = await params;
  const database = await db();

  // step 2: convert the review id from params into a safe ObjectId using safeObjectId from lib/validation so we only query MongoDB with valid ids
  const asObjectId = safeObjectId(id);
  if (!asObjectId) {
    // return 404 when the review id is invalid (review detail page will show not found)
    return notFoundResponse();
  }

  // step 3: look up the non deleted review document by id
  const review = await database.collection("reviews").findOne({
    _id: asObjectId,
    deletedAt: null,
  });
  if (!review) {
    // return 404 when the review is missing or soft deleted (review detail page will show not found)
    return notFoundResponse();
  }

  // step 4: read viewer session so we can include viewerLiked state
  const session = await getServerSession(authOptions);

  // fetchUserById from app/utils/users returns the basic profile for this review's author so the review detail page can display author info in same request
  const author = await fetchUserById(review.userId);

  // isItemLiked from app/utils/likes checks whether the current viewer has liked this review so the review detail page can show the correct like button state
  const viewerLiked = await isItemLiked(
    session?.user?.id ?? null,
    "review",
    String(review._id)
  );

  // formatReview from app/utils/reviewResponse maps the MongoDB review and related data into the response shape used by the review detail page
  return NextResponse.json(formatReview(review, author, viewerLiked));
}
