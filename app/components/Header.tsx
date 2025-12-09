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
import { Search, Menu, User } from "lucide-react";
import SearchBar from "./SearchBar";
import { useCurrentUser } from "../hooks/useCurrentUser";

/**
 * Header
 *
 * Now takes two callbacks:
 *  - onOpenSearchModal()
 *  - onOpenMenuDrawer()
 *
 * These trigger overlays rendered via portal in layout.tsx.
 */

interface HeaderProps {
  showSearch?: boolean;
  onOpenSearchModal: () => void;
  onOpenMenuDrawer: () => void;
}

export default function Header({
  showSearch = true,
  onOpenSearchModal,
  onOpenMenuDrawer,
}: HeaderProps) {
  const { user: currentUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;

  return (
    <header className="sticky top-0 z-[200] w-full bg-zinc-900/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* LEFT: Logo */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="h-6 w-6 rounded-md bg-violet-500" />
          </Link>
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight hover:text-violet-400 transition hidden sm:block"
          >
            Groovo
          </Link>
        </div>

        {/* CENTER (Desktop Search) */}
        {showSearch && (
          <div className="hidden md:block flex-1 max-w-xl mx-6">
            <SearchBar />
          </div>
        )}

        {/* RIGHT: Icons */}
        <div className="flex items-center gap-4">

          {/* Mobile search */}
          <button
            className="md:hidden"
            onClick={onOpenSearchModal}
          >
            <Search className="h-6 w-6 text-zinc-300" />
          </button>

          <Link href="/events" className="hidden md:block text-sm text-zinc-400 hover:text-violet-400 transition">
            Upcoming Events
          </Link>

          {/* Profile icon */}
          {isLoggedIn && (
            <Link href="/profile">
              <User className="h-6 w-6 text-zinc-300" />
            </Link>
          )}

          {/* Menu icon */}
          <button
            className="md:hidden"
            onClick={onOpenMenuDrawer}
          >
            <Menu className="h-7 w-7 text-zinc-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
