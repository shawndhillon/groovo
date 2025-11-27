"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import LikeButton from "@/app/components/LikeButton";
import { useComments } from "@/app/hooks/useComments";
import CommentList from "@/app/components/comments/CommentList";

interface CommentSectionProps {
  reviewId: string;
  initialOpen?: boolean;
  reviewLikeCount?: number;
  reviewInitiallyLiked?: boolean;
  onReviewLikeChange?: (liked: boolean, count: number) => void;
  onCommentCountChange?: Dispatch<SetStateAction<number>>;
}

export default function CommentSection({
  reviewId,
  initialOpen = false,
  reviewLikeCount = 0,
  reviewInitiallyLiked = false,
  onReviewLikeChange,
  onCommentCountChange,
}: CommentSectionProps) {
  const [open, setOpen] = useState(initialOpen);
  const [newBody, setNewBody] = useState("");

  const {
    items,
    replies,
    repliesByParent,
    loading,
    error,
    load,
    addTopLevel,
  } = useComments(reviewId);

  // Load comments when section is opened
  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  // Keep parent comment count in sync with current totals
  useEffect(() => {
    if (!onCommentCountChange) return;
    onCommentCountChange(items.length + replies.length);
  }, [items.length, replies.length, onCommentCountChange]);

  async function handlePost() {
    const text = newBody.trim();
    if (!text) return;
    setNewBody("");
    try {
      await addTopLevel(text);
    } catch {
      // Optional: surface a toast or inline error
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/60">
      {/* review-level actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <LikeButton
            targetType="review"
            targetId={reviewId}
            initialLiked={reviewInitiallyLiked}
            initialCount={reviewLikeCount}
            onChange={onReviewLikeChange}
          />
          <button
            type="button"
            className="text-sm text-zinc-200 hover:text-white"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? "Hide comments" : "Show comments"}
          </button>
        </div>
      </div>
      {open && (
        <div className="p-4">
          {loading && (
            <div className="text-sm text-zinc-400">Loading comments…</div>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}

          {!loading && !error && (
            <>
              <div className="mb-4 flex gap-2">
                <input
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!newBody.trim()}
                  className="rounded-lg bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Post
                </button>
              </div>

              <CommentList
                items={items}
                repliesByParent={repliesByParent}
                reviewId={reviewId}
                onRefresh={load}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}