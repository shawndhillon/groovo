import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { clientPromise, db } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
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
      allowDangerousEmailAccountLinking: true, // Allow linking Google accounts to existing users with same email
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
        const accounts = database.collection("accounts");

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
          // User exists - link the Google account to the existing user
          if (user && existingUser._id) {
            (user as any).id = String(existingUser._id);
          }

          // Check if account link already exists for user or Google account
          const userIdForQuery = existingUser._id instanceof ObjectId
            ? existingUser._id
            : new ObjectId(String(existingUser._id));

          const existingAccountByUser = await accounts.findOne({
            userId: userIdForQuery,
            provider: "google",
          });

          const existingAccountByProvider = await accounts.findOne({
            provider: "google",
            providerAccountId: account.providerAccountId,
          });

          // If no account link exists, create it
          if (!existingAccountByUser && !existingAccountByProvider && account.providerAccountId) {
            await accounts.insertOne({
              userId: userIdForQuery,
              type: account.type,
              provider: "google",
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            });
          }

          // Update user info
          await users.updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name ?? existingUser.name,
                image: user.image ?? existingUser.image,
              },
            }
          );
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


