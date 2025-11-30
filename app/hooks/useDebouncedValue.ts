// hooks/useDebouncedValue.ts
"use client";

import { useEffect, useState } from "react";

/**
 * useDebouncedValue
 *
 * Generic debounce hook that delays updates to a value until a given
 * amount of time has passed *without* any further changes.
 *
 * Why we use this:
 * - Typing in a search input can generate a lot of keystrokes.
 * - We only want to hit our APIs (Spotify, users) after the user pauses
 *   for a short moment (e.g. 250–300ms).
 *
 * Example:
 *   const [query, setQuery] = useState("");
 *   const debouncedQuery = useDebouncedValue(query, 250);
 *
 *   useEffect(() => {
 *     // This effect runs only after the user stops typing for 250ms.
 *     fetch(`/api/search?query=${debouncedQuery}`);
 *   }, [debouncedQuery]);
 *
 * @template T
 * @param value - The live (rapidly changing) value, e.g. the search input.
 * @param delay - Debounce delay in milliseconds (default: 300ms).
 * @returns The debounced value that only updates after the delay.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Start a new timer on every value change.
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // If value changes again before delay, clear previous timer.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
