import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";

export const runtime = "nodejs";

function getUserId(session: any): string | null {
  return session?.user?.id ?? session?.user?.email ?? null;
}

export async function DELETE(
  _req: Request,
  { params }: { params: { albumId: string } }
) {

  const { albumId: rawAlbumId } = await params; 
  const albumId = String(rawAlbumId || "").trim();

  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!albumId) return NextResponse.json({ error: "albumId required" }, { status: 400 });

  await ensureIndexes();
  const database = await db();

  await database.collection("albums").deleteOne({ userId, albumId });
  return NextResponse.json({ ok: true });
}
