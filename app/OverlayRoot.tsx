"use client";

import { createPortal } from "react-dom";
import { ReactNode, useEffect, useState } from "react";

/**
 * OverlayRoot
 *
 * Purpose:
 *   Global portal root for modals, drawers, and overlays.
 *
 * Why:
 *   Prevents z-index stacking issues by rendering overlays
 *   directly into document.body — above all page content.
 *
 * Notes:
 *   Must be client-side only because portals require the DOM.
 */
export default function OverlayRoot({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
