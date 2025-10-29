"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SpotifyAlbumWithTracks } from "@/app/types/spotify";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

interface Review {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export default function AlbumPage({ params }: AlbumPageProps) {
  const router = useRouter();
  const [album, setAlbum] = useState<SpotifyAlbumWithTracks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [albumId, setAlbumId] = useState<string | null>(null);
  
  // Mock reviews data (frontend only)
  const [reviews] = useState<Review[]>([
    {
      id: "1",
      userName: "musiclover23",
      rating: 5,
      reviewText: "This album is absolutely incredible. Every track is a masterpiece and the production quality is outstanding.",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      userName: "vinylcollector",
      rating: 4,
      reviewText: "Solid album with great vibes. Some tracks really stand out, though there are a few weaker moments.",
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      userName: "soundexplorer",
      rating: 5,
      reviewText: "A timeless classic. The artist really delivered on this one. Perfect for late-night listening.",
      createdAt: "2024-01-05",
    },
  ]);

  useEffect(() => {
    // Resolve params
    params.then(({ id }) => setAlbumId(id));
  }, [params]);

  useEffect(() => {
    if (!albumId) return;

    const fetchAlbum = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/album/${albumId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch album");
        }

        const data = await response.json();
        setAlbum(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remSeconds = seconds % 60;
    return `${minutes}:${remSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string, precision: string) => {
    const date = new Date(dateStr);
    if (precision === "year") return date.getFullYear().toString();
    if (precision === "month") {
      return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(date);
    }
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link href="/">
                <div className="h-6 w-6 rounded-md bg-violet-500" />
              </Link>
              <Link href="/">
                <span className="text-lg font-semibold tracking-tight hover:text-violet-400 transition">
                  Groovo
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/discover"
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Discover
              </Link>
              <Link 
                href="/profile" 
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Profile
              </Link>
            </div>
          </div>
          
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-zinc-400 hover:text-white transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Album Artwork Skeleton */}
            <div className="flex-shrink-0">
              <div className="w-full md:w-80 aspect-square rounded-lg bg-zinc-800 animate-pulse" />
            </div>
            
            {/* Album Info Skeleton */}
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-zinc-800 rounded animate-pulse w-64" />
              <div className="h-6 bg-zinc-800 rounded animate-pulse w-48" />
              <div className="h-4 bg-zinc-800 rounded animate-pulse w-32" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !album) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link href="/">
                <div className="h-6 w-6 rounded-md bg-violet-500" />
              </Link>
              <Link href="/">
                <span className="text-lg font-semibold tracking-tight hover:text-violet-400 transition">
                  Groovo
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/discover"
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Discover
              </Link>
              <Link 
                href="/profile" 
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                Profile
              </Link>
            </div>
          </div>
          
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-200 mb-2">Failed to load album</p>
            <p className="text-sm text-red-300">{error || "Album not found"}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <div className="h-6 w-6 rounded-md bg-violet-500" />
            </Link>
            <Link href="/">
              <span className="text-lg font-semibold tracking-tight hover:text-violet-400 transition">
                Groovo
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/discover"
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Discover
            </Link>
            <Link 
              href="/profile" 
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Album Artwork */}
          <div className="flex-shrink-0">
            <img
              src={album.images[0]?.url || "/placeholder-album.png"}
              alt={album.name}
              className="w-full md:w-80 rounded-lg shadow-2xl"
            />
          </div>

          {/* Album Info */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{album.name}</h1>
            <p className="text-xl text-zinc-300 mb-6">
              {album.artists.map((artist) => artist.name).join(", ")}
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400 mb-6">
              <span>{formatDate(album.release_date, album.release_date_precision)}</span>
              <span>•</span>
              <span>{album.total_tracks} tracks</span>
              {album.genres.length > 0 && (
                <>
                  <span>•</span>
                  <span>{album.genres.slice(0, 3).join(", ")}</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <a
                href={album.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-6 py-3 text-sm font-medium text-white hover:bg-violet-600 transition"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Play on Spotify
              </a>
              
              <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Review Album
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Compact Tracklist */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur">
            <h2 className="text-xl font-semibold mb-3">Tracklist</h2>
            <div className="max-h-96 overflow-y-auto space-y-1 pr-2">
              {album.tracks.items.slice(0, 12).map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-800 transition"
                >
                  <span className="text-zinc-500 text-xs w-6 text-right">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{track.name}</p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {formatDuration(track.duration_ms)}
                  </span>
                </div>
              ))}
            </div>
            {album.tracks.total > 12 && (
              <p className="text-sm text-zinc-400 mt-3 text-center">
                +{album.tracks.total - 12} more tracks
              </p>
            )}
          </div>

          {/* Reviews Section */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Reviews</h2>
              <span className="text-sm text-zinc-400">{reviews.length} reviews</span>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-violet-400">
                        {review.userName[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{review.userName}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? "fill-violet-500 text-violet-500"
                                : "fill-zinc-700 text-zinc-700"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300">{review.reviewText}</p>
                  <p className="text-xs text-zinc-500 mt-2">{review.createdAt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

