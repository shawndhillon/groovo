/**
 * Purpose:
 *   Batch user lookup API endpoint
 *
 * Scope:
 *   - Used by API routes that need multiple user profiles at once
 *   - Efficient alternative to multiple individual user requests
 *
 * Role:
 *   - Accepts array of user IDs in POST body and returns user information
 *   - Validates and limits request size (max 100 IDs per request)
 *   - Returns empty array if no valid IDs provided
 *
 * Deps:
 *   - app/utils/users for batch fetching (fetchUsersByIds)
 *   - app/utils/response for error handling (errorResponse)
 *
 * Notes:
 *   - Limits to 100 IDs per request (returns 400 if exceeded)
 *   - Used internally by other API routes, not directly by client components
 *
 */

import { errorResponse } from "@/app/utils/response";
import { fetchUsersByIds } from "@/app/utils/users";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReqBody = { ids?: string[] };

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
