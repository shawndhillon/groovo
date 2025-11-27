import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = await db();
    const users = database.collection("users");
    const albums = database.collection("albums");
    const reviews = database.collection("reviews");
    const follows = database.collection("follows");

    // Try to get user ID from session, fallback to email lookup
    let userId = (session.user as any)?.id;
    let user: any = null;

    if (userId) {
      // If we have a user ID, try to find by _id
      try {
        const userObjectId = new ObjectId(userId);
        user = await users.findOne(
          { _id: userObjectId },
          {
            projection: {
              _id: 1,
              bio: 1,
              name: 1,
              image: 1,
              username: 1,
              email: 1,
            },
          }
        );
      } catch {
        // Invalid ObjectId, try email lookup instead
        userId = null;
      }
    }

    // If no user found by ID, try email lookup 
    if (!user && session.user?.email) {
      user = await users.findOne(
        { email: session.user.email },
        {
          projection: {
            _id: 1,
            bio: 1,
            name: 1,
            image: 1,
            username: 1,
            email: 1,
          },
        }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userObjectId = user._id instanceof ObjectId ? user._id : new ObjectId(String(user._id));

    // 2️⃣ Count albums
    const albumsCount = await albums.countDocuments({ userId: userObjectId });

    // 3️⃣ Count reviews and followers
    const reviewsCount = await reviews.countDocuments({ userId: String(userObjectId), deletedAt: null });
    const followersCount = await follows.countDocuments({ targetUserId: String(userObjectId) });

    // Attach stats to user object
    user.albumsCount = albumsCount;
    user.reviewsCount = reviewsCount;
    user.followersCount = followersCount;
    user.bio = user.bio || "This user has no bio yet.";

    // 4️⃣ Fetch saved albums
    const savedAlbums = await albums
      .find({ userId: userObjectId })
      .toArray()
      .catch(() => []);

    // 5️⃣ Return full profile
    return NextResponse.json({
      user: {
        _id: String(user._id),
        name: user.name ?? null,
        email: user.email ?? null,
        username: user.username ?? null,
        image: user.image ?? null,
        bio: user.bio ?? null,
        albumsCount,
        reviewsCount,
        followersCount,
      },
      savedAlbums,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
