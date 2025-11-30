"use client";

import Header from "@/app/components/Header";
import ConcertFeed from "@/app/components/ConcertFeed";

/**
 * Concerts Page
 * 
 * Displays upcoming concerts for artists the user has reviewed or followed.
 * 
 * Route: /concerts
 * 
 * This page orchestrates the ConcertFeed component to show upcoming events
 * from Ticketmaster API (currently using mock data for viewing purposes).
 */
export default function ConcertsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Upcoming Concerts</h1>
        <ConcertFeed />
      </div>
    </main>
  );
}

