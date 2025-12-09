"use client";

import Link from "next/link";
import { X, LogOut, User, Calendar, Home } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * MobileMenuDrawer
 *
 * Purpose:
 *   Slide-in mobile navigation drawer triggered by hamburger menu.
 *
 * Scope:
 *   Only visible on mobile devices via the header menu button.
 *
 * Role:
 *   Replaces desktop nav links which do not fit on small screens.
 *   Displays:
 *     - Home
 *     - Upcoming Events
 *     - Profile (if logged in)
 *     - Login / Signup (if logged out)
 *     - Sign Out (only inside drawer — never in header on mobile)
 *
 * UX details:
 *   - Tapping background closes drawer.
 *   - Uses icons to maintain consistent mobile UI design.
 *   - Uses Framer Motion for smooth animations.
 *
 * Notes:
 *   Auth state is passed from Header.tsx to avoid duplicate logic.
 */

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

export default function MobileMenuDrawer({ open, onClose, isLoggedIn }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xl"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-72 bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl p-6 z-[10000]"
            onClick={(e) => e.stopPropagation()}
            initial={{ x: -220 }}
            animate={{ x: 0 }}
            exit={{ x: -220 }}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="mt-12 flex flex-col gap-6">
              <Link href="/" className="flex items-center gap-3 text-lg text-zinc-300 hover:text-white">
                <Home className="h-5 w-5" /> Home
              </Link>

              <Link href="/events" className="flex items-center gap-3 text-lg text-zinc-300 hover:text-white">
                <Calendar className="h-5 w-5" /> Upcoming Events
              </Link>

              {isLoggedIn ? (
                <>
                  <Link href="/api/auth/signout" className="flex items-center gap-3 text-lg text-red-400 hover:text-red-300">
                    <LogOut className="h-5 w-5" /> Sign Out
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-zinc-300 hover:text-white">Login</Link>
                  <Link href="/signup" className="text-zinc-300 hover:text-white">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
