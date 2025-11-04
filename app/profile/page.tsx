"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserHeader from "@/app/profile/UserHeader";
import SavedAlbumsGrid from "@/app/profile/SavedAlbumsGrid";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  username?: string;
  image?: string;
  bio?: string;
  albumsCount?: number;
  reviewsCount?: number;
  followersCount?: number;
}

interface Album {
  _id: string;
  userId: string;
  title: string;
  artist: string;
  coverUrl?: string;
  review?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [savedAlbums, setSavedAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile/me", {
          credentials: "include",
          signal: controller.signal,
        });

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch profile: ${res.statusText}`);
        }

        const data = await res.json();
        setUserProfile(data.user);
        setSavedAlbums(data.savedAlbums || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Profile fetch error:", err);
          setError(err.message || "Unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();

    return () => controller.abort();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-400">
        <p>{error}</p>
      </main>
    );
  }

  if (!userProfile) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-400">
        <p>You must log in to view your profile.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
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
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-12">
        <UserHeader user={userProfile} loading={loading} />
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Saved Albums & Reviews</h2>
          <SavedAlbumsGrid albums={savedAlbums} loading={loading} error={error} />
        </div>
      </div>
    </main>
  );
}