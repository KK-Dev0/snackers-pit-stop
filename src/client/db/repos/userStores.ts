import { getDb } from "../dexie";

export interface UserStoreRecord {
  storeId: string;
  customName?: string;
  selected: boolean;
  confirmedByUser: boolean;
  updatedAt: number;
}

export async function listUserStores(): Promise<UserStoreRecord[]> {
  const db = getDb();
  return db.userStores.toArray();
}

export async function getUserStore(storeId: string): Promise<UserStoreRecord | undefined> {
  const db = getDb();
  return db.userStores.get(storeId);
}

export async function saveUserStore(record: UserStoreRecord): Promise<void> {
  const db = getDb();
  await db.userStores.put(record);
}

export async function deleteUserStore(storeId: string): Promise<void> {
  const db = getDb();
  await db.userStores.delete(storeId);
}