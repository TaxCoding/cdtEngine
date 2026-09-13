import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _cdtMongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!uri) {
  // Deferred failure: history/save features will report a clear error when
  // actually used, but graph generation (the core feature) still works
  // without a database configured.
  clientPromise = Promise.reject(
    new Error("MONGODB_URI is not configured on the server.")
  );
  // Prevent an unhandled rejection warning for the deferred promise above.
  clientPromise.catch(() => {});
} else {
  const client = new MongoClient(uri);

  if (process.env.NODE_ENV === "development") {
    // Reuse the client across Next.js dev-mode HMR reloads.
    if (!global._cdtMongoClientPromise) {
      global._cdtMongoClientPromise = client.connect();
    }
    clientPromise = global._cdtMongoClientPromise;
  } else {
    // In production on Vercel, module scope is reused across warm
    // invocations of the same serverless function instance.
    clientPromise = client.connect();
  }
}

export default clientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db(); // uses the database name embedded in MONGODB_URI
}
