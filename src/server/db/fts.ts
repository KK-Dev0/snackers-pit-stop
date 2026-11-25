import { sql } from "drizzle-orm";

import { getDb } from "./client";
import type { Database } from "./client";

/**
 * Rebuild the `recipe_fts` virtual table from the current recipe catalog.
 *
 * The catalog is seed-only at runtime, so this runs as part of the seed
 * pipeline rather than on every write.
 */
export async function rebuildRecipeFts(db: Database = getDb()): Promise<void> {
  await db.run(sql`DELETE FROM recipe_fts`);

  await db.run(sql`
    INSERT INTO recipe_fts (recipe_id, title, description, tags, ingredients)
    SELECT
      r.id,
      r.title,
      r.description,
      COALESCE(r.tags, '[]'),
      COALESCE(group_concat(ri.raw_name, ' '), '')
    FROM recipes AS r
    LEFT JOIN recipe_ingredients AS ri ON ri.recipe_id = r.id
    GROUP BY r.id
  `);
}
