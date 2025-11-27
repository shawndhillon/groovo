import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongodb";

export const runtime = "nodejs";

type ReqBody = { ids?: string[] };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ReqBody | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.filter(Boolean) : [];
  if (!ids.length) return NextResponse.json({ items: [] });

  const database = await db();
  const objectIds = ids
    .map((s) => {
      try {
        return new ObjectId(s);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ObjectId[];

  if (!objectIds.length) return NextResponse.json({ items: [] });

  const docs = await database
    .collection("users")
    .find({ _id: { $in: objectIds } }, { projection: { _id: 1, username: 1, name: 1, image: 1 } })
    .toArray();

  return NextResponse.json({
    items: docs.map((u) => ({
      id: String(u._id),
      username: u.username ?? null,
      name: u.name ?? null,
      image: u.image ?? null,
    })),
  });
}
