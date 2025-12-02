/**
 * Purpose:
 *   Modal UI for picking a music genre used in discovery features
 *
 * Scope:
 *   - Used on home page for genre-based album discovery
 *   - Provides search and category browsing for genres
 *
 * Role:
 *   - Fetch and show the genre list from the server
 *   - Let users search, browse, and select genres in overlay/popup
 *   - Allow callers to adjust albums-per-page preferences alongside genre choice
 *
 * Deps:
 *   - /api/genre-seeds for genres and curated popular genre groups
 */

"use client";

import { useEffect, useMemo, useState } from "react";

interface GenreSelectorProps {
  onClose: () => void;
  onSelect: (genre: string) => void;
  currentGenre?: string;
  albumsPerPage?: number;
  onAlbumsPerPageChange?: (value: number) => void;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface GenreCategory {
  category: string;
  genres: string[];
}

/**
 * Purpose:
 *   Modal component for selecting music genres with search and category browsing
 *
 * Params:
 *   - onClose: callback to close the modal
 *   - onSelect: callback called when user selects a genre with the selected genre string
 *   - currentGenre: optional currently selected genre to highlight
 *   - albumsPerPage: number of albums to show per page (default 25)
 *   - onAlbumsPerPageChange: optional callback when albums per page preference changes
 *
 * Returns:
 *   - React element that renders a full screen modal with genre selection UI
 *
 * Notes:
 *   - reads selectedGenres from props and calls onChange with a new list when the user changes the selection
 *   - fetches genre list from /api/genre-seeds on mount
 *   - uses local filtering for genre search (no server-side search endpoint)
 *   - shows popular genres organized by category when no search query
 *   - Enter key selects first match if multiple results, or submits query if no matches
 */
export default function GenreSelector({ onClose, onSelect, currentGenre, albumsPerPage = 25, onAlbumsPerPageChange }: GenreSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allAvailableGenres, setAllAvailableGenres] = useState<string[]>([]);
  const [popularGenres, setPopularGenres] = useState<string[]>([]);
  const [popularGenresByCategory, setPopularGenresByCategory] = useState<GenreCategory[]>([]);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load initial genre list
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch("/api/genre-seeds")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.genres)) {
          setAllAvailableGenres(data.genres.sort());
        } else {
          throw new Error("Invalid genre data format");
        }
        if (Array.isArray(data.popularGenres)) {
          setPopularGenres(data.popularGenres);
        }
        if (Array.isArray(data.popularGenresByCategory)) {
          setPopularGenresByCategory(data.popularGenresByCategory);
        }
      })
      .catch((err) => {
        console.error("Error fetching genre seeds:", err);
        setError("Failed to load genres. Please try again later.");
        setAllAvailableGenres([]);
        setPopularGenres([]);
        setPopularGenresByCategory([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Search for genres when user types
  useEffect(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();

    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    // Note: /api/genre-search endpoint doesn't exist; using local filtering instead
    const queryLower = query.toLowerCase();
    const matches = allAvailableGenres.filter((g) =>
      g.toLowerCase().includes(queryLower) ||
      g.toLowerCase().startsWith(queryLower)
    );
    setSearchResults(matches.slice(0, 50));
    setIsSearching(false);
  }, [debouncedSearchQuery, allAvailableGenres]);

  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show popular genres when no search query
      return popularGenres.length > 0 ? popularGenres : [];
    }

    if (searchResults.length > 0) {
      return searchResults;
    }

    // Fallback to filtering local list
    const query = searchQuery.toLowerCase();
    const matches = allAvailableGenres.filter((g) =>
      g.toLowerCase().includes(query) ||
      g.toLowerCase().startsWith(query)
    );
    return matches.slice(0, 50);
  }, [searchQuery, allAvailableGenres, searchResults, popularGenres]);

  const handleGenreSelect = (genre: string) => {
    onSelect(genre);
    onClose();
  };

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #52525b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #71717a;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #52525b rgba(39, 39, 42, 0.5);
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Select Genre</h2>
            <p className="text-sm text-zinc-400">
              Search and select a genre to see top albums
            </p>
          </div>

          <div className="mb-6 flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmedQuery = searchQuery.trim().toLowerCase();
                    if (trimmedQuery) {
                      // If only one match use it
                      if (filteredGenres.length === 1) {
                        handleGenreSelect(filteredGenres[0]);
                      } else if (filteredGenres.length === 0) {
                        // Allow submitting any genre even if not in the list
                        handleGenreSelect(trimmedQuery);
                      } else if (filteredGenres.length > 0) {
                        // If multiple matches, select the first one
                        handleGenreSelect(filteredGenres[0]);
                      }
                    }
                  }
                }}
                placeholder="Search for a genre..."
                className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
                autoFocus
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                  {filteredGenres.length === 0
                    ? "Press Enter to search"
                    : filteredGenres.length === 1
                    ? "Press Enter to select"
                    : "Press Enter to select first match"}
                </div>
              )}
            </div>
            {onAlbumsPerPageChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="albums-per-page-popup" className="text-xs text-zinc-400 whitespace-nowrap">
                  Albums:
                </label>
                <input
                  id="albums-per-page-popup"
                  type="number"
                  min="1"
                  max="50"
                  value={albumsPerPage}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onAlbumsPerPageChange(Math.min(Math.max(1, value), 50));
                  }}
                  className="w-20 px-3 py-3 rounded-lg border border-violet-500/30 bg-zinc-800 text-sm text-white text-center focus:outline-none focus:border-violet-500 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-zinc-400">Loading genres...</div>
          ) : isSearching ? (
            <div className="text-center py-8 text-zinc-400">Searching for genres...</div>
          ) : filteredGenres.length === 0 && searchQuery.trim() ? (
            <div className="text-center py-8 text-zinc-400">
              <p className="mb-2">No genres found matching "{searchQuery}"</p>
              <p className="text-xs text-zinc-500 mt-2">
                Press Enter to try searching anyway
              </p>
            </div>
          ) : searchQuery.trim() ? (
            // Search mode: show flat list
            <div className="max-h-96 overflow-y-auto custom-scrollbar mb-6">
              {filteredGenres.length > 0 && (
                <div className="mb-3 text-xs text-zinc-400">
                  Showing {filteredGenres.length} matching {filteredGenres.length === 1 ? 'genre' : 'genres'}
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filteredGenres.map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGenreSelect(g)}
                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      currentGenre === g
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto custom-scrollbar mb-6">
              {popularGenresByCategory.map((category) => (
                <div key={category.category} className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                    {category.category}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {category.genres.map((g) => (
                      <button
                        key={g}
                        onClick={() => handleGenreSelect(g.toLowerCase())}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          currentGenre === g.toLowerCase()
                            ? "bg-violet-600 text-white"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-4 text-xs text-zinc-500 text-center">
                Search to find more genres
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
