/**
 * useEventsbyArtist Hook
 * 
 * Fetches upcoming events from Ticketmaster API for a list of artists.
 * Automatically refetches when the artists list or location filter changes.
 * 
 * @param artists - Array of artist names to search for events
 * @param location - Optional location filter (city, state, or country)
 * @returns { events: Event[], loading: boolean }
 * 
 * Usage:
 *   const { events, loading } = useEventsbyArtist(['Taylor Swift', 'The Weeknd'], 'New York');
 */

"use client";
import { useEffect, useState } from "react";

export function useEventsbyArtist(artists: string[], location: string = "") {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Early return if no artists provided
    if (!artists || artists.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }
    
    async function load() {
      try {
        // Fetch events from our API route
        const res = await fetch("/api/events/by-artists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artists, location }),
        });
        
        const data = await res.json();
        // Set events (API returns { events: Event[] })
        setEvents(data.events || []);
      } catch (err) {
        console.error("Error loading events:", err);
        // On error, set empty array so UI shows "no events" message
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, [artists, location]); // Refetch when artists or location changes
  
  return { events, loading };
}

