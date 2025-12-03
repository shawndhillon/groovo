/**
 * Purpose:
 *   API route for fetching the current authenticated user's profile data
 *
 * Scope:
 *   Used by profile pages and components that need current user information
 *   Endpoint: GET /api/profile/me
 *
 * Role:
 *   Retrieves authenticated user's profile from database
 *   Counts user's albums (library), reviews, and followers
 *   Returns user metadata including bio, name, username, image, email
 *   Includes saved albums list for the user
 *
 * Deps:
 *   next-auth for session management (getServerSession, authOptions)
 *   lib/mongodb for database connection
 *   MongoDB collections: users, albums, reviews, follows
 *
 * Notes:
 *   Requires authentication (returns 401 if no session)
 *   Falls back to email lookup if user ID from session is invalid
 *   Uses string userKey for consistent ID format across collections
 *   Defaults bio to "This user has no bio yet." if empty
 *   Returns 404 if user not found in database
 */

import { NextResponse } from "next/server"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

/**
 * Fetches the current authenticated user's profile with counts and saved albums
 *
 * @returns {Promise<NextResponse>} JSON response with user data, counts, and savedAlbums array
 * @throws {401} If user is not authenticated
 * @throws {404} If user not found in database
 * @throws {500} If server error occurs
 */
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

    // Canonical ID forms
    const userObjectId =
      user._id instanceof ObjectId ? user._id : new ObjectId(String(user._id));

    // 🔑 This string key is what albums/reviews/follows use
    const userKey = String(userObjectId);

    // 2️⃣ Count albums (library)
    const albumsCount = await albums.countDocuments({ userId: userKey });

    // 3️⃣ Count reviews and followers
    const reviewsCount = await reviews.countDocuments({
      userId: userKey,
      deletedAt: null,
    });
    const followersCount = await follows.countDocuments({
      targetUserId: userKey,
    });

    user.bio = user.bio || "This user has no bio yet.";

    // 4️⃣ Fetch saved albums using the same string key (if you still need them)
    const savedAlbums = await albums
      .find({ userId: userKey })
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
