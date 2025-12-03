/**
 * Purpose:
 *   Interactive star rating input component for selecting ratings
 *
 * Scope:
 *   Used in review forms and rating selection interfaces
 *   Allows users to select a rating by clicking or hovering over stars
 *
 * Role:
 *   Displays clickable star icons for rating selection
 *   Provides hover feedback to show rating preview
 *   Supports keyboard navigation and accessibility attributes
 *   Customizable star count, size, and label
 *
 * Deps:
 *   React useState for hover state management
 *
 * Notes:
 *   Uses ARIA roles (radiogroup, radio) for accessibility
 *   Hover state shows preview of rating before click
 *   Stars fill with violet-500 when active, zinc-700 when inactive
 *   Default max rating is 5 stars
 */

"use client";

import { useState } from "react";

/**
 * Props for StarInput component
 *
 * @property {number} value - Current selected rating value (1 to max)
 * @property {(v: number) => void} onChange - Callback when rating is selected
 * @property {number} [max=5] - Maximum number of stars to display
 * @property {string} [size="h-5 w-5"] - Tailwind CSS classes for star size
 * @property {string} [label="Rating"] - ARIA label for accessibility
 */
export default function StarInput({
  value,
  onChange,
  max = 5,
  size = "h-5 w-5",
  label = "Rating",
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: string;
  label?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label={label}
    >
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= active;
        return (
          <button
            key={idx}
            type="button"
            role="radio"
            aria-checked={value === idx}
            onMouseEnter={() => setHover(idx)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(idx)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(idx)}
            className="outline-none"
            title={`${idx} star${idx > 1 ? "s" : ""}`}
          >
            <svg
              className={`${size} ${filled ? "fill-violet-500 text-violet-500" : "fill-zinc-700 text-zinc-700"}`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
