/**
 * Purpose:
 *   TypeScript type for NextAuth session
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
 *   - This file extends NextAuth's default types
 *   - user.id is added in the JWT callback in route handler
 *
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
