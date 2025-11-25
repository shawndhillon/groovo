"use client";

import { useMemo } from "react";
import Link from "next/link";
import LikeButton from "@/app/components/LikeButton";
import type { CommentItem } from "@/app/utils/social";
import InlineReply from "./InlineReply";

interface CommentNodeProps {
  comment: CommentItem;
  reviewId: string;
  repliesByParent: Map<string, CommentItem[]>;
  depth?: number;
  onRefresh: () => Promise<void>;
}

const MAX_DEPTH = 10;

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
