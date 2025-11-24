// app/api/top-albums-week/route.ts
import { NextResponse } from "next/server";
import topAlbumsData from "@/app/data/topAlbumsWeek.json";
import type { BillboardAlbum } from "@/app/utils/topAlbums";

export async function GET() {
  // topAlbumsData is typed as unknown by default, so cast to our type
  const albums = topAlbumsData as BillboardAlbum[];
  return NextResponse.json(albums);
}
