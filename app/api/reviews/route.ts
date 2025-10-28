import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { PageSchema, ReviewCreateSchema } from "@/lib/validation";


/**
 * Docs:
 * - Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * - Input validation with Zod: https://zod.dev/
 * - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 * - createIndexes: https://www.mongodb.com/docs/drivers/node/current/indexes/
 */



export const runtime = "nodejs";

export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = ReviewCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { albumId, rating, body, album } = parsed.data;
  const database = await db();
  const now = new Date();

  try {
    const doc = {
      userId: session.user.id,
      albumId,
      rating,
      body,
      albumSnapshot: album ?? null,
      likeCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null as Date | null,
    };
    const res = await database.collection("reviews").insertOne(doc);
    return NextResponse.json({ id: String(res.insertedId) }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "You already reviewed this album." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await ensureIndexes();
  const url = new URL(req.url);
  const albumId = url.searchParams.get("albumId");
  const userId = url.searchParams.get("userId");

  const page = PageSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const database = await db();
  const q: any = { deletedAt: null };
  if (albumId) q.albumId = albumId;
  if (userId) q.userId = userId;

  const items = await database.collection("reviews")
    .find(q)
    .sort({ createdAt: -1 })
    .skip((page.page - 1) * page.pageSize)
    .limit(page.pageSize)
    .toArray();

  return NextResponse.json({ items });
}
