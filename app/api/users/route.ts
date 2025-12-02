/**
 * Purpose:
 *   Search API for finding users by name or username
 *
 * Scope:
 *   - Global search shows partial matched users as you type
 *   - Components user lookups by text query
 *
 * Role:
 *   - Expose a GET endpoint that returns mini user summaries for a query
 *   - Limit and shape results
 *
 * Deps:
 *   - MongoDB via lib/mongodb for user lookups
 *
 * Notes:
 *   - Designed for autocomplete style usage
 *   - Queries are run as a regex
 *
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";

export const runtime = "nodejs";

/**
 * Purpose:
 *   Search for users by username or name with case insensitive matching
 *
 * Params:
 *   - req: Next.js request object with query parameter "q" (search term) (optional limit (max 10))
 *
 * Returns:
 *   - JSON response with items array of user objects (id, username, name, image)
 *
 * Notes:
 *   - assumes user may or may not be signed in
 *   - used by useSearchSuggestions hook for search dropdown
 *   - removes special regex chars in search query
 *   - returns empty array if no search query provided
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limitRaw = Number(url.searchParams.get("limit") || "5");
  const limit = Math.min(Math.max(isFinite(limitRaw) ? limitRaw : 5, 1), 10);

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const database = await db();
  const users = database.collection("users");

  // escape regex chars in q so the search term is safe to use in a case insensitive RegExp
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const docs = await users
    .find(
      { $or: [{ username: regex }, { name: regex }] },
      { projection: { _id: 1, username: 1, name: 1, image: 1 } }
    )
    .limit(limit)
    .toArray();

  return NextResponse.json({
    items: docs.map((u) => ({
      id: String(u._id),
      username: u.username ?? "",
      name: u.name ?? null,
      image: u.image ?? null,
    })),
  });
}
