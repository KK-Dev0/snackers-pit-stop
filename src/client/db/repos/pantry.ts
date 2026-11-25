import { getDb } from "../dexie";
import type { PantryItem } from "@/lib/schemas";

export async function listPantryItems(): Promise<PantryItem[]> {
  const db = getDb();
  return db.pantryItems.toArray();
}

export async function getPantryItem(id: string): Promise<PantryItem | undefined> {
  const db = getDb();
  return db.pantryItems.get(id);
}

export async function savePantryItem(item: PantryItem): Promise<void> {
  const db = getDb();
  await db.pantryItems.put(item);
}

export async function deletePantryItem(id: string): Promise<void> {
  const db = getDb();
  await db.pantryItems.delete(id);
}