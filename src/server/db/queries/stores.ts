import { and, eq, sql } from "drizzle-orm";

import { getDb } from "../client";
import * as schema from "../schema";

type Db = ReturnType<typeof getDb>;

export async function listStores(db: Db = getDb()) {
  return db.select().from(schema.stores).orderBy(schema.stores.sortOrder);
}

export async function getStoreById(id: string, db: Db = getDb()) {
  const rows = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.id, id));
  return rows[0] ?? null;
}

export async function getAvailabilityForPincode(pincode: string, db: Db = getDb()) {
  const stores = await listStores(db);
  const rows = await db
    .select()
    .from(schema.pincodeStores)
    .where(eq(schema.pincodeStores.pincode, pincode));
  const byStore = new Map(rows.map((r) => [r.storeId, r]));
  return stores.map((store) => {
    const row = byStore.get(store.id);
    return {
      store,
      pincode,
      confirmedCount: row?.confirmedCount ?? 0,
      lastConfirmedAt: row?.lastConfirmedAt ?? null,
      confirmed: (row?.confirmedCount ?? 0) > 0,
      hasRow: !!row,
    };
  });
}

export async function addConfirmation(
  pincode: string,
  storeId: string,
  ipHash: string,
  db: Db = getDb(),
) {
  const now = Date.now();
  await db.insert(schema.storeConfirmations).values({
    pincode,
    storeId,
    ipHash,
    createdAt: now,
  });
  // upsert pincode_stores row
  const existing = await db
    .select()
    .from(schema.pincodeStores)
    .where(
      and(
        eq(schema.pincodeStores.pincode, pincode),
        eq(schema.pincodeStores.storeId, storeId),
      ),
    );
  if (existing.length === 0) {
    await db.insert(schema.pincodeStores).values({
      pincode,
      storeId,
      confirmedCount: 1,
      lastConfirmedAt: now,
    });
  } else {
    await db
      .update(schema.pincodeStores)
      .set({
        confirmedCount: sql`${schema.pincodeStores.confirmedCount} + 1`,
        lastConfirmedAt: now,
      })
      .where(
        and(
          eq(schema.pincodeStores.pincode, pincode),
          eq(schema.pincodeStores.storeId, storeId),
        ),
      );
  }
}

export async function countRecentConfirmationsByIp(
  ipHash: string,
  sinceMs: number,
  db: Db = getDb(),
) {
  const rows = await db
    .select()
    .from(schema.storeConfirmations)
    .where(eq(schema.storeConfirmations.ipHash, ipHash));
  return rows.filter((r) => (r.createdAt ?? 0) >= sinceMs).length;
}

export async function countRecentConfirmationsByPincodeStore(
  pincode: string,
  storeId: string,
  ipHash: string,
  sinceMs: number,
  db: Db = getDb(),
) {
  const rows = await db
    .select()
    .from(schema.storeConfirmations)
    .where(
      and(
        eq(schema.storeConfirmations.pincode, pincode),
        eq(schema.storeConfirmations.storeId, storeId),
        eq(schema.storeConfirmations.ipHash, ipHash),
      ),
    );
  return rows.filter((r) => (r.createdAt ?? 0) >= sinceMs).length;
}

// index barrel for queries
export { getDb } from "../client";