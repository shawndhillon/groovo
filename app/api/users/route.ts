/**
 * Purpose:
 *   User search API endpoint
 *
 * Scope:
 *   - Used by SearchBar component for user autocomplete suggestions
 *   - Provides user lookup by username or name
 *
 * Role:
 *   - Searches users by username or name with case-insensitive regex matching
 *   - Returns limited results (default 5, max 10) for performance
 *   - Projects only necessary fields (_id, username, name, image)
 *
 * Deps:
 *   - lib/mongodb for database access
 *
 * Notes:
 *   - Escapes special regex characters in search query
 *   - Used by useSearchSuggestions hook for search dropdown
 *
 * Contributions (Shawn):
 *   - Implemented user search API endpoint
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";

export const runtime = "nodejs";


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
