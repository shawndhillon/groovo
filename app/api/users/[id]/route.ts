
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const database = await db();
  const users = database.collection("users");
  const reviews = database.collection("reviews");
  const follows = database.collection("follows");


  let _id: ObjectId;
  try {
    _id = new ObjectId(id);
  } catch {
    return NextResponse.json(
      { error: "Invalid user id" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }


  const user = await users.findOne(
    { _id },
    { projection: { _id: 1, username: 1, name: 1, image: 1, bio: 1, createdAt: 1 } }
  );
  if (!user) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const [reviewsCount, followersCount, followingCount] = await Promise.all([
    reviews.countDocuments({ userId: String(_id), deletedAt: null }),
    follows.countDocuments({ targetUserId: String(_id) }),
    follows.countDocuments({ followerId: String(_id) }),
  ]);

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  let youFollow = false;
  if (viewerId && viewerId !== String(_id)) {
    const rel = await follows.findOne({
      followerId: viewerId,
      targetUserId: String(_id),
    });
    youFollow = !!rel;
  }

  return NextResponse.json(
    {
      user: {
        id: String(user._id),
        username: user.username ?? null,
        name: user.name ?? null,
        image: user.image ?? null,
        bio: user.bio ?? null,
        createdAt: user.createdAt ?? null,
        stats: {
          reviewsCount,
          followersCount,
          followingCount,
        },
        viewer: {
          you: viewerId,
          isSelf: viewerId === String(_id),
          youFollow,
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
