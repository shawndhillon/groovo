
export type LikeAction = "like" | "unlike";

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

export async function toggleLike(targetType: "review" | "comment", targetId: string, action: LikeAction) {
  const res = await fetch("/api/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ targetType, targetId, action }),
  });
  const body = await safeJson(res);
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body as { liked: boolean };
}

export type CommentItem = {
  _id: string;
  reviewId: string;
  userId: string;
  parentId: string | null;
  body: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  user?: { id?: string; username?: string | null; name?: string | null; image?: string | null } | null;
  viewerLiked?: boolean;
};

export async function fetchComments(reviewId: string, page = 1, pageSize = 20) {
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await fetch(`/api/reviews/${reviewId}/comments?${qs.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = await safeJson(res);
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body as { items: CommentItem[]; replies: CommentItem[] };
}

export async function postComment(reviewId: string, body: string, parentId?: string) {
  const res = await fetch(`/api/reviews/${reviewId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ body, ...(parentId ? { parentId } : {}) }),
  });
  const j = await safeJson(res);
  if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
  return j as { id: string };
}
