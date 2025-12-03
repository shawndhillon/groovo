/**
 * Purpose:
 *   Recursive comment node component for displaying threaded comment trees
 *
 * Scope:
 *   Used in comment sections on review detail pages and feed cards
 *   Renders individual comments with nested replies up to MAX_DEPTH
 *
 * Role:
 *   Displays comment author, timestamp, body, and like button
 *   Recursively renders child comments as nested threads
 *   Provides inline reply functionality for authenticated users
 *   Handles comment depth limiting to prevent infinite nesting
 *
 * Deps:
 *   app/utils/social for CommentItem type
 *   app/components/LikeButton for like functionality
 *   app/components/comments/InlineReply for reply form
 *
 * Notes:
 *   Uses fixed "en-US" locale for timestamps to prevent hydration mismatches
 *   Top-level comments (depth=0) have different styling than nested replies
 *   Maximum nesting depth is limited to MAX_DEPTH (10) to prevent UI issues
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import LikeButton from "@/app/components/LikeButton";
import type { CommentItem } from "@/app/utils/social";
import InlineReply from "./InlineReply";

/**
 * Props for CommentNode component
 *
 * @property {CommentItem} comment - The comment data to display
 * @property {string} reviewId - ID of the review this comment belongs to
 * @property {Map<string, CommentItem[]>} repliesByParent - Map of parent comment IDs to their child replies
 * @property {number} [depth=0] - Current nesting depth of this comment (0 for top-level)
 * @property {() => Promise<void>} onRefresh - Callback to refresh comments after mutations
 */
interface CommentNodeProps {
  comment: CommentItem;
  reviewId: string;
  repliesByParent: Map<string, CommentItem[]>;
  depth?: number;
  onRefresh: () => Promise<void>;
}

const MAX_DEPTH = 10;

/**
 * Recursive comment node component that renders a comment and its nested replies
 *
 * @param {CommentNodeProps} props - Component props
 * @returns {JSX.Element} Rendered comment node with optional nested replies
 */
export default function CommentNode({
  comment,
  reviewId,
  repliesByParent,
  depth = 0,
  onRefresh,
}: CommentNodeProps) {
  const children = repliesByParent.get(String(comment._id)) ?? [];
  const displayName =
    comment.user?.username || comment.user?.name || "Anonymous";
  const userId = comment.userId;

  /**
   * Formats comment creation timestamp with fixed locale to prevent hydration mismatches
   * 
   * @returns {string} Formatted date string or empty string if date is invalid
   */
  const timestamp = useMemo(() => {
    const d = new Date(comment.createdAt);
    if (Number.isNaN(d.getTime())) return "";
    // Use fixed locale "en-US" to prevent hydration mismatches between server and client
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [comment.createdAt]);

  return (
    <li
      className={`rounded-xl ${
        depth === 0 ? "bg-zinc-900/70 p-3" : "bg-zinc-900/50 p-2"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
          {userId ? (
            <Link
              href={`/profile/user/${userId}`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
            >
              <span className="font-medium">{displayName}</span>
            </Link>
          ) : (
            <span className="font-medium text-zinc-200">{displayName}</span>
          )}

          {timestamp && (
            <>
              <span>•</span>
              <span>{timestamp}</span>
            </>
          )}
        </div>

        <LikeButton
          targetType="comment"
          targetId={String(comment._id)}
          initialLiked={Boolean(comment.viewerLiked)}
          initialCount={comment.likeCount ?? 0}
        />
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">
        {comment.body}
      </p>

      {depth < MAX_DEPTH && (
        <InlineReply
          reviewId={reviewId}
          parentId={String(comment._id)}
          onAfter={onRefresh}
        />
      )}

      {children.length > 0 && (
        <ul className="mt-3 space-y-2 border-l border-white/10 pl-3">
          {children.map((child) => (
            <CommentNode
              key={String(child._id)}
              comment={child}
              reviewId={reviewId}
              repliesByParent={repliesByParent}
              depth={depth + 1}
              onRefresh={onRefresh}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
