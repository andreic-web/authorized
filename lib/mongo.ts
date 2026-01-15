import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");

const uri = process.env.MONGODB_URI;
const options = {};

declare global {
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri, options);
const clientPromise = global.__mongoClientPromise__ ?? client.connect();
if (process.env.NODE_ENV === "development")
  global.__mongoClientPromise__ = clientPromise;

export default clientPromise;
