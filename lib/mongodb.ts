import { MongoClient, Db } from "mongodb";

/**
 * Docs:
 * - MongoDB Node.js Driver: https://www.mongodb.com/docs/drivers/node/current/
 * - Client: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connect/#re-use-the-client
 */


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
