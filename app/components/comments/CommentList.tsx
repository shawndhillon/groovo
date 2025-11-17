"use client";

import type { CommentItem } from "@/app/utils/social";
import CommentNode from "./CommentNode";

interface CommentListProps {
  items: CommentItem[];
  repliesByParent: Map<string, CommentItem[]>;
  reviewId: string;
  onRefresh: () => Promise<void>;
}

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
