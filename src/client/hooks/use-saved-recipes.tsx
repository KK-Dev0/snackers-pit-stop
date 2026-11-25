"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

import { getDb } from "../db/dexie";
import type { SavedRecipeRecord } from "../db/dexie";

/** Live list of device-only imported recipes, newest first. */
export function useSavedRecipes(): SavedRecipeRecord[] {
  const [recipes, setRecipes] = useState<SavedRecipeRecord[]>([]);

  useEffect(() => {
    const db = getDb();
    const subscription = liveQuery(() =>
      db.savedRecipes.orderBy("importedAt").reverse().toArray(),
    ).subscribe({
      next: (value) => setRecipes(value),
      error: (error) => console.error(error),
    });
    return () => subscription.unsubscribe();
  }, []);

  return recipes;
}
