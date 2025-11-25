"use client";

import { useState } from "react";

interface ShareButtonProps {
  url: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * ShareButton Component
 * 
 * A reusable button component that copies a URL to the clipboard
 * and shows a confirmation message "Link Copied!".
 * 
 * Features:
 * - Clipboard API integration
 * - Visual confirmation feedback
 * - Accessibility (hover, focus states)
 * - Error handling
 */
export default function ShareButton({
  url,
  label = "Share",
  className = "",
  size = "md",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const handleShare = async () => {
    try {
      setError(null);
      
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not available");
      }

      // Get the full URL (handle relative paths)
      const fullUrl = url.startsWith("http") 
        ? url 
        : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;

      await navigator.clipboard.writeText(fullUrl);
      
      setCopied(true);
      
      // Reset confirmation message after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err: any) {
      console.error("Failed to copy to clipboard:", err);
      setError("Failed to copy link");
      // Clear error after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 
        text-white transition-colors
        hover:bg-zinc-800 hover:border-zinc-600
        focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={copied ? "Link copied!" : `Copy ${label} link`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`${size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"}`}
        aria-hidden="true"
      >
        {copied ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
          />
        )}
      </svg>
      <span>
        {copied ? "Link Copied!" : error || label}
      </span>
    </button>
  );
}

