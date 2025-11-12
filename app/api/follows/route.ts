
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { FollowToggleSchema, PageSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const parsed = FollowToggleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const followerId = session.user.id;
  const { targetUserId, action } = parsed.data;

  if (followerId === targetUserId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const database = await db();
  const follows = database.collection("follows");

  if (action === "follow") {
    try {
      await follows.insertOne({
        followerId,
        followingId: targetUserId,
        targetUserId,
        createdAt: new Date(),
      } as any);
      const followersCount = await follows.countDocuments({ targetUserId });
      return NextResponse.json({ following: true, followersCount }, { headers: { "Cache-Control": "no-store" } });
    } catch (e: any) {
      if (e?.code === 11000) {
        const followersCount = await follows.countDocuments({ targetUserId });
        return NextResponse.json({ following: true, followersCount }, { headers: { "Cache-Control": "no-store" } });
      }
      return NextResponse.json({ error: "Failed to follow" }, { status: 500, headers: { "Cache-Control": "no-store" } });
    }
  } else {
    await follows.deleteMany({
      followerId,
      $or: [{ targetUserId }, { followingId: targetUserId }],
    });
    const followersCount = await follows.countDocuments({ targetUserId });
    return NextResponse.json({ following: false, followersCount }, { headers: { "Cache-Control": "no-store" } });
  }
}

/**
 * GET:
 * - /api/follows?followingOf=<userId>&page=&pageSize=   -> who <userId> follows
 * - /api/follows?followersOf=<userId>&page=&pageSize=   -> who follows <userId>
 *   defaults to followingOf = session.user.id if both omitted
 */
export async function GET(req: Request) {
  await ensureIndexes();
  const url = new URL(req.url);
  const followingOf = url.searchParams.get("followingOf");
  const followersOf = url.searchParams.get("followersOf");

  const page = PageSchema.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  const database = await db();
  const follows = database.collection("follows");

  if (followersOf) {
    const items = await follows
      .find({ $or: [{ targetUserId: followersOf }, { followingId: followersOf }] })
      .sort({ createdAt: -1 })
      .skip((page.page - 1) * page.pageSize)
      .limit(page.pageSize)
      .toArray();

    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  }

  let who = followingOf;
  if (!who) {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) who = session.user.id;
  }
  if (!who) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const items = await follows
    .find({ followerId: who })
    .sort({ createdAt: -1 })
    .skip((page.page - 1) * page.pageSize)
    .limit(page.pageSize)
    .toArray();

  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
