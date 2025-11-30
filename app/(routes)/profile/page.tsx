"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Header from "@/app/components/Header";
import UserHeader from "@/app/(routes)/profile/components/UserHeader";
import AddFavoriteButton from "@/app/(routes)/profile/components/AddTop5Button";
import SavedAlbumsGrid from "@/app/(routes)/profile/components/SavedAlbumsGrid";
import TopFiveFavoritesView from "./components/TopFiveFavoritesView";

import type { SavedAlbum } from "@/app/utils/albumsGrid";
import { mapReviewsToSavedAlbums } from "@/app/utils/albumsGrid";

import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useUserReviews } from "@/app/hooks/useUserReviews";

/**
 * ProfilePage
 *
 * Authenticated user profile screen that:
 * - Redirects unauthenticated users to /login
 * - Shows the user's header info (avatar, name, etc.)
 * - Displays their Top 5 favorite albums section
 * - Displays a "My Library" CTA to open the full library view
 * - Renders a grid of albums derived from the user's reviews
 *   (each tile includes rating + review snippet)
 */
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
  const albumsForGrid: SavedAlbum[] = useMemo(
    () => mapReviewsToSavedAlbums(reviews as any),
    [reviews],
  );

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
        <UserHeader user={currentUser} loading={false} isSelf />

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
