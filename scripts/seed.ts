import "dotenv/config";

import { getDb } from "../src/server/db/client";
import { rebuildRecipeFts } from "../src/server/db/fts";
import * as schema from "../src/server/db/schema";
import type { SeedIngredient, SeedRecipe, SeedStore, SeedPincodeStore } from "./seed-data/types";
import { ingredients as seedIngredients } from "./seed-data/ingredients";
import { recipes as seedRecipes } from "./seed-data/recipes";
import { stores as seedStores, pincodeStores as seedPincodeStores } from "./seed-data/stores";

async function main(): Promise<void> {
  const db = getDb();

  // Reset catalog tables (seed-only at runtime).
  await db.delete(schema.recipeIngredients);
  await db.delete(schema.recipes);
  await db.delete(schema.ingredients);
  await db.delete(schema.pincodeStores);
  await db.delete(schema.storeConfirmations);
  await db.delete(schema.stores);

  // Stores first (FK target).
  if (seedStores.length > 0) {
    await db.insert(schema.stores).values(
      seedStores.map((s: SeedStore) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        linkTemplate: s.linkTemplate ?? null,
        sortOrder: s.sortOrder,
      })),
    );
  }

  if (seedPincodeStores.length > 0) {
    await db.insert(schema.pincodeStores).values(
      seedPincodeStores.map((p: SeedPincodeStore) => ({
        pincode: p.pincode,
        storeId: p.storeId,
        confirmedCount: p.confirmedCount ?? 0,
        lastConfirmedAt: p.lastConfirmedAt ?? null,
      })),
    );
  }

  // Ingredients.
  if (seedIngredients.length > 0) {
    await db.insert(schema.ingredients).values(
      seedIngredients.map((i: SeedIngredient) => ({
        id: i.id,
        name: i.name,
        aliases: i.aliases ?? [],
        aisle: i.aisle,
        baseUnit: i.baseUnit,
        pieceGrams: i.pieceGrams ?? null,
        kcalPer100: i.kcalPer100,
        proteinGPer100: i.proteinGPer100 ?? 0,
        carbsGPer100: i.carbsGPer100 ?? 0,
        fatGPer100: i.fatGPer100 ?? 0,
        fiberGPer100: i.fiberGPer100 ?? 0,
        sodiumMgPer100: i.sodiumMgPer100 ?? 0,
        defaultPriceInr: i.defaultPriceInr,
        priceBasis: i.priceBasis,
        dietTags: i.dietTags ?? [],
        allergenTags: i.allergenTags ?? [],
        isStaple: i.isStaple ?? false,
      })),
    );
  }

  // Recipes + ingredients.
  for (const r of seedRecipes as SeedRecipe[]) {
    await db.insert(schema.recipes).values({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      cuisine: r.cuisine,
      diet: r.diet,
      mealSlots: r.mealSlots,
      servings: r.servings,
      prepMin: r.prepMin,
      cookMin: r.cookMin,
      steps: r.steps,
      imageUrl: r.imageUrl ?? null,
      sourceUrl: r.sourceUrl ?? null,
      sourceType: r.sourceType,
      allergens: r.allergens ?? [],
      tags: r.tags ?? [],
    });
    if (r.ingredients.length > 0) {
      await db.insert(schema.recipeIngredients).values(
        r.ingredients.map((ri: SeedRecipe["ingredients"][number]) => ({
          recipeId: r.id,
          ingredientId: ri.ingredientId ?? null,
          rawName: ri.rawName,
          quantity: ri.quantity,
          unit: ri.unit,
          grams: ri.grams ?? null,
          optional: ri.optional ?? false,
          sortOrder: ri.sortOrder,
        })),
      );
    }
  }

  await rebuildRecipeFts(db);

  console.log(
    `Seed pipeline complete: ${seedIngredients.length} ingredients, ${seedRecipes.length} recipes, ${seedStores.length} stores.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});



