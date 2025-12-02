/**
 * Purpose:
 *   Shared MongoDB connection setup for server and API routes
 *
 * Scope:
 *   - All server side code and API route handlers that talk to db
 *
 * Role:
 *   - Create and reuses a single MongoDB client across requests
 *   - Expose clientPromise for libraries and adapters that expect it
 *   - Provide db() helper for accessing db
 *
 * Deps:
 *   - MongoDB Node.js driver
 *   - MONGODB_URI and MONGODB_DB environment variables
 *
 * Notes:
 *   - Designed for the Next.js app router running on Node.js
 *   - Reuses the client instance during dev
 *
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

/**
 * Purpose:
 *   Get the MongoDB database instance for querying collections
 *
 * Returns:
 *   - Promise resolving to the MongoDB db instance
 *
 * Notes:
 *   - Reuses the global client connection to prevent connection exhaustion
 *   - Used by all API routes that need db access
 */
export async function db(): Promise<Db> {
  const conn = await clientPromise;
  return conn.db(dbName);
}
