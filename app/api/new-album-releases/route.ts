import { NextResponse } from "next/server";
import SpotifyWebApi from "spotify-web-api-node";

const spotify = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market") || "US";
  const limit = Math.min(Number(searchParams.get("limit") || 5), 50); // Spotify max 50

  try {
    // App token (no user login needed)
    const token = await spotify.clientCredentialsGrant();
    spotify.setAccessToken(token.body.access_token);

    const resp = await spotify.getNewReleases({ country: market, limit, offset: 0 });
    const items = resp.body.albums?.items ?? [];

    // Return only what you need (optional slimming)
    const payload = items.map(a => ({
      id: a.id,
      name: a.name,
      artists: a.artists?.map(x => ({ id: x.id, name: x.name })) ?? [],
      images: a.images, // [0] is usually largest
      release_date: a.release_date,
      precision: a.release_date_precision,
      url: a.external_urls?.spotify,
    }));

    return NextResponse.json({ market, count: payload.length, items: payload });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
