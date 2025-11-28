/**
 * Events Page (/events)
 * 
 * Displays upcoming concerts/events for artists whose albums the user has:
 * - Reviewed
 * - Saved to their library
 * 
 * Features:
 * - Location filtering (city, state, or country)
 * - Automatic date sorting (earliest first)
 * - Requires authentication (redirects to login if not logged in)
 */

"use client";
import { useState } from "react";
import Header from "../components/Header";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useUserReviews } from "../hooks/useUserReviews";
import { useLibrary } from "../hooks/useLibrary";
import { useEventsbyArtist } from "../hooks/useEventsbyArtist";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function EventsPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const { items: reviews } = useUserReviews(currentUser?._id ?? null);
  const { albums: libraryAlbums } = useLibrary();
  
  // State for location filtering (searches city, state, or country)
  const [location, setLocation] = useState("");
  
  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.replace("/login");
    }
  }, [isUserLoading, currentUser, router]);
  
  // Extract unique artist names from both reviews and library albums
  // This memoized value recalculates when reviews or library albums change
  const artistNames = useMemo(() => {
    const names = [];
    
    // Extract artists from reviewed albums
    if (reviews) {
      for (const r of reviews) {
        const snap = r.albumSnapshot;
        if (snap && Array.isArray(snap.artists)) {
          for (const a of snap.artists) {
            if (a?.name) names.push(a.name);
          }
        }
      }
    }
    
    // Extract artists from library albums
    if (libraryAlbums) {
      for (const album of libraryAlbums) {
        if (Array.isArray(album.artists)) {
          for (const artist of album.artists) {
            // Library artists are stored as strings, not objects
            if (typeof artist === "string" && artist.trim()) {
              names.push(artist.trim());
            }
          }
        }
      }
    }
    
    // Return unique artist names (remove duplicates)
    return [...new Set(names)];
  }, [reviews, libraryAlbums]);
  
  // Fetch events for the extracted artists (auto-sorted by date)
  const { events, loading: eventsLoading } = useEventsbyArtist(
    artistNames,
    location
  );
  
  // Don't render anything if user is not logged in (will redirect)
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