/**
 * Purpose:
 *   User signup API for creating accounts
 *
 * Scope:
 *   - Signup page to register new users
 *   - Backend logic that provisions basic user records before profile editing
 *
 * Role:
 *   - Validate simple credential requirements for new users
 *   - Check for conflicts on email and username before inserting records
 *   - Create initial user documents with hashed passwords and timestamps
 *
 * Deps:
 *   - MongoDB via lib/mongodb for user storage
 *   - bcrypt for password hashing
 *
 * Notes:
 *   - Email and username must be unique (case-insensitive, trimmed)
 *   - Username used as default name if name not provided
 *   - returns 400 response if email, username, or password is invalid (password must be at least 8 characters)
 *   - returns 409 response if email or username already exists
 *   - password hashed with bcrypt before storage
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import bcrypt from "bcrypt";
// bcrypt relies on Node
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // read the expected signup payload with email, username, and password
    const body = (await req.json().catch(() => null)) as {
      email?: string;
      username?: string;
      password?: string;
    } | null;
    // normalize email and username to lowercase and trim whitespace
    const email = String(body?.email ?? "").toLowerCase().trim();
    const username = String(body?.username ?? "").toLowerCase().trim();
    const password = String(body?.password ?? "");

    // basic length and null check before hitting the database
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

