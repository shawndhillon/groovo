/**
 * Purpose:
 *   Personalized event discovery page for the authenticated user.
 *
 * Scope:
 *   - Route: /events (non-dynamic client component)
 *   - Displays upcoming events for artists derived from the user's reviews
 *     and saved library entries
 *   - Provides inline location filtering (city, state, country)
 *
 * Role:
 *   - Guards the route and redirects anonymous users to /login
 *   - Fetches the authenticated user via useCurrentUser()
 *   - Fetches user-authored reviews via useUserReviews(userId)
 *   - Fetches user's library albums via useLibrary()
 *   - Normalizes artist names across reviews and library entries
 *   - Queries Ticketmaster events via useEventsbyArtist() and auto-sorts them by date
 *   - Renders an event grid including date, venue, image, and ticket link
 *
 * Deps:
 *   - next/navigation: useRouter for login redirect
 *   - app/components/Header: global site navigation and branding
 *   - app/hooks/useCurrentUser: resolves current user and auth state
 *   - app/hooks/useUserReviews: loads user-authored review documents
 *   - app/hooks/useLibrary: loads saved library album snapshots
 *   - app/hooks/useEventsbyArtist: fetches events by artist names + location filter
 *
 * Notes:
 *   - Artist extraction merges two data models:
 *       • reviews: artists stored as objects ({ name: string })
 *       • library: artists stored as simple strings
 *     These are unified and deduped via useMemo.
 *   - Location filtering is applied client-side for reactive filtering.
 *   - If the user is not authenticated, nothing is rendered; the redirect
 *     executes from useEffect to preserve client-side routing semantics.
 *   - Layout follows the design language of the app (dark gradient backgrounds,
 *     rounded cards, subtle transitions).
 */

"use client";
import { useState } from "react";
import Header from "@/app/components/Header";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useUserReviews } from "@/app/hooks/useUserReviews";
import { useLibrary } from "@/app/hooks/useLibrary";
import { useEventsbyArtist } from "@/app/hooks/useEventsbyArtist";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

/**
 * EventsPage
 *
 * Displays a personalized list of upcoming concerts and events for
 * artists derived from the user's reviews and saved albums.
 * Includes location filtering and auth guarding.
 *
 * @returns {JSX.Element | null}
 */
export default function EventsPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const { items: reviews } = useUserReviews(currentUser?._id ?? null);
  const { albums: libraryAlbums } = useLibrary();

  /** User-controlled location filter (matches city/state/country) */
  const [location, setLocation] = useState("");

  /**
   * Auth guard: redirects to /login if no authenticated user is found
   * after the initial loading state resolves.
   */
  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.replace("/login");
    }
  }, [isUserLoading, currentUser, router]);

  /**
   * Extracts all artist names from:
   *   - reviews (object-based artist model)
   *   - library albums (string-based artist model)
   *
   * Returns a deduped array of artist names.
   *
   * @type {string[]}
   */
  const artistNames = useMemo(() => {
    const names: string[] = [];

    // Artists from reviewed albums
    if (reviews) {
      for (const r of reviews) {
        const snap = r.albumSnapshot;
        if (snap?.artists) {
          for (const artist of snap.artists) {
            if (artist?.name) names.push(artist.name);
          }
        }
      }
    }

    // Artists from user's library albums
    if (libraryAlbums) {
      for (const album of libraryAlbums) {
        if (Array.isArray(album.artists)) {
          for (const artist of album.artists) {
            if (typeof artist === "string" && artist.trim()) {
              names.push(artist.trim());
            }
          }
        }
      }
    }

    return [...new Set(names)];
  }, [reviews, libraryAlbums]);

  /**
   * Fetches events for the aggregated artist list, optionally filtered by location.
   * The hook sorts results by date internally.
   */
  const { events, loading: eventsLoading } = useEventsbyArtist(
    artistNames,
    location
  );

  // Prevent premature rendering (router redirect will handle unauthenticated users)
  if (!currentUser) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <h1 className="text-3xl font-semibold mt-8">Upcoming Events</h1>
        <p className="text-zinc-400 mb-6">
          Events from artists whose albums you've reviewed or saved to your library.
        </p>

        {/* Location Filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Filter by location (city, state, country)…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {eventsLoading ? (
          <p className="text-zinc-500">Loading events…</p>
        ) : !events || events.length === 0 ? (
          <p className="text-zinc-500 mt-4 italic">
            No upcoming events found for reviewed artists.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {events.map((ev) => {
              const img = ev.images?.[0]?.url;
              return (
                <div
                  key={ev.id}
                  className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 hover:bg-zinc-900/60 transition shadow"
                >
                  {img && (
                    <img
                      src={img}
                      alt={ev.name || "Event"}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}

                  <h3 className="mt-3 text-lg font-semibold">{ev.name}</h3>

                  <p className="text-zinc-400 text-sm mt-1">
                    {ev._embedded?.venues?.[0]?.name}
                  </p>

                  <p className="text-zinc-400 text-sm">
                    {ev.dates?.start?.localDate}
                  </p>

                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 text-sm mt-2 inline-block hover:underline"
                  >
                    View Tickets →
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}