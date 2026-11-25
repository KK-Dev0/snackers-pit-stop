import { getDb } from "../dexie";

export interface SavedRecipeRecord {
  id: string;
  slug?: string;
  recipe: unknown;
  sourceUrl?: string | null;
  sourceType: string;
  importedAt: number;
}

export async function listSavedRecipes(): Promise<SavedRecipeRecord[]> {
  const db = getDb();
  return db.savedRecipes.orderBy("importedAt").reverse().toArray();
}

export async function getSavedRecipe(id: string): Promise<SavedRecipeRecord | undefined> {
  const db = getDb();
  return db.savedRecipes.get(id);
}

export async function saveSavedRecipe(record: SavedRecipeRecord): Promise<void> {
  const db = getDb();
  await db.savedRecipes.put(record);
}

export async function deleteSavedRecipe(id: string): Promise<void> {
  const db = getDb();
  await db.savedRecipes.delete(id);
}