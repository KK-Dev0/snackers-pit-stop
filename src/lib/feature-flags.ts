import { getServerEnv } from "@/lib/env";

/** Server-only feature flags. Client code receives the resolved boolean. */
export function photoImportEnabled(): boolean {
  return getServerEnv().PHOTO_IMPORT_ENABLED;
}
