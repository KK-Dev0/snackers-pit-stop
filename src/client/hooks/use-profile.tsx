"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

import { getDb } from "../db/dexie";
import { normalizeAllergens, type Profile } from "@/lib/schemas";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    const db = getDb();
    const sub = liveQuery(() => db.profile.get("me")).subscribe({
      next: (value) => {
        const loaded = (value as Profile | undefined) ?? null;
        if (!loaded) {
          setProfile(null);
          return;
        }
        const allergens = normalizeAllergens(loaded.allergens ?? []);
        const unchanged =
          allergens.length === (loaded.allergens?.length ?? 0) &&
          allergens.every((allergen, index) => allergen === loaded.allergens?.[index]);
        setProfile(unchanged ? loaded : { ...loaded, allergens });
      },
      error: (err) => console.error(err),
    });
    return () => sub.unsubscribe();
  }, []);

  return profile;
}
