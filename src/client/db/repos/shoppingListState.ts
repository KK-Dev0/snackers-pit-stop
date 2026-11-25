import { getDb, type ShoppingListStateRecord } from "../dexie";

export async function getShoppingListState(planId: string): Promise<ShoppingListStateRecord | undefined> {
  const db = getDb();
  return db.shoppingListState.get(planId);
}

export async function saveShoppingListState(record: ShoppingListStateRecord): Promise<void> {
  const db = getDb();
  await db.shoppingListState.put(record);
}