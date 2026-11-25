import { getDb } from "../dexie";

export async function getSetting(key: string): Promise<unknown> {
  const db = getDb();
  const row = await db.settings.get(key);
  return row?.value;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = getDb();
  await db.settings.put({ key, value });
}