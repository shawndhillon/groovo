import { errorResponse } from "@/app/utils/response";
import { fetchUsersByIds } from "@/app/utils/users";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ReqBody = { ids?: string[] };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ReqBody | null;
  const ids = Array.isArray(body?.ids) ? body!.ids.filter(Boolean) : [];
  if (!ids.length) return NextResponse.json({ items: [] });

  // Limit array size to prevent extremely large requests
  if (ids.length > 100) {
    return errorResponse("Maximum 100 user IDs allowed", 400);
  }

  const userMap = await fetchUsersByIds(ids);

  return NextResponse.json({
    items: Array.from(userMap.values()),
  });
}
