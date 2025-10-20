import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { clientPromise, db } from "@/lib/mongodb";
import bcrypt from "bcrypt";
// bcrypt relies on Node
export const runtime = "nodejs";


/**
 * Auth.js (NextAuth) route — Credentials + Google, JWT sessions, MongoDBAdapter
 * - Note: make sure you have creds in env (Mongo, Google, ...)
 * Docs:
 * - Auth.js (NextAuth): https://authjs.dev/reference/nextjs
 * - Providers: https://authjs.dev/reference/core/providers
 * - Credentials flow (auth): https://authjs.dev/getting-started/providers/credentials
 * - MongoDB adapter: https://authjs.dev/reference/adapter/mongodb
 */


const handler = NextAuth({
   // JWT sessions (keeps things simple)
  session: { strategy: "jwt" },
   // Stores stuff in MongoDB
  adapter: MongoDBAdapter(clientPromise),
  pages: { signIn: "/login" },
  providers: [
    // OAuth with google (one of auth.js' providers (spotify is too (soundcloud isn't so we will have to route/config ourseleves))
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const identifier = String(raw?.identifier ?? "").toLowerCase().trim();
        const password = String(raw?.password ?? "");
        if (!identifier || !password) return null;

        const database = await db();
        const user = await database.collection("users").findOne({
          $or: [{ email: identifier }, { username: identifier }],
        });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name ?? user.username,
          image: user.image ?? null,
        } as any;
      },
    }),
  ],
});

export { handler as GET, handler as POST };
