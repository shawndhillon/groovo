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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        const database = await db();
        const users = database.collection("users");

        // Check if user exists
        const existingUser = await users.findOne({ email: user.email });

        if (!existingUser) {
          // Create new user for Google OAuth
          const result = await users.insertOne({
            email: user.email,
            name: user.name ?? null,
            username: null, // We need to set or atleast allow users to set (maybe auto generate as most web apps do with oauth)
            image: user.image ?? null,
            bio: null,
            createdAt: new Date(),
          });
          if (user && result.insertedId) {
            (user as any).id = String(result.insertedId);
          }
        } else {
          await users.updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name ?? existingUser.name,
                image: user.image ?? existingUser.image,
              },
            }
          );
          if (user && existingUser._id) {
            (user as any).id = String(existingUser._id);
          }
        }
      }
      return true;
    },
    /**
     * Ensure session.user.id is present
     * NextAuth puts the user id in JWT; we need it 4 our sessions.
     */
    async jwt({ token, user, account }) {
      // When user signs in, store their ID in the token
      if (user) {
        // For credentials, user.id is already set
        // For Google OAuth, we need to get the user ID from mongo
        if (account?.provider === "google" && user.email) {
          const database = await db();
          const dbUser = await database.collection("users").findOne({ email: user.email });
          if (dbUser) {
            token.sub = String(dbUser._id);
          } else {
            // Fallback to user.id if available
            token.sub = (user as any).id || user.id;
          }
        } else {
          // For credentials provider, use the user.id directly
          token.sub = (user as any).id || user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

// Build the handler for all /api/auth/* requests
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


