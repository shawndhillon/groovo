import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import bcrypt from "bcrypt";
// bcrypt relies on Node
export const runtime = "nodejs";

/**
 * Signup (Credentials) — creates a user with email/username/password.
 *
 * Docs:
 * - Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 * - Auth.js (NextAuth): https://authjs.dev/getting-started/installation?framework=Next.js
 * - bcrypt: https://www.npmjs.com/package/bcrypt
 */




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

