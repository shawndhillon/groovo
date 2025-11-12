
"use client";

import LikeButton from "@/app/components/LikeButton";
import { CommentItem, fetchComments, postComment } from "@/app/utils/social";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function byParent(top: CommentItem[], replies: CommentItem[]) {
  const map = new Map<string, CommentItem[]>();
  replies.forEach((r) => {
    if (!r.parentId) return;
    const key = r.parentId;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  for (const [, arr] of map) arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  return map;
}

export default function CommentSection({
  reviewId,
  initialOpen = false,
  reviewLikeCount = 0,
  reviewInitiallyLiked = false,
  onReviewLikeChange,
}: {
  reviewId: string;
  initialOpen?: boolean;
  reviewLikeCount?: number;
  reviewInitiallyLiked?: boolean;
  onReviewLikeChange?: (liked: boolean, count: number) => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<CommentItem[]>([]);
  const [replies, setReplies] = useState<CommentItem[]>([]);
  const [newBody, setNewBody] = useState("");

  useEffect(() => {
    if (!open) return;
    let dead = false;
    setLoading(true);
    setErr(null);
    fetchComments(reviewId, 1, 20)
      .then(({ items, replies }) => {
        if (dead) return;
        setItems(items);
        setReplies(replies);
      })
      .catch((e) => !dead && setErr(e.message || "Failed to load comments"))
      .finally(() => !dead && setLoading(false));
    return () => { dead = true; };
  }, [open, reviewId]);

  const repliesByParent = useMemo(() => byParent(items, replies), [items, replies]);

  async function addTopLevel() {
    const text = newBody.trim();
    if (text.length < 1) return;
    setNewBody("");
    try {
      await postComment(reviewId, text);

      const { items, replies } = await fetchComments(reviewId, 1, 20);
      setItems(items);
      setReplies(replies);
    } catch (e) {

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
            className="text-sm text-zinc-200 hover:text-white"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide comments" : "Show comments"}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4">
          {loading && <div className="text-sm text-zinc-400">Loading comments…</div>}
          {err && <div className="text-sm text-red-400">{err}</div>}

          {!loading && !err && (
            <>
              {/* input */}
              <div className="mb-4 flex gap-2">
                <input
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
                />
                <button
                  onClick={addTopLevel}
                  className="rounded-lg bg-violet-600 px-3 py-2 text-sm text-white hover:bg-violet-500"
                >
                  Post
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-sm text-zinc-400">No comments yet.</div>
              ) : (
                <ul className="space-y-4">
                  {items.map((c) => (
                    <CommentItemComponent
                      key={String(c._id)}
                      comment={c}
                      reviewId={reviewId}
                      repliesByParent={repliesByParent}
                      onRefresh={async () => {
                        const { items, replies } = await fetchComments(reviewId, 1, 20);
                        setItems(items);
                        setReplies(replies);
                      }}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CommentItemComponent({
  comment,
  reviewId,
  repliesByParent,
  onRefresh,
  depth = 0,
}: {
  comment: CommentItem;
  reviewId: string;
  repliesByParent: Map<string, CommentItem[]>;
  onRefresh: () => Promise<void>;
  depth?: number;
}) {
  const child = repliesByParent.get(String(comment._id)) || [];
  // Nested comment thread depth
  const maxDepth = 10;

  const displayName = comment.user?.username || comment.user?.name || "Anonymous";
  const userId = comment.userId;

  return (
    <li className={`rounded-xl ${depth === 0 ? 'bg-zinc-900/70 p-3' : 'bg-zinc-900/50 p-2'}`}>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-zinc-800/80 px-3 py-1.5 border border-white/10">
          <Link
            href={`/profile/user/${userId}`}
            className="text-xs font-medium text-zinc-200 hover:text-violet-300 transition-colors"
          >
            {displayName}
          </Link>
          <span className="text-xs text-zinc-500">•</span>
          <span className="text-xs text-zinc-400">{new Date(comment.createdAt).toLocaleString()}</span>
        </div>
        <LikeButton
          targetType="comment"
          targetId={String(comment._id)}
          initialLiked={comment.viewerLiked || false}
          initialCount={comment.likeCount || 0}
        />
      </div>
      <p className="mt-2 text-sm text-zinc-100 whitespace-pre-wrap">{comment.body}</p>

      {/* Reply button - show for all comments */}
      {depth < maxDepth && (
        <InlineReply
          reviewId={reviewId}
          parentId={String(comment._id)}
          onAfter={onRefresh}
        />
      )}

      {/* Recursively render nested replies */}
      {child.length > 0 && (
        <ul className="mt-3 space-y-2 border-l border-white/10 pl-3">
          {child.map((r) => (
            <CommentItemComponent
              key={String(r._id)}
              comment={r}
              reviewId={reviewId}
              repliesByParent={repliesByParent}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function InlineReply({
  reviewId,
  parentId,
  onAfter,
}: {
  reviewId: string;
  parentId: string;
  onAfter?: () => void;
}) {
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const text = val.trim();
    if (text.length < 1) return;
    setBusy(true);
    try {
      await postComment(reviewId, text, parentId);
      setVal("");
      onAfter?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Reply…"
        className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-violet-500"
      />
      <button
        onClick={submit}
        disabled={busy}
        className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
      >
        Reply
      </button>
    </div>
  );
}
