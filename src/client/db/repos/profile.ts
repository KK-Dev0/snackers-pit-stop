import { getDb } from "../dexie";
import type { Profile } from "@/lib/schemas";

export async function getProfile(): Promise<Profile | undefined> {
  const db = getDb();
  return db.profile.get("me");
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = getDb();
  await db.profile.put({ ...profile, id: "me" });
}

export async function clearProfile(): Promise<void> {
  const db = getDb();
  await db.profile.delete("me");
}