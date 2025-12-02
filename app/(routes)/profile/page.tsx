/**
 * Purpose:
 *   Authenticated profile dashboard for the currently signed-in user.
 *
 * Scope:
 *   - Route: /profile (non-dynamic, only for "me")
 *   - Mounted as a client component in the profile route group
 *   - Displays user header, Top 5 favorites, library CTA, and review-derived grid
 *
 * Role:
 *   - Guards the route and redirects unauthenticated users to /login
 *   - Fetches the current user via useCurrentUser()
 *   - Fetches the user's reviews via useUserReviews(userId)
 *   - Maps review data into SavedAlbum cards for a "My Reviews" grid
 *   - Provides an entry point to the full library (/library) and Top 5 editor
 *
 * Deps:
 *   - next/navigation: useRouter for client-side redirects
 *   - next/link: Link for navigation to /library
 *   - app/components/Header: global site header (navigation, branding)
 *   - app/(routes)/profile/components/UserHeader: profile banner (avatar, name, stats)
 *   - app/(routes)/profile/components/AddTop5Button: action to add album to Top 5
 *   - app/(routes)/profile/components/SavedAlbumsGrid: reusable album grid UI
 *   - app/(routes)/profile/components/TopFiveFavoritesView: Top 5 favorites section
 *   - app/utils/albumsGrid: SavedAlbum type + mapReviewsToSavedAlbums helper
 *   - app/hooks/useCurrentUser: fetches authenticated user and auth state
 *   - app/hooks/useUserReviews: fetches reviews authored by the given user
 *
 * Notes:
 *   - This page assumes a valid JWT/session: if no user is returned and no error,
 *     it triggers a redirect to /login on mount.
 *   - The "My Reviews" grid is derived from reviews, not a separate saved-list
 *     data source; each tile can render rating + snippet from the review.
 *   - Type casting of reviews to any in mapReviewsToSavedAlbums is a known
 *     tradeoff; consider tightening the shared Review types in a central module.
 *   - Visual layout uses a gradient background consistent with the rest of the app.
 */

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Header from "@/app/components/Header";
import UserHeader from "@/app/(routes)/profile/components/UserHeader";
import AddFavoriteButton from "@/app/(routes)/profile/components/AddFavoriteButton";
import SavedAlbumsGrid from "@/app/(routes)/profile/components/SavedAlbumsGrid";
import TopFiveFavoritesView from "./components/TopFiveFavoritesView";

import type { SavedAlbum } from "@/app/utils/albumCollections";
import { mapReviewsToSavedAlbums } from "@/app/utils/albumCollections";

import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useUserReviews } from "@/app/hooks/useUserReviews";

/**
 * ProfilePage
 *
 * Main profile screen for the authenticated user.
 * Handles auth guard, data fetching, and high-level layout; delegates
 * all detailed rendering to child components.
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

  // Auth guard: once user loading is resolved, redirect anonymous visitors.
  useEffect(() => {
    if (!isUserLoading && !userError && !currentUser) {
      router.replace("/login");
    }
  }, [isUserLoading, userError, currentUser, router]);

  // Normalize reviews into SavedAlbum cards for the grid.
  const albumsForGrid: SavedAlbum[] = useMemo(
    () => mapReviewsToSavedAlbums(reviews as any),
    [reviews],
  );

  // 1) Loading view while we fetch the current user.
  if (isUserLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <p>Loading profile...</p>
      </main>
    );
  }

  // 2) Error view (auth or fetch failure).
  if (userError) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-400">
        <p>{userError}</p>
      </main>
    );
  }

  // 3) Unauthenticated fallback (in case redirect has not fired yet).
  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-400">
        <p>You must log in to view your profile.</p>
      </main>
    );
  }

  // 4) Authenticated profile layout.
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />

      <div className="mx-auto max-w-7xl px-6 pb-12">
        {/* User banner: avatar, display name, and profile meta */}
        <UserHeader user={currentUser} loading={false} isSelf />

        {/* Top 5 favorites editor/view */}
        <section className="mt-8">
          <TopFiveFavoritesView />
        </section>

        {/* Library CTA section (links to full library page) */}
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

        {/* Review-derived album grid (each tile shows rating + snippet) */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">My Reviews</h2>
          <SavedAlbumsGrid
            albums={albumsForGrid}
            loading={reviewsLoading}
            error={reviewsError}
            emptyAs="reviews"
            showRating
            showSnippet
            renderAction={(album) => <AddFavoriteButton albumId={album.id} />}
          />
        </section>
      </div>
    </main>
  );
}
