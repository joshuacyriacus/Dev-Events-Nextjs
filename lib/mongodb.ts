import "server-only";

import mongoose, { type Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Fail fast so misconfigured environments (local/CI/prod) are obvious.
  throw new Error("Missing MONGODB_URI. Add it to your environment variables.");
}

// In Next.js (especially during development with HMR), modules can be re-evaluated many times.
// We cache the connection/promise on `globalThis` to prevent creating multiple connections.
declare global {
  var mongooseCache:
    | {
        conn: Mongoose | null;
        promise: Promise<Mongoose> | null;
      }
    | undefined;
}

const cached = (globalThis.mongooseCache ??= { conn: null, promise: null });

/**
 * Connect to MongoDB using Mongoose.
 *
 * Returns the already-established connection when available, otherwise creates one.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      // Prevent Mongoose from buffering commands when the connection is down.
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // If the initial connection attempt fails, allow a future retry.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
