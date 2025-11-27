"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Concert Event Data Type
 * 
 * Represents a normalized concert/event from Ticketmaster API
 * with all necessary information for display.
 */
export type ConcertEvent = {
  id: string;
  artist: string;
  eventName: string;
  date: string; // ISO date string
  venue: string;
  city: string;
  state?: string;
  country: string;
  ticketLink: string;
  imageUrl?: string;
};

interface ConcertFeedProps {
  concerts?: ConcertEvent[];
  title?: string;
  loading?: boolean;
  error?: string | null;
}

/**
 * ConcertFeed Component
 * 
 * Displays a list of upcoming concerts for artists the user has
 * reviewed or followed. Shows event details including artist,
 * date, venue, city, and ticket purchase link.
 * 
 * Features:
 * - Loading state
 * - Error handling
 * - Empty state
 * - Responsive design
 */
export default function ConcertFeed({
  concerts = [],
  title = "Upcoming Concerts",
  loading = false,
  error = null,
}: ConcertFeedProps) {
  // Generate mock concerts on client side only to avoid hydration mismatch
  const [mockConcerts, setMockConcerts] = useState<ConcertEvent[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatches
    setMounted(true);
    
    // Generate dates only on client side after mount
    const now = Date.now();
    setMockConcerts([
      {
        id: "mock-1",
        artist: "Radiohead",
        eventName: "Radiohead Live in Concert",
        date: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        venue: "Madison Square Garden",
        city: "New York",
        state: "NY",
        country: "USA",
        ticketLink: "https://www.ticketmaster.com/example",
        imageUrl: undefined,
      },
      {
        id: "mock-2",
        artist: "Taylor Swift",
        eventName: "The Eras Tour",
        date: new Date(now + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
        venue: "SoFi Stadium",
        city: "Los Angeles",
        state: "CA",
        country: "USA",
        ticketLink: "https://www.ticketmaster.com/example",
        imageUrl: undefined,
      },
      {
        id: "mock-3",
        artist: "The Weeknd",
        eventName: "After Hours Til Dawn Tour",
        date: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
        venue: "Mercedes-Benz Stadium",
        city: "Atlanta",
        state: "GA",
        country: "USA",
        ticketLink: "https://www.ticketmaster.com/example",
        imageUrl: undefined,
      },
      {
        id: "mock-4",
        artist: "Billie Eilish",
        eventName: "Happier Than Ever World Tour",
        date: new Date(now + 45 * 24 * 60 * 60 * 1000).toISOString(), // ~6 weeks from now
        venue: "O2 Arena",
        city: "London",
        country: "UK",
        ticketLink: "https://www.ticketmaster.com/example",
        imageUrl: undefined,
      },
    ]);
  }, []);

  // Use mock data if no concerts provided (for viewing purposes)
  // Wait for mock data to be generated on client before showing
  // Also wait for component to mount to prevent hydration mismatches
  const displayConcerts = !mounted ? [] : (concerts.length > 0 ? concerts : mockConcerts.length > 0 ? mockConcerts : []);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Date TBA";
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Format location (city, state, country)
  const formatLocation = (concert: ConcertEvent): string => {
    const parts = [concert.city];
    if (concert.state) parts.push(concert.state);
    parts.push(concert.country);
    return parts.join(", ");
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-zinc-400">Loading concerts…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-red-400">Error: {error}</p>
      </section>
    );
  }

  if (displayConcerts.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-zinc-400">
          No upcoming concerts found for artists you follow or have reviewed.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ul className="space-y-4">
        {displayConcerts.map((concert) => (
          <li
            key={concert.id}
            className="rounded-xl bg-zinc-900/70 p-4 border border-white/5 hover:border-violet-500/30 transition-colors"
          >
            <div className="flex flex-col gap-3">
              {/* Artist and Event Name */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-white truncate">
                    {concert.artist}
                  </h4>
                  <p className="text-sm text-zinc-400 mt-0.5 truncate">
                    {concert.eventName}
                  </p>
                </div>
              </div>

              {/* Date and Location */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                  </svg>
                  <span>{formatDate(concert.date)}</span>
                </div>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  <span className="truncate">{formatLocation(concert)}</span>
                </div>
              </div>

              {/* Venue */}
              <p className="text-sm text-zinc-300">
                <span className="text-zinc-500">Venue: </span>
                {concert.venue}
              </p>

              {/* Ticket Link */}
              <div className="flex justify-end pt-2">
                <Link
                  href={concert.ticketLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  Buy Tickets
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

