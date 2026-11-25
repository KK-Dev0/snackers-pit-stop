import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { getServerEnv } from "@/lib/env";

import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

declare global {
  var __snackersDb: ReturnType<typeof createDatabase> | undefined;
}

function createDatabase() {
  const env = getServerEnv();
  const client = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  return drizzle(client, { schema });
}

/**
 * Lazily create and cache the Drizzle client. In development the instance is
 * stored on `globalThis` so hot reloads do not open new connections.
 */
export function getDb(): Database {
  if (globalThis.__snackersDb) {
    return globalThis.__snackersDb;
  }

  const database = createDatabase();

  if (process.env.NODE_ENV !== "production") {
    globalThis.__snackersDb = database;
  }

  return database;
}
