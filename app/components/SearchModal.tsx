"use client";

import { X } from "lucide-react";
import SearchBar from "./SearchBar";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SearchModal
 *
 * Purpose:
 *   Mobile-only modal that displays the SearchBar inside a floating overlay.
 *
 * Scope:
 *   Only used on small screens (triggered from the header search icon).
 *   Does not replace the desktop search bar.
 *
 * Role:
 *   Provides a clean, focused search experience on mobile.
 *   Allows the existing SearchBar to be reused without modification.
 *
 * UX details:
 *   - Dimmed, blurred background to emphasize the search experience.
 *   - Tapping the background or pressing the "X" closes the modal.
 *   - SearchBar retains:
 *     - live suggestions
 *     - Enter → navigate to /discover
 *     - Esc → close suggestion dropdown (not the modal)
 *
 * Notes:
 *   Uses Framer Motion for smooth open/close transitions.
 */

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-xl flex justify-center items-start pt-10 px-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 relative"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-3">
              <button onClick={onClose}>
                <X className="h-6 w-6 text-zinc-400 hover:text-white transition" />
              </button>
            </div>

            <SearchBar />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
