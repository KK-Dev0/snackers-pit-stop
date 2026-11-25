/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, beforeAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";

import { rebuildRecipeFts } from "@/server/db/fts";
import { createRecipeRetriever } from "@/server/retrieval";
import * as schema from "@/server/db/schema";

describe("retrieval", () => {
  let db: any;

  beforeAll(async () => {
    const client = createClient({ url: "file::memory:" });
    db = drizzle(client, { schema });
    const migration = fs.readFileSync(
      path.join(process.cwd(), "drizzle", "0000_aspiring_frog_thor.sql"),
      "utf8",
    );
    for (const stmt of migration.split("--> statement-breakpoint")) {
      const s = stmt.trim();
      if (s) await client.execute(s);
    }

    await db.insert(schema.ingredients).values([
      {
        id: "rice",
        name: "Rice",
        aliases: [],
        aisle: "staples",
        baseUnit: "g",
        kcalPer100: 360,
        defaultPriceInr: 10,
        priceBasis: "100g",
        dietTags: ["vegan", "veg"],
        allergenTags: [],
        isStaple: false,
      },
      {
        id: "toor-dal",
        name: "Toor Dal",
        aliases: [],
        aisle: "staples",
        baseUnit: "g",
        kcalPer100: 340,
        defaultPriceInr: 12,
        priceBasis: "100g",
        dietTags: ["vegan", "veg"],
        allergenTags: [],
        isStaple: false,
      },
      {
        id: "paneer",
        name: "Paneer",
        aliases: [],
        aisle: "dairy",
        baseUnit: "g",
        kcalPer100: 265,
        defaultPriceInr: 60,
        priceBasis: "100g",
        dietTags: ["veg"],
        allergenTags: ["dairy"],
        isStaple: false,
      },
    ]);

    await db.insert(schema.recipes).values([
      {
        id: "r1",
        slug: "dal-rice",
        title: "Dal Rice",
        description: "Simple dal and rice",
        cuisine: "Indian",
        diet: "veg",
        mealSlots: ["lunch", "dinner"],
        servings: 2,
        prepMin: 10,
        cookMin: 20,
        steps: ["cook"],
        sourceType: "seed",
        allergens: [],
        tags: ["budget"],
      },
      {
        id: "r2",
        slug: "paneer-curry",
        title: "Paneer Curry",
        description: "Paneer in gravy",
        cuisine: "Indian",
        diet: "veg",
        mealSlots: ["lunch", "dinner"],
        servings: 2,
        prepMin: 10,
        cookMin: 20,
        steps: ["cook"],
        sourceType: "seed",
        allergens: ["dairy"],
        tags: [],
      },
      {
        id: "r3",
        slug: "chicken-curry",
        title: "Chicken Curry",
        description: "Chicken in gravy",
        cuisine: "Indian",
        diet: "nonveg",
        mealSlots: ["lunch", "dinner"],
        servings: 2,
        prepMin: 10,
        cookMin: 30,
        steps: ["cook"],
        sourceType: "seed",
        allergens: [],
        tags: [],
      },
    ]);

    await db.insert(schema.recipeIngredients).values([
      { recipeId: "r1", ingredientId: "rice", rawName: "rice", quantity: 100, unit: "g", sortOrder: 0 },
      { recipeId: "r1", ingredientId: "toor-dal", rawName: "toor dal", quantity: 50, unit: "g", sortOrder: 1 },
      { recipeId: "r2", ingredientId: "paneer", rawName: "paneer", quantity: 100, unit: "g", sortOrder: 0 },
    ]);

    await rebuildRecipeFts(db);
  });

  it("filters by diet (vegan excludes non-veg and veg? veg allowed for veg user)", async () => {
    const retriever = createRecipeRetriever(db);
    const res = await retriever.retrieve({ diet: "vegan" });
    // no vegan recipes seeded, so empty
    expect(res.length).toBe(0);
  });

  it("excludes allergens", async () => {
    const retriever = createRecipeRetriever(db);
    const res = await retriever.retrieve({ diet: "veg", allergens: ["dairy"] });
    const slugs = res.map((r: any) => r.recipe.slug);
    expect(slugs).not.toContain("paneer-curry");
    expect(slugs).toContain("dal-rice");
  });

  it("pantry-first ordering", async () => {
    const retriever = createRecipeRetriever(db);
    const res = await retriever.retrieve({
      diet: "veg",
      pantryNames: ["rice", "toor dal"],
    });
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].recipe.slug).toBe("dal-rice");
    expect(res[0].breakdown.pantry).toBeGreaterThan(0);
  });

  it("empty query returns candidates", async () => {
    const retriever = createRecipeRetriever(db);
    const res = await retriever.retrieve({ diet: "veg" });
    expect(res.length).toBe(2);
  });
});