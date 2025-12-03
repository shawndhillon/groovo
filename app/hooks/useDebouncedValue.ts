"use client";
import { useEffect, useState } from "react";
/**
 * Purpose:
 *   A debounce hook to delay updates to a value until the user stops changing it for a specified amount of time.
 *
 * Scope:
 *   - Used mainly in search-related components to reduce unnecessary API calls.
 *   - Can be used anywhere a debounced version is needed
 *
 * Role:
 *   - Takes an immediate value (`value`) and returns a delayed version that updates only after `delay` milliseconds with no further changes.
 *   - Prevents effects from changing really fast during rapid input changes.
 *   - Improves UX and performance
 *
 * Deps:
 *   - React hooks (`useState`, `useEffect`).
 *
 * Notes:
 *   - Typical use case: search bars (e.g., debounce to 250–300ms).
 *   - Cleans up timers on component unmount or when value changes.
 *
 * Returns:
 *   {
 *     debouncedValue: T    // the value updated only after the debounce delay
 *   }
 *


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
