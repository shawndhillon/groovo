// Not working, need to add to backlog

import SpotifyWebApi from "spotify-web-api-node";
import { db } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/ensure-indexes";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
});

// Simple token helper (same pattern as /api/spotify)
async function ensureSpotifyToken() {
  const tokenData = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(tokenData.body.access_token);
}

/**
 * Types
 */

export type UserTasteProfile = {
  userId: string;
  topGenres: { name: string; score: number }[];
  topArtists: { id?: string; name: string; score: number }[];
  audioProfile: {
    danceability: number | null;
    energy: number | null;
    valence: number | null;
    tempo: number | null;
    acousticness: number | null;
    instrumentalness: number | null;
    speechiness: number | null;
  };
  sourceCounts: {
    totalAlbumsConsidered: number;
    fromLibrary: number;
    fromReviews: number;
  };
};

// --- NEW: recommendation result type ---

export type AlbumRecommendation = {
  albumId: string;
  name: string;
  artists: { id?: string; name: string }[];
  imageUrl?: string;
  spotifyUrl?: string;
  reason?: string;
};

/**
 * Public entrypoint for Part B:
 * Build a taste profile, then use it to fetch Spotify recommendations
 * and aggregate them into unique albums.
 */

export async function getRecommendationsForUser(
  userId: string
): Promise<AlbumRecommendation[]> {
  // 1) Collect user signals (saves + reviews) directly
  await ensureIndexes();
  const database = await db();

  const { signals, sources } = await getUserAlbumSignals(database, userId);

  // No signals at all → cold-start fallback (new releases)
  if (signals.length === 0) {
    return await getColdStartRecommendations();
  }

  // Aggregate weights per album
  const weightsByAlbumId: Record<string, number> = {};
  for (const s of signals) {
    weightsByAlbumId[s.albumId] =
      (weightsByAlbumId[s.albumId] || 0) + s.weight;
  }

  const albumIds = Object.keys(weightsByAlbumId);
  if (albumIds.length === 0) {
    return await getColdStartRecommendations();
  }

  // 2) Fetch metadata for those albums (using the same helper you already have)
  const albumsWithFeatures = await fetchAlbumMetadataAndFeatures(albumIds);

  if (albumsWithFeatures.length === 0) {
    return await getColdStartRecommendations();
  }

  // 3) Sort albums by their weight (strongest signal first)
  const sorted = albumsWithFeatures.sort(
    (a, b) =>
      (weightsByAlbumId[b.albumId] || 0) -
      (weightsByAlbumId[a.albumId] || 0)
  );

  // 4) Map to AlbumRecommendation objects
  const recs: AlbumRecommendation[] = [];
  for (const alb of sorted) {
    if (!alb.albumId) continue;

    const fromReviews = sources.fromReviews.has(alb.albumId);
    const fromLibrary = sources.fromLibrary.has(alb.albumId);

    let reason: string | undefined;
    if (fromReviews) {
      reason = "Based on your review of this album";
    } else if (fromLibrary) {
      reason = "Because you saved this to your library";
    } else {
      reason = "Based on your past activity";
    }

    recs.push({
      albumId: alb.albumId,
      name: alb.albumName,
      artists: alb.artists,
      imageUrl: undefined, // we'll fill in below if available
      spotifyUrl: undefined,
      reason,
    });
  }

  // 5) Enrich with cover + links from Spotify album objects we already fetched
  //    (albumsWithFeatures doesn't currently surface images/urls, but we can
  //     extend it if needed; for now, we can optionally re-fetch a few albums
  //     or keep it simple if your UI tolerates missing images.)
  //
  // For now: keep it simple and just return the first 12 recommendations.
  return recs.slice(0, 12);
}

// Fetch albums from related artists of the given seed artists
async function getAlbumsFromRelatedArtists(
  seedArtistIds: string[],
  reason?: string
): Promise<AlbumRecommendation[]> {
  const albumMap = new Map<string, AlbumRecommendation>();

  for (const artistId of seedArtistIds) {
    try {
      // 1) Get related artists for each seed artist
      const relatedRes = await spotifyApi.getArtistRelatedArtists(artistId);
      const relatedArtists = relatedRes.body.artists ?? [];

      // Take a few related artists per seed to keep calls bounded
      for (const rel of relatedArtists.slice(0, 3)) {
        if (!rel.id) continue;

        try {
          // 2) Fetch their albums/singles
          const albumsRes = await spotifyApi.getArtistAlbums(rel.id, {
            include_groups: "album,single",
            limit: 5,
            country: "US",
          });

          const albums = albumsRes.body.items ?? [];

          for (const alb of albums) {
            if (!alb.id || albumMap.has(alb.id)) continue;

            albumMap.set(alb.id, {
              albumId: alb.id,
              name: alb.name,
              artists: (alb.artists || []).map((a: any) => ({
                id: a.id,
                name: a.name,
              })),
              imageUrl: alb.images?.[0]?.url,
              spotifyUrl: alb.external_urls?.spotify,
              reason:
                reason ??
                `Based on artists related to ${rel.name}`,
            });
          }
        } catch (err) {
          console.warn(
            "Failed to fetch albums for related artist",
            rel.id,
            err
          );
        }
      }
    } catch (err) {
      console.warn("Failed to fetch related artists for seed", artistId, err);
    }
  }

  return Array.from(albumMap.values());
}

// ❄️ Cold-start recommendations for new users with little/no history.
// Uses generic popular seeds and neutral audio targets.
async function getColdStartRecommendations(): Promise<AlbumRecommendation[]> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.warn("Spotify credentials missing; cannot build cold-start recs.");
    return [];
  }

  await ensureSpotifyToken();

  try {
    // This endpoint is already working elsewhere in your app
    const res = await spotifyApi.getNewReleases({
      limit: 20,
      country: "US",
    });

    const albums = res.body.albums?.items ?? [];

    const mapped: AlbumRecommendation[] = albums.map((alb: any) => ({
      albumId: alb.id,
      name: alb.name,
      artists: (alb.artists || []).map((a: any) => ({
        id: a.id,
        name: a.name,
      })),
      imageUrl: alb.images?.[0]?.url,
      spotifyUrl: alb.external_urls?.spotify,
      reason: "Starter picks based on what's new right now",
    }));

    return mapped.slice(0, 12);
  } catch (err) {
    console.error("Failed to fetch cold-start recommendations (new releases)", err);
    return [];
  }
}

function mapTracksToAlbumRecommendations(
  tracks: any[],
  reason?: string
): AlbumRecommendation[] {
  const albumMap = new Map<string, AlbumRecommendation>();

  for (const t of tracks) {
    if (!t.album) continue;
    const alb = t.album;
    const albumId = alb.id;
    if (!albumId) continue;

    if (!albumMap.has(albumId)) {
      albumMap.set(albumId, {
        albumId,
        name: alb.name,
        artists: (alb.artists || []).map((a: any) => ({
          id: a.id,
          name: a.name,
        })),
        imageUrl: alb.images?.[0]?.url,
        spotifyUrl: alb.external_urls?.spotify,
        reason,
      });
    }
  }

  return Array.from(albumMap.values());
}


/**
 * Pick seed genres / artists for Spotify recommendations and
 * construct a simple reason string.
 */
function pickSeedsFromProfile(profile: UserTasteProfile): {
  seedGenres: string[];      // kept in the type for compatibility, but unused
  seedArtistIds: string[];
  reason?: string;
} {
  // We won't actually send these to Spotify, but we still use them in the
  // human-readable "reason" string.
  const topGenreNames = profile.topGenres.map((g) => g.name);

  const seedArtistIds = profile.topArtists
    .filter((a) => !!a.id)
    .slice(0, 10)
    .map((a) => a.id as string);

  const pieces: string[] = [];

  if (topGenreNames.length > 0) {
    pieces.push(`your love for ${topGenreNames[0]} music`);
  }
  if (profile.topArtists.length > 0) {
    pieces.push(`artists like ${profile.topArtists[0].name}`);
  }

  const reason =
    pieces.length > 0 ? `Based on ${pieces.join(" and ")}` : undefined;

  // seedGenres is unused in the current recommendations call, but we return an
  // empty array to keep the function signature compatible.
  return { seedGenres: [], seedArtistIds, reason };
}


type AlbumWithFeatures = {
  albumId: string;
  albumName: string;
  artists: { id?: string; name: string }[];
  genres: string[];
  audioFeatures?: {
    danceability: number;
    energy: number;
    valence: number;
    tempo: number;
    acousticness: number;
    instrumentalness: number;
    speechiness: number;
  };
};

type AlbumSignal = {
  albumId: string;
  weight: number;
};

type SignalSources = {
  fromLibrary: Set<string>;
  fromReviews: Set<string>;
};

/**
 * Public entrypoint: build a taste profile for a given user.
 * Returns null if there is not enough data.
 */
export async function buildUserTasteProfile(
  userId: string
): Promise<UserTasteProfile | null> {
  await ensureIndexes();
  const database = await db();

  // 1) Collect album "signals" from library + reviews
  const { signals, sources } = await getUserAlbumSignals(database, userId);
  if (signals.length === 0) {
    return null; // nothing to base recommendations on
  }

  const weightsByAlbumId: Record<string, number> = {};
  for (const s of signals) {
    weightsByAlbumId[s.albumId] = (weightsByAlbumId[s.albumId] || 0) + s.weight;
  }

  const albumIds = Object.keys(weightsByAlbumId);
  if (albumIds.length === 0) {
    return null;
  }

  // 2) Fetch Spotify metadata + audio features
  const albumsWithFeatures = await fetchAlbumMetadataAndFeatures(albumIds);

  if (albumsWithFeatures.length === 0) {
    return null;
  }

  // 3) Aggregate into a profile
  const profile = aggregateTasteProfile(
    userId,
    albumsWithFeatures,
    weightsByAlbumId,
    {
      fromLibrary: sources.fromLibrary.size,
      fromReviews: sources.fromReviews.size,
      totalAlbumsConsidered: albumIds.length,
    }
  );

  return profile;
}

/**
 * Collect user "signals" from MongoDB:
 * - Library saves from `albums` collection
 * - Reviews from `reviews` collection (weighted by rating)
 */
async function getUserAlbumSignals(
  database: Awaited<ReturnType<typeof db>>,
  userId: string
): Promise<{ signals: AlbumSignal[]; sources: SignalSources }> {
  const albumsCollection = database.collection("albums");
  const reviewsCollection = database.collection("reviews");

  const signals: AlbumSignal[] = [];
  const fromLibrary = new Set<string>();
  const fromReviews = new Set<string>();

  // Library saves: base weight 1.0 each
  const libraryDocs = await albumsCollection
    .find({ userId })
    .project<{ albumId: string }>({ albumId: 1 })
    .toArray();

  for (const d of libraryDocs) {
    if (!d.albumId) continue;
    fromLibrary.add(d.albumId);
    signals.push({ albumId: d.albumId, weight: 1.0 });
  }

  // Reviews: stronger signal, weighted by rating if present
  const reviewDocs = await reviewsCollection
    .find({ userId })
    .project<{ albumId: string; rating?: number | null }>({
      albumId: 1,
      rating: 1,
    })
    .toArray();

  for (const r of reviewDocs) {
    if (!r.albumId) continue;
    fromReviews.add(r.albumId);

    const rating = typeof r.rating === "number" ? r.rating : null;
    // Base weight for "reviewed at all"
    let weight = 1.5;
    // Add rating influence if 1–5
    if (rating && rating >= 1 && rating <= 5) {
      // maps 1–5 to +0.2 … +1.0
      weight += (rating / 5) * 1.0;
    }
    signals.push({ albumId: r.albumId, weight });
  }

  return { signals, sources: { fromLibrary, fromReviews } };
}

/**
 * Fetch Spotify metadata + audio features for the given album IDs.
 * NOTE: This is intentionally simple and not highly optimized;
 * it's perfectly fine for a class project and small user histories.
 */
async function fetchAlbumMetadataAndFeatures(
  albumIds: string[]
): Promise<AlbumWithFeatures[]> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.warn("Spotify credentials missing; cannot build taste profile.");
    return [];
  }

  await ensureSpotifyToken();

  const uniqueIds = Array.from(new Set(albumIds)).slice(0, 25); // cap to avoid huge calls
  const results: AlbumWithFeatures[] = [];

  for (const id of uniqueIds) {
    try {
      const albumRes = await spotifyApi.getAlbum(id);
      const album = albumRes.body;

      // Collect artist genres
      const artistIds = album.artists
        .map((a) => a.id)
        .filter((x): x is string => !!x);

      const genresSet = new Set<string>();

      if (artistIds.length > 0) {
        const artistsRes = await spotifyApi.getArtists(artistIds);
        for (const artist of artistsRes.body.artists) {
          if (Array.isArray(artist.genres)) {
            for (const g of artist.genres) {
              const clean = (g || "").trim().toLowerCase();
              if (clean) genresSet.add(clean);
            }
          }
        }
      }

      // Take first track and fetch audio features for it
      let audioFeatures: AlbumWithFeatures["audioFeatures"] | undefined;
      const firstTrack = album.tracks?.items?.[0];

      if (firstTrack && firstTrack.id) {
        try {
          const featRes = await spotifyApi.getAudioFeaturesForTrack(
            firstTrack.id
          );
          const f = featRes.body;
          audioFeatures = {
            danceability: f.danceability ?? 0,
            energy: f.energy ?? 0,
            valence: f.valence ?? 0,
            tempo: f.tempo ?? 0,
            acousticness: f.acousticness ?? 0,
            instrumentalness: f.instrumentalness ?? 0,
            speechiness: f.speechiness ?? 0,
          };
        } catch (err) {
          console.warn("Failed to fetch audio features for track", firstTrack.id, err);
        }
      }

      results.push({
        albumId: album.id,
        albumName: album.name,
        artists: album.artists.map((a) => ({ id: a.id, name: a.name })),
        genres: Array.from(genresSet),
        audioFeatures,
      });
    } catch (err) {
      console.warn("Failed to fetch Spotify album", id, err);
      continue;
    }
  }

  return results;
}

/**
 * Aggregate per-album metadata into a single UserTasteProfile.
 */
function aggregateTasteProfile(
  userId: string,
  albums: AlbumWithFeatures[],
  weightsByAlbumId: Record<string, number>,
  counts: { totalAlbumsConsidered: number; fromLibrary: number; fromReviews: number }
): UserTasteProfile {
  const genreScores: Record<string, number> = {};
  const artistScores: Record<string, { id?: string; name: string; score: number }> = {};

  let sumWeightForAudio = 0;
  let sumDanceability = 0;
  let sumEnergy = 0;
  let sumValence = 0;
  let sumTempo = 0;
  let sumAcousticness = 0;
  let sumInstrumentalness = 0;
  let sumSpeechiness = 0;

  for (const album of albums) {
    const w = weightsByAlbumId[album.albumId] ?? 1;

    // Genres
    for (const g of album.genres) {
      const key = g.trim().toLowerCase();
      if (!key) continue;
      genreScores[key] = (genreScores[key] || 0) + w;
    }

    // Artists
    for (const artist of album.artists) {
      const key = artist.id || artist.name;
      if (!key) continue;
      if (!artistScores[key]) {
        artistScores[key] = { id: artist.id, name: artist.name, score: 0 };
      }
      artistScores[key].score += w;
    }

    // Audio features
    if (album.audioFeatures) {
      const f = album.audioFeatures;
      sumWeightForAudio += w;
      sumDanceability += f.danceability * w;
      sumEnergy += f.energy * w;
      sumValence += f.valence * w;
      sumTempo += f.tempo * w;
      sumAcousticness += f.acousticness * w;
      sumInstrumentalness += f.instrumentalness * w;
      sumSpeechiness += f.speechiness * w;
    }
  }

  const topGenres = Object.entries(genreScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, score]) => ({ name, score }));

  const topArtists = Object.values(artistScores)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const audioProfile = {
    danceability: sumWeightForAudio ? sumDanceability / sumWeightForAudio : null,
    energy: sumWeightForAudio ? sumEnergy / sumWeightForAudio : null,
    valence: sumWeightForAudio ? sumValence / sumWeightForAudio : null,
    tempo: sumWeightForAudio ? sumTempo / sumWeightForAudio : null,
    acousticness: sumWeightForAudio ? sumAcousticness / sumWeightForAudio : null,
    instrumentalness: sumWeightForAudio ? sumInstrumentalness / sumWeightForAudio : null,
    speechiness: sumWeightForAudio ? sumSpeechiness / sumWeightForAudio : null,
  };

  return {
    userId,
    topGenres,
    topArtists,
    audioProfile,
    sourceCounts: {
      totalAlbumsConsidered: counts.totalAlbumsConsidered,
      fromLibrary: counts.fromLibrary,
      fromReviews: counts.fromReviews,
    },
  };
}