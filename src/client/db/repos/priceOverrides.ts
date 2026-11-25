import { getDb } from "../dexie";

export interface PriceOverrideRecord {
  ingredientId: string;
  priceInr: number;
  priceBasis: string;
  updatedAt: number;
}

export async function getPriceOverride(ingredientId: string): Promise<PriceOverrideRecord | undefined> {
  const db = getDb();
  return db.priceOverrides.get(ingredientId);
}

export async function listPriceOverrides(): Promise<PriceOverrideRecord[]> {
  const db = getDb();
  return db.priceOverrides.toArray();
}

export async function savePriceOverride(record: PriceOverrideRecord): Promise<void> {
  const db = getDb();
  await db.priceOverrides.put(record);
}

export async function deletePriceOverride(ingredientId: string): Promise<void> {
  const db = getDb();
  await db.priceOverrides.delete(ingredientId);
}