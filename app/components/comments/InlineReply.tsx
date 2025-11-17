"use client";

import { useState } from "react";
import { postComment } from "@/app/utils/social";

interface InlineReplyProps {
  reviewId: string;
  parentId: string;
  onAfter?: () => void | Promise<void>;
}

export default function InlineReply({
  reviewId,
  parentId,
  onAfter,
}: InlineReplyProps) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    const text = value.trim();
    if (!text) return;

    setBusy(true);
    try {
      await postComment(reviewId, text, parentId);
      setValue("");
      await onAfter?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Reply…"
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy || !value.trim()}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Reply
      </button>
    </div>
  );
}
