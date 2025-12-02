/**
 * Purpose:
 *   Shared helpers for building consistent HTTP responses in API routes
 *
 * Scope:
 *   - Used by all API route handlers for consistent error handling
 *   - Provides common response patterns (errors, cache headers)
 *
 * Role:
 *   - Creates consistent error response format across all endpoints
 *   - Provides helpers for common HTTP status codes (401, 403, 404, 500)
 *
 * Deps:
 *   - NextResponse from next/server for building responses
 *
 * Notes:
 *   - Error helpers default to no-store caching to avoid stale responses
 *
 */

import { NextResponse } from "next/server";

/**
 * Purpose:
 *   Create a standardized error response with cache control
 *
 * Params:
 *   - message: error message string to return
 *   - status: HTTP status code (default 400)
 *   - options: optional object with cacheControl bool (default true)
 *
 * Returns:
 *   - NextResponse with JSON error object and Cache-Control header
 *
 * Notes:
 *   - All error responses include Cache-Control: no-store by default
 */
export function errorResponse(
  message: string,
  status: number = 400,
  options?: { cacheControl?: boolean }
): NextResponse {
  const headers: Record<string, string> = {};
  if (options?.cacheControl !== false) {
    headers["Cache-Control"] = "no-store";
  }
  return NextResponse.json({ error: message }, { status, headers });
}

/**
 * Purpose:
 *   Create a 401 Unauthorized error response
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - NextResponse with 401 status and "Unauthorized" error message
 *
 * Notes:
 *   - returns 401 response when there is no active session
 *   - Used by protected API routes when user is not authenticated
 */
export function unauthorizedResponse(): NextResponse {
  return errorResponse("Unauthorized", 401);
}

/**
 * Purpose:
 *   Create a 403 Forbidden error response
 *
 * Params:
 *   - message: optional error message (default "Forbidden")
 *
 * Returns:
 *   - NextResponse with 403 status and error message
 *
 * Notes:
 *   - Used when user is authenticated but lacks permission for the action
 */
export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return errorResponse(message, 403);
}

/**
 * Purpose:
 *   Create a 404 Not Found error response
 *
 * Params:
 *   - message: optional error message (default "Not found")
 *
 * Returns:
 *   - NextResponse with 404 status and error message
 *
 * Notes:
 *   - Used when requested resource does not exist
 */
export function notFoundResponse(message = "Not found"): NextResponse {
  return errorResponse(message, 404);
}

/**
 * Purpose:
 *   Create a 500 Internal Server Error response
 *
 * Params:
 *   - message: optional error message (default "Internal server error")
 *
 * Returns:
 *   - NextResponse with 500 status and error message
 *
 * Notes:
 *   - Used for unexpected server errors and db failures
 */
export function serverErrorResponse(message = "Internal server error"): NextResponse {
  return errorResponse(message, 500);
}

/**
 * Purpose:
 *   Cache-Control header constant for API responses
 *
 * Params:
 *   - none
 *
 * Returns:
 *   - Object with Cache-Control header set to no-store
 *
 * Notes:
 *   - Used by API routes that return user specific or frequently changing data
 *   - Prevents browsers from caching responses that should always be fresh
 */
export const NO_CACHE_HEADERS = { "Cache-Control": "no-store" };

