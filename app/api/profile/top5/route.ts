import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { FavoritesTop5PayloadSchema } from "@/lib/validation";

export const runtime = "nodejs";

// GET current user's favorites (or ?userId=<id> to view another user's favorites)
export async function GET(req: Request) {
  try {
    const database = await db();
    const users = database.collection("users");
    const reviews = database.collection("reviews");

    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");

    let targetUserId: string | null = userIdParam;

    // If no userId provided, default to current user
    if (!targetUserId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const me = await users.findOne({ email: session.user.email }, { projection: { _id: 1, favoritesTop5: 1 } });
      if (!me?._id) return NextResponse.json({ items: [] });

      targetUserId = String(me._id);
    }

    // Load favoritesTop5 from the user doc
    const targetUser = await users.findOne(
      { _id: new (await import("mongodb")).ObjectId(targetUserId) },
      { projection: { favoritesTop5: 1 } }
    );

    const favorites: Array<{ rank: number; albumId: string }> = Array.isArray(targetUser?.favoritesTop5)
      ? targetUser!.favoritesTop5
      : [];

    const albumIds = favorites.map(f => f.albumId);
    if (albumIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Hydrate from the user's own reviews so UI has cover/artist/rating/snippet
    const hydrated = await reviews
      .find({
        userId: targetUserId,
        albumId: { $in: albumIds },
        deletedAt: null,
      })
      .project({ albumId: 1, rating: 1, body: 1, createdAt: 1, albumSnapshot: 1 })
      .toArray();

    const byAlbum = new Map(hydrated.map(r => [r.albumId, r]));
    const items = favorites
      .map(({ rank, albumId }) => {
        const r: any = byAlbum.get(albumId) ?? null;
        return {
          rank,
          albumId,
          review: r
            ? { rating: r.rating, body: r.body, createdAt: r.createdAt }
            : null,
          albumSnapshot: r?.albumSnapshot ?? null,
        };
      })
      .sort((a, b) => a.rank - b.rank);

    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load favorites" }, { status: 500 });
  }
}

// PUT current user's favoritesTop5 (only albums the user has reviewed)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = FavoritesTop5PayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const database = await db();
    const users = database.collection("users");
    const reviews = database.collection("reviews");

    // Find the current user
    const me = await users.findOne({ email: session.user.email }, { projection: { _id: 1 } });
    if (!me?._id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = String(me._id);
    const favorites = parsed.data.favorites ?? [];

    // Ensure each albumId has a review by this user
    const albumIds = favorites.map(f => f.albumId);
    if (albumIds.length > 0) {
      const reviewCount = await reviews.countDocuments({
        userId,
        albumId: { $in: albumIds },
        deletedAt: null,
      });
      if (reviewCount !== albumIds.length) {
        return NextResponse.json(
          { error: "All favorites must be albums you have reviewed." },
          { status: 400 }
        );
      }
    }

    // Save favoritesTop5 on the user doc (rank + albumId only)
    await users.updateOne(
      { _id: me._id },
      { $set: { favoritesTop5: favorites } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update favorites" }, { status: 500 });
  }
}
