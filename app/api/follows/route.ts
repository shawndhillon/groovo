
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { errorResponse, NO_CACHE_HEADERS, serverErrorResponse, unauthorizedResponse } from "@/app/utils/response";
import { ensureIndexes } from "@/lib/ensure-indexes";
import { db } from "@/lib/mongodb";
import { FollowToggleSchema, PageSchema } from "@/lib/validation";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  await ensureIndexes();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  const parsed = FollowToggleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return errorResponse(parsed.error.message, 400);
  }

  const followerId = session.user.id;
  const { targetUserId, action } = parsed.data;

  // Prevent self following
  if (followerId === targetUserId) {
    return errorResponse("Cannot follow yourself", 400);
  }

  const database = await db();
  const follows = database.collection("follows");

  if (action === "follow") {
    try {
      // Create follow relationship (unique index prevents duplicates)
      await follows.insertOne({
        followerId,
        targetUserId,
        createdAt: new Date(),
      });
      const followersCount = await follows.countDocuments({ targetUserId });
      return NextResponse.json({ following: true, followersCount }, { headers: NO_CACHE_HEADERS });
    } catch (e: any) {
      // Handle duplicate follow (error code 11000 = duplicate key)
      // Return success since user is already following
      if (e?.code === 11000) {
        const followersCount = await follows.countDocuments({ targetUserId });
        return NextResponse.json({ following: true, followersCount }, { headers: NO_CACHE_HEADERS });
      }
      console.error("Error following user:", e);
      return serverErrorResponse("Failed to follow");
    }
  } else {
    // Unfollow: delete relationship
    await follows.deleteMany({
      followerId,
      targetUserId,
    });
    const followersCount = await follows.countDocuments({ targetUserId });
    return NextResponse.json({ following: false, followersCount }, { headers: NO_CACHE_HEADERS });
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
      .find({ targetUserId: followersOf })
      .sort({ createdAt: -1 })
      .skip((page.page - 1) * page.pageSize)
      .limit(page.pageSize)
      .toArray();

    return NextResponse.json({ items }, { headers: NO_CACHE_HEADERS });
  }

  let who = followingOf;
  if (!who) {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) who = session.user.id;
  }
  if (!who) {
    return errorResponse("Missing userId", 400);
  }

  const items = await follows
    .find({ followerId: who })
    .sort({ createdAt: -1 })
    .skip((page.page - 1) * page.pageSize)
    .limit(page.pageSize)
    .toArray();

  return NextResponse.json({ items }, { headers: NO_CACHE_HEADERS });
}
