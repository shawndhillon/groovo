/**
 * Purpose:
 *   Extend NextAuth session typing
 *
 * Scope:
 *   - Extends NextAuth types to include user.id in session
 *   - Used throughout the app for type safe session access
 *
 * Role:
 *   - Adds user.id field to Session type
 *   - Ensures TypeScript knows about custom session shape
 *
 * Deps:
 *   - next-auth for base types
 *
 * Notes:
 *   - Extends NextAuth's default Session type (not redefining it)
 *   - Used throughout the app for type safe session access
 *   - user.id is populated in the JWT callback in the NextAuth route handler
 */

import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
