"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

import { getDb } from "../db/dexie";
import type { Profile } from "@/lib/schemas";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    const db = getDb();
    const sub = liveQuery(() => db.profile.get("me")).subscribe({
      next: (value) => setProfile((value as Profile | undefined) ?? null),
      error: (err) => console.error(err),
    });
    return () => sub.unsubscribe();
  }, []);

  return profile;
}