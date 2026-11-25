"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

import { getDb } from "../db/dexie";
import type { PantryItem } from "@/lib/schemas";

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);

  useEffect(() => {
    const db = getDb();
    const sub = liveQuery(() => db.pantryItems.toArray()).subscribe({
      next: (value) => setItems(value as PantryItem[]),
      error: (err) => console.error(err),
    });
    return () => sub.unsubscribe();
  }, []);

  return items;
}