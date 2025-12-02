/**
 * Purpose:
 *   Batch lookup endpoint (POST) for resolving many user IDs at once
 *
 * Scope:
 *   - Used by API routes that need multiple user profiles at once
 *   - API routes that enrich lists of reviews or comments with author data
 *
 * Role:
 *   - Accept a list of user IDs and return normalized user summaries
 *   - Enforce simple limits so batch requests stay small and safe
 *
 * Deps:
 *   - User utilities from app/utils/users for batch fetching (fetchUsersByIds)
 *   - Response helpers from app/utils/response for error handling (errorResponse)
 *
 * Notes:
 *   - Used internally by other API routes, not directly by client components
 *
 */

import { errorResponse } from "@/app/utils/response";
import { fetchUsersByIds } from "@/app/utils/users";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReqBody = { ids?: string[] };

/**
 * Purpose:
 *   Batch fetch user information for multiple user IDs in a single request
 *
 * Params:
 *   - req: Next.js request object with JSON body containing ids array (max 100)
 *
 * Returns:
 *   - JSON response with items array of UserInfo objects
 *
 * Notes:
 *   - assumes user may or may not be signed in
 *   - returns 400 response if more than 100 IDs provided
 *   - returns empty array if no valid IDs provided
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ReqBody | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.filter(Boolean) : [];
  if (!ids.length) return NextResponse.json({ items: [] });

  // Limit array size to prevent extremely large requests
  if (ids.length > 100) {
    return errorResponse("Maximum 100 user IDs allowed", 400);
  }

  const userMap = await fetchUsersByIds(ids);

  return NextResponse.json({
    items: Array.from(userMap.values()),
  });
}
