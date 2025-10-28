import NextAuth, { type NextAuthOptions } from "next-auth";
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


/**
 * Exported so other API routes can call:
 *   const session = await getServerSession(authOptions)
 */
export const authOptions: NextAuthOptions = {

  session: { strategy: "jwt" },
  adapter: MongoDBAdapter(clientPromise),

  pages: { signIn: "/login" },


  providers: [
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

  callbacks: {
    /**
     * Ensure session.user.id is present
     * NextAuth puts the user id in JWT; we need it 4 our sessions.
     */
    async session({ session, token }) {
      if (session.user && token.sub) (session.user as any).id = token.sub;
      return session;
    },
  },
};

// Build the handler for all /api/auth/* requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


