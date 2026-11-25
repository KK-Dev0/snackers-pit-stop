import { getServerEnv } from "@/lib/env";

import { createNominatimProvider } from "./nominatim";
import type { GeoProvider } from "./provider";

/** Create a provider by id. Adding a provider here keeps the route swappable. */
export function createGeoProvider(id: string): GeoProvider {
  switch (id) {
    case "nominatim":
      return createNominatimProvider();
    default:
      throw new Error(`Unsupported geo provider: ${id}`);
  }
}

let cachedProvider: GeoProvider | undefined;

export function getGeoProvider(): GeoProvider {
  cachedProvider ??= createGeoProvider(getServerEnv().GEO_PROVIDER);
  return cachedProvider;
}

export * from "./provider";
