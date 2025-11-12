"use client";

import Link from "next/link";
import SearchBar from "./SearchBar";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface HeaderProps {
  showSearch?: boolean;
}

export default function Header({showSearch = true}: HeaderProps) {
  const { user: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const isLoggedIn = !!currentUser;

  return (
    <header className="sticky top-0 z-50 w-full bg-zinc-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <Link href="/"><div className="h-6 w-6 rounded-md bg-violet-500" /></Link>
          <Link href="/"><span className="text-lg font-semibold tracking-tight hover:text-violet-400 transition">Groovo</span></Link>
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
