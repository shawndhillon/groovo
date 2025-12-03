/**
 * Purpose:
 *   Display-only star rating component for showing ratings
 *
 * Scope:
 *   Used throughout the app to display review ratings visually
 *   Appears on review cards, album pages, and feed items
 *
 * Role:
 *   Renders filled/empty stars based on rating value
 *   Provides visual representation of numeric ratings
 *   Supports customizable star count and size
 *
 * Deps:
 *   None (pure presentational component)
 *
 * Notes:
 *   Read-only component (not interactive)
 *   Stars fill with violet-500 when active, zinc-700 when inactive
 *   Default rating scale is 0 to 5 stars
 *   Uses ARIA label for accessibility
 */

/**
 * Props for StarRating component
 *
 * @property {number} value - Rating value to display (0 to outOf)
 * @property {number} [outOf=5] - Maximum rating value (number of stars)
 * @property {string} [size="h-3 w-3"] - Tailwind CSS classes for star size
 */
export default function StarRating({
  value,
  outOf = 5,
  size = "h-3 w-3",
}: {
  value: number;   // 0..outOf
  outOf?: number;
  size?: string;   // tailwind size classes
}) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${value} of ${outOf}`}>
      {Array.from({ length: outOf }).map((_, i) => (
        <svg
          key={i}
          className={`${size} ${i < value ? "fill-violet-500 text-violet-500" : "fill-zinc-700 text-zinc-700"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
