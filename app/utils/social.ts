/**
 * Purpose:
 *   Client side utilities for likes and comments
 *
 * Scope:
 *   - React components that let users like reviews or comments
 *   - Review detail pages that show and create comment threads
 *
 * Role:
 *   - Wrap calls to likes and comments API routes in small client helpers
 *   - Provide a single place for handling auth related redirects and error parsing
 *   - Define shared client side types for comments and like actions
 *
 * Deps:
 *   - /api/likes for toggling likes
 *   - /api/reviews/[id]/comments for fetching and posting comments
 *
 * Notes:
 *   - centralizes 401 responses redirecting to the login page
 *   - keeps low level fetch details out of UI components like LikeButton
 *
 */

/**
 * Purpose:
 *   Action type for like/unlike operations
 *
 * Returns:
 *   - Type definition for like action strings
 *
 * Notes:
 *   - Used by toggleLike function to specify whether to add or remove a like
 */
export type LikeAction = "like" | "unlike";

async function safeJson(res: Response) {
  try {
    // try to parse JSON body if present and fall back to null when the response has no valid JSON
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Purpose:
 *   Toggle like status for a review or comment via the likes API
 *
 * Params:
 *   - targetType: whether the target is a "review" or "comment"
 *   - targetId: ID of the review or comment to like/unlike
 *   - action: "like" to add a like, "unlike" to remove it
 *
 * Returns:
 *   - object with liked bool indicating final like status
 *
 * Notes:
 *   - User may or may not be signed in
 *   - redirects to login page on 401 response
 *   - used by the LikeButton component
 *   - sends a request to the likes API to keep the server in sync with the new state
 */
export async function toggleLike(targetType: "review" | "comment", targetId: string, action: LikeAction) {
  const res = await fetch("/api/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ targetType, targetId, action }),
  });

  if (res.status === 401) {
    // redirect anonymous users to the login page then throw an unauthorized error
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const body = await safeJson(res);
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body as { liked: boolean };
}

/**
 * Purpose:
 *   Comment data shape returned by fetchComments API
 *
 * Returns:
 *   - Type definition for comment objects with user information and like status
 *
 * Notes:
 *   - Used by comment sections to display comment data
 *   - Includes optional user and viewerLiked fields when available
 */
export type CommentItem = {
  _id: string;
  reviewId: string;
  userId: string;
  parentId: string | null;
  body: string;
  likeCount: number;
  createdAt: string;
  user?: { id?: string; username?: string | null; name?: string | null; image?: string | null } | null;
  viewerLiked?: boolean;
};

/**
 * Purpose:
 *   Fetch paginated comments for a review with user information and like status
 *
 * Params:
 *   - reviewId: ID of the review to fetch comments for
 *   - page: page number (default 1)
 *   - pageSize: number of comments per page (default 20)
 *
 * Returns:
 *   - object with items array (top-level comments) and replies array (for threaded replies)
 *
 * Notes:
 *   - User may or may not be signed in
 *   - used by comment sections on review detail pages
 *   - fetches from /api/reviews/[id]/comments endpoint
 */
export async function fetchComments(reviewId: string, page = 1, pageSize = 20) {
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await fetch(`/api/reviews/${reviewId}/comments?${qs.toString()}`, {
    headers: { Accept: "application/json" },
    // bypass HTTP cache so the browser always asks the server for the latest comments
    cache: "no-store",
  });
  const body = await safeJson(res);
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body as { items: CommentItem[]; replies: CommentItem[] };
}

/**
 * Purpose:
 *   Create a new comment or reply on a review
 *
 * Params:
 *   - reviewId: ID of the review to comment on
 *   - body: text content of the comment
 *   - parentId: optional ID of parent comment for threaded replies
 *
 * Returns:
 *   - object with id string of the newly created comment
 *
 * Notes:
 *   - redirects to login page on 401 response
 *   - used by comment forms on review detail pages
 *   - sends a request to the comments API to create the comment
 */
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
