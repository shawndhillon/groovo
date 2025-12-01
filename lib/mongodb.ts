/**
 * Purpose:
 *   MongoDB connection and database access utilities
 *
 * Scope:
 *   - Used by all API routes and server-side code that needs database access
 *
 * Role:
 *   - Manages MongoDB client connection with Next.js global reuse
 *   - Exports clientPromise for adapter compatibility
 *   - Provides db() helper to get database instance
 *
 * Deps:
 *   - MONGODB_URI and MONGODB_DB environment variables
 *
 * References:
 *   - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 *   - Client: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connect/#re-use-the-client
 *
 * Notes:
 *   - Client is reused across requests in development to prevent connection exhaustion
 *   - In production, Next.js handles connection pooling automatically
 *
 * Contributions (Shawn):
 *   - Implemented MongoDB connection utilities and client reuse pattern
 */

import { MongoClient, Db } from "mongodb";


const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;
if (!uri) throw new Error("Missing MONGODB_URI");
if (!dbName) throw new Error("Missing MONGODB_DB");

const globalForMongo = global as unknown as { _mongoClient?: MongoClient };

const client = globalForMongo._mongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo._mongoClient = client;
}

export const clientPromise: Promise<MongoClient> = client.connect();

export async function db(): Promise<Db> {
  const conn = await clientPromise;
  return conn.db(dbName);
}
