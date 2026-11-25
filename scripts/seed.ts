import "dotenv/config";

import { getDb } from "../src/server/db/client";
import { rebuildRecipeFts } from "../src/server/db/fts";

async function main(): Promise<void> {
  const db = getDb();

  // The catalog is seeded in later tasks. For now this pipeline keeps the
  // FTS5 index in sync with whatever recipes currently exist.
  await rebuildRecipeFts(db);

  console.log("Seed pipeline complete: recipe_fts rebuilt.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
