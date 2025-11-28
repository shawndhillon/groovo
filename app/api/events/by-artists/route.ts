/**
 * API Route: /api/events/by-artists
 * 
 * Fetches upcoming events from Ticketmaster API for a list of artists.
 * Filters events to ensure they actually feature the requested artists
 * (not just events that mention the artist name in passing).
 * 
 * POST body: { artists: string[], location?: string }
 * Returns: { events: Event[] }
 */

import { NextResponse } from "next/server";

const API_KEY = process.env.TICKETMASTER_API_KEY;

export async function POST(req: Request) {
  try {
    const { artists, location } = await req.json();
    
    // Early return if no artists provided
    if (!Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json({ events: [] });
    }
    
    const events: any[] = [];
    // Track seen event IDs to avoid duplicates when multiple artists have the same event
    const seenEventIds = new Set<string>();
    
    // Query Ticketmaster API for each artist
    for (const name of artists) {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${encodeURIComponent(
        name
      )}&apikey=${API_KEY}`;
      const res = await fetch(url);
      const text = await res.text();
      
      // Detect HTML error responses (usually means bad API key or blocked request)
      if (text.trim().startsWith("<!DOCTYPE")) {
        console.error("Ticketmaster returned HTML (bad key or blocked request)");
        continue;
      }
      
      const data = JSON.parse(text);
      if (data?._embedded?.events) {
        // Filter events to only include those that actually feature this artist
        // This prevents false positives like "L8nite Feat. Brandon Hahn" matching unrelated events
        const matchingEvents = data._embedded.events
          .filter((ev: any) => {
            // Skip if we've already seen this event (from a previous artist query)
            if (seenEventIds.has(ev.id)) return false;
            
            const nameLower = name.toLowerCase().trim();
            
            // Primary check: Look at attractions/performers (most reliable indicator)
            // Ticketmaster's attractions array contains the actual performers
            const attractions = ev._embedded?.attractions || [];
            const hasMatchingAttraction = attractions.some((att: any) => {
              const attName = (att.name || "").toLowerCase().trim();
              
              // Exact match
              if (attName === nameLower || nameLower === attName) return true;
              
              // Check if the attraction name starts with the artist name
              // Handles cases like "Taylor Swift" matching "Taylor Swift | The Eras Tour"
              if (attName.startsWith(nameLower + " ") || 
                  attName.startsWith(nameLower + "|") || 
                  attName.startsWith(nameLower + ":")) return true;
              
              // Check if artist name starts with attraction name (for shorter names)
              if (nameLower.startsWith(attName + " ") || 
                  nameLower.startsWith(attName + "|") || 
                  nameLower.startsWith(attName + ":")) return true;
              
              return false;
            });
            
            // If we found a matching attraction, this event is valid
            if (hasMatchingAttraction) {
              seenEventIds.add(ev.id);
              return true;
            }
            
            // Secondary check: Event name contains artist name (but be more strict)
            // Only match if event name starts with artist name to avoid false positives
            const eventName = (ev.name || "").toLowerCase().trim();
            const nameInEvent = eventName === nameLower || 
              eventName.startsWith(nameLower + " ") || 
              eventName.startsWith(nameLower + "|") ||
              eventName.startsWith(nameLower + ":") ||
              eventName.startsWith(nameLower + " -") ||
              eventName.startsWith(nameLower + " at");
            
            // Only use name matching for longer names (length > 3) to reduce false positives
            if (nameInEvent && name.length > 3) {
              seenEventIds.add(ev.id);
              return true;
            }
            
            return false;
          })
          .map((ev: any) => {
            // Extract and flatten venue information for easier filtering
            const venue = ev._embedded?.venues?.[0];
            return {
              ...ev,
              startDate: ev.dates?.start?.dateTime ?? null,
              city: venue?.city?.name ?? "",
              state: venue?.state?.name ?? "",
              country: venue?.country?.name ?? "",
            };
          });
        
        events.push(...matchingEvents);
      }
    }
    
    // Filter by location if provided (searches city, state, or country)
    const filtered = location
      ? events.filter((ev) => {
          const loc = location.toLowerCase();
          return (
            ev.city.toLowerCase().includes(loc) ||
            ev.state.toLowerCase().includes(loc) ||
            ev.country.toLowerCase().includes(loc)
          );
        })
      : events;
    
    // Auto-sort by date (ascending chronological order - earliest first)
    filtered.sort((a, b) => {
      const da = new Date(a.startDate).getTime();
      const db = new Date(b.startDate).getTime();
      return da - db;
    });
    
    return NextResponse.json({ events: filtered });
  } catch (err) {
    console.error("Ticketmaster error:", err);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}

