/**
 * Purpose:
 *   User signup API endpoint for credential-based registration
 *
 * Scope:
 *   - Used by signup page for new user registration
 *   - Creates accounts with email, username, and password
 *
 * Role:
 *   - Validates email, username, and password requirements
 *   - Checks for existing email or username conflicts (returns 409 if exists)
 *   - Hashes password with bcrypt before storage
 *   - Creates user document in database with timestamps
 *
 * Deps:
 *   - bcrypt for password hashing (12 rounds)
 *   - lib/mongodb for database access
 *
 * References:
 *   - Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 *   - Auth.js (NextAuth): https://authjs.dev/getting-started/installation?framework=Next.js
 *   - bcrypt: https://www.npmjs.com/package/bcrypt
 *
 * Notes:
 *   - Email and username must be unique (case-insensitive, trimmed)
 *   - Password hashed with bcrypt (12 rounds)
 *   - Username used as default name if name not provided
 *
 * Contributions (Shawn):
 *   - Implemented signup endpoint with credential validation and password hashing
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import bcrypt from "bcrypt";
// bcrypt relies on Node
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Expected payload 4 signup
    const body = (await req.json().catch(() => null)) as {
      email?: string;
      username?: string;
      password?: string;
    } | null;
    // normalize
    const email = String(body?.email ?? "").toLowerCase().trim();
    const username = String(body?.username ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");

    // temp check we should use zod
    if (!email || !username || password.length < 8) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const database = await db();
    const users = database.collection("users");

    const exists = await users.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return NextResponse.json(
        { error: "Email or username already in use" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    const now = new Date();

    await users.insertOne({
      email,
      username,
      name: username,
      password: hash,
      image: null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

