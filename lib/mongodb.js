import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 20000,
};

let client;
let clientPromise;

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0);
}

if (!process.env.MONGODB_URI) {
  // During build time or when not configured, we provide a placeholder promise
  // that throws a clear informative error when accessed at runtime.
  clientPromise = Promise.reject(
    new Error(
      'MONGODB_URI is not defined. Please set MONGODB_URI in your .env.local or deployment environment variables.'
    )
  );
  // Avoid unhandled rejection on module load
  clientPromise.catch(() => {});
} else {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

/**
 * Returns a connected MongoClient instance.
 */
export async function getMongoClient() {
  if (!isMongoConfigured()) {
    throw new Error(
      'Database connection is not configured. Please define MONGODB_URI in .env.local.'
    );
  }
  return clientPromise;
}

/**
 * Returns a connected MongoDB Database instance.
 * Defaults to process.env.MONGODB_DB or 'fitnessinfu'.
 */
export async function getDatabase(dbName) {
  const connectedClient = await getMongoClient();
  const databaseName = dbName || process.env.MONGODB_DB || 'fitnessinfu';
  return connectedClient.db(databaseName);
}

export default clientPromise;
