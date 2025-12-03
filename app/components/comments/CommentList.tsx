/**
 * Purpose:
 *   Container component for rendering a list of top-level comments
 *
 * Scope:
 *   Used in comment sections on review detail pages and feed cards
 *   Wraps CommentNode components to display comment threads
 *
 * Role:
 *   Renders top-level comments (no parent) as a list
 *   Delegates nested reply rendering to CommentNode components
 *   Shows empty state message when no comments exist
 *
 * Deps:
 *   app/utils/social for CommentItem type
 *   app/components/comments/CommentNode for individual comment rendering
 *
 * Notes:
 *   Only renders top-level comments; replies are handled recursively by CommentNode
 *   Maps repliesByParent to enable nested comment threading
 */

"use client";

import type { CommentItem } from "@/app/utils/social";
import CommentNode from "./CommentNode";

/**
 * Props for CommentList component
 *
 * @property {CommentItem[]} items - Array of top-level comments to display
 * @property {Map<string, CommentItem[]>} repliesByParent - Map of parent comment IDs to their child replies
 * @property {string} reviewId - ID of the review these comments belong to
 * @property {() => Promise<void>} onRefresh - Callback to refresh comments after mutations
 */
interface CommentListProps {
  items: CommentItem[];
  repliesByParent: Map<string, CommentItem[]>;
  reviewId: string;
  onRefresh: () => Promise<void>;
}

/**
 * Renders a list of top-level comments with nested reply support
 *
 * @param {CommentListProps} props - Component props
 * @returns {JSX.Element} List of comment nodes or empty state message
 */
export default function CommentList({
  items,
  repliesByParent,
  reviewId,
  onRefresh,
}: CommentListProps) {
  if (items.length === 0) {
    return <div className="text-sm text-zinc-400">No comments yet.</div>;
  }

  return (
    <ul className="space-y-4">
      {items.map((c) => (
        <CommentNode
          key={String(c._id)}
          comment={c}
          reviewId={reviewId}
          repliesByParent={repliesByParent}
          depth={0}
          onRefresh={onRefresh}
        />
      ))}
    </ul>
  );
}
