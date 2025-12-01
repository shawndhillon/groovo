/**
 * Purpose:
 *   Standardized HTTP response helpers for API routes
 *
 * Scope:
 *   - Used by all API route handlers for consistent error handling
 *   - Provides common response patterns (errors, cache headers)
 *
 * Role:
 *   - Creates consistent error response format across all endpoints
 *   - Provides helpers for common HTTP status codes (401, 403, 404, 500)
 *   - Exports cache control headers for dynamic responses
 *
 * Deps:
 *   - Next.js NextResponse for response creation
 *
 * Notes:
 *   - All error responses include Cache-Control: no-store by default
 *   - NO_CACHE_HEADERS constant can be used for non-error responses
 *
 * Contributions (Shawn):
 *   - Implemented standardized response utilities and error helpers
 */

import { NextResponse } from "next/server";

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
 * 401 Unauthorized response
 */
export function unauthorizedResponse(): NextResponse {
  return errorResponse("Unauthorized", 401);
}

/**
 * 403 Forbidden response
 */
export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return errorResponse(message, 403);
}

/**
 * 404 Not Found response
 */
export function notFoundResponse(message = "Not found"): NextResponse {
  return errorResponse(message, 404);
}

/**
 * 500 Internal Server Error response
 */
export function serverErrorResponse(message = "Internal server error"): NextResponse {
  return errorResponse(message, 500);
}

/**
 * Cache-Control header constant for non-error responses
 */
export const NO_CACHE_HEADERS = { "Cache-Control": "no-store" };

