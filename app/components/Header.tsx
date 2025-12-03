/**
 * Purpose:
 *   Site-wide header component with navigation and authentication
 *
 * Scope:
 *   Used on all pages as the main navigation bar
 *   Provides site branding, search, and user authentication links
 *
 * Role:
 *   Displays site logo and title (both link to home)
 *   Shows "Upcoming Events" navigation link
 *   Conditionally renders search bar based on showSearch prop
 *   Displays authentication state (logged in/out) with appropriate links
 *   Sticky header that stays visible while scrolling
 *
 * Deps:
 *   app/components/SearchBar for search functionality
 *   app/hooks/useCurrentUser for authentication state
 *
 * Notes:
 *   Sticky positioning with backdrop blur for modern glass effect
 *   Shows loading state while checking authentication
 *   Search bar can be hidden via showSearch prop (defaults to true)
 *   Authentication links change based on login status
 */

"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";
import { useCurrentUser } from "../hooks/useCurrentUser";

/**
 * Props for Header component
 *
 * @property {boolean} [showSearch=true] - Whether to display the search bar
 */
interface HeaderProps {
  showSearch?: boolean;
}

/**
 * Renders the site header with navigation, search, and authentication
 *
 * @param {HeaderProps} props - Component props
 * @returns {JSX.Element} Header component with navigation and auth links
 */
export default function Header({showSearch = true}: HeaderProps) {
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const isLoggedIn = !!currentUser;

  return (
    <header className="sticky top-0 z-50 w-full bg-zinc-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Title + Navigation */}
        <div className="flex items-center gap-2">
          {/* Logo - clickable link to home */}
          <Link href="/">
            <div className="h-6 w-6 rounded-md bg-violet-500" />
          </Link>
          
          {/* Site Title - clickable link to home */}
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight hover:text-violet-400 transition"
          >
            Groovo
          </Link>
          
          {/* Spacer for visual separation */}
          <div className="w-6" />
          
          {/* Events Navigation Link - shows upcoming concerts for reviewed/library artists */}
          <Link
            href="/events"
            className="text-sm text-zinc-400 hover:text-violet-400 transition"
          >
            Upcoming Events
          </Link>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <SearchBar />
        )}

        {/* Right side auth area */}
        <div className="flex items-center gap-4">
          {isUserLoading ? (
            <span className="text-sm text-zinc-500">…</span>
          ) : isLoggedIn ? (
            <>
              <Link href="/profile" className="text-sm text-zinc-400 hover:text-white transition">
                Profile
              </Link>
              <Link href="/api/auth/signout" className="text-sm text-zinc-400 hover:text-white transition">
                Sign out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition">Login</Link>
              <Link href="/signup" className="text-sm text-zinc-400 hover:text-white transition">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
