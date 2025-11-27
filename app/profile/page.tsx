// app/profile/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import UserHeader from "@/app/profile/UserHeader";
import AddFavoriteButton from "@/app/components/AddTop5Button";
import SavedAlbumsGrid, { SavedAlbum } from "@/app/profile/SavedAlbumsGrid";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useUserReviews } from "../hooks/useUserReviews";
import TopFiveFavoritesView from "./TopFiveFavoritesView";
import Link from "next/link"; 


export default function ProfilePage() {
  const router = useRouter();
  const {
    user: currentUser,
    isLoading: isUserLoading,
    errorText: userError,
  } = useCurrentUser();

  const {
    items: reviews,
    loading: reviewsLoading,
    error: reviewsError,
  } = useUserReviews(currentUser?._id ?? null);

  useEffect(() => {
    if (!isUserLoading && !userError && !currentUser) {
      router.replace("/login");
    }
  }, [isUserLoading, userError, currentUser, router]);

  // Map API reviews -> grid DTO, with fallbacks
  const albumsForGrid: SavedAlbum[] = useMemo(() => {
    return (reviews || []).map((r) => {
      // prefer albumSnapshot; fallback to legacy "album"; else {}
      const snap = r.albumSnapshot ?? (r as any).album ?? {};

      const name = typeof snap.name === "string" && snap.name.trim() ? snap.name : "Unknown";
      const artists =
        Array.isArray(snap.artists) && snap.artists.length > 0
          ? snap.artists
          : [{ id: "unknown", name: "Unknown Artist" }];

      const images =
        Array.isArray(snap.images) && snap.images.length > 0
          ? snap.images
          : [{ url: "/placeholder-album.svg", width: 640, height: 640 }];

      return {
        id: r.albumId,
        name,
        artists,
        images,
        review: {
          rating: r.rating,
          reviewText: r.body,
          createdAt: r.createdAt,
        },
        savedAt: r.createdAt,
      } as SavedAlbum;
    });
  }, [reviews]);

  // 1) Loading view
  if (isUserLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <p>Loading profile...</p>
      </main>
    );
  }

  // 2) Error view (non-auth)
  if (userError) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-400">
        <p>{userError}</p>
      </main>
    );
  }

  // 3) Unauthenticated fallback (if redirect hasn't executed yet)
  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-400">
        <p>You must log in to view your profile.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-6 pb-12">
        <UserHeader user={currentUser} loading={false} />

        <section className="mt-8">
          <TopFiveFavoritesView />
        </section>
        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Library</h2>
            <Link
              href="/library"
              className="text-sm font-medium text-purple-400 hover:text-purple-300 hover:underline"
            >
              Open Library
            </Link>
          </div>
          <p className="text-sm text-zinc-400">
            View and manage your saved albums.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">My Reviews</h2>
          <SavedAlbumsGrid
            albums={albumsForGrid}
            loading={reviewsLoading}
            error={reviewsError}
            emptyAs="reviews"
            showRating
            showSnippet
            renderAction={(a) => <AddFavoriteButton albumId={a.id} />}
          />
        </section>
      </div>
    </main>
  );
}
