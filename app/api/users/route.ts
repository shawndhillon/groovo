
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
