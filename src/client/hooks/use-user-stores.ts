"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

import { getDb } from "@/client/db/dexie";
import {
  saveUserStore,
  type UserStoreRecord,
} from "@/client/db/repos/userStores";

/** Live device-local store choices. These always override availability data. */
export function useUserStores() {
  const [records, setRecords] = useState<UserStoreRecord[] | undefined>(undefined);

  useEffect(() => {
    const db = getDb();
    const subscription = liveQuery(() => db.userStores.toArray()).subscribe({
      next: (value) => setRecords(value as UserStoreRecord[]),
      error: (error: unknown) => console.error(error),
    });
    return () => subscription.unsubscribe();
  }, []);

  const update = async (
    storeId: string,
    patch: Partial<Omit<UserStoreRecord, "storeId">>,
  ) => {
    const db = getDb();
    const existing = await db.userStores.get(storeId);
    const record = {
      storeId,
      selected: false,
      confirmedByUser: false,
      ...existing,
      ...patch,
    };
    await saveUserStore({ ...record, updatedAt: Date.now() });
  };

  return {
    records: records ?? [],
    loading: records === undefined,
    setSelected: (storeId: string, selected: boolean) =>
      update(storeId, { selected }),
    setCustomName: (storeId: string, customName: string) =>
      update(storeId, { customName }),
    markConfirmed: (storeId: string) => update(storeId, { confirmedByUser: true }),
  };
}
