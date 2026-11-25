import { getServerEnv } from "@/lib/env";
import { GeoLocationSchema } from "@/lib/schemas/geo";

import {
  GeoProviderError,
  type GeoProvider,
  type ReverseGeocodeResult,
} from "./provider";

/** Nominatim's public service allows at most one request per second. */
export const NOMINATIM_MIN_INTERVAL_MS = 1_100;
export const NOMINATIM_TIMEOUT_MS = 8_000;
export const NOMINATIM_CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const FALLBACK_USER_AGENT =
  "SnackersPitStop/1.0 (meal-planning PWA reverse geocoding; set NOMINATIM_USER_AGENT for contact details)";

type Gate = <T>(task: () => Promise<T>) => Promise<T>;
type CacheEntry = { value: ReverseGeocodeResult | null; expiresAt: number };

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Serialises requests and spaces them apart so every provider instance stays
 * under the shared one-request-per-second budget. `now` and `sleep` are
 * injectable for deterministic tests.
 */
export function createSerialGate(
  minIntervalMs: number,
  now: () => number = Date.now,
  sleep: (ms: number) => Promise<void> = defaultSleep,
): Gate {
  let tail: Promise<unknown> = Promise.resolve();
  let nextAllowedAt = 0;

  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(async () => {
      const wait = Math.max(0, nextAllowedAt - now());
      if (wait > 0) await sleep(wait);
      nextAllowedAt = now() + minIntervalMs;
      return task();
    });
    tail = result.catch(() => undefined);
    return result;
  };
}

const defaultGate = createSerialGate(NOMINATIM_MIN_INTERVAL_MS);

export type NominatimProviderOptions = {
  baseUrl?: string;
  userAgent?: string;
  fetchImpl?: typeof fetch;
  gate?: Gate;
  timeoutMs?: number;
  cache?: Map<string, CacheEntry>;
  now?: () => number;
};

/** Map a Nominatim reverse response to the minimum data we are allowed to keep. */
export function parseNominatimPayload(payload: unknown): ReverseGeocodeResult | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const countryCode = record.countryCode ?? record.country_code ?? record.countrycode;
  if (typeof countryCode === "string" && countryCode.toLowerCase() !== "in") {
    return null;
  }

  const address =
    record.address && typeof record.address === "object"
      ? (record.address as Record<string, unknown>)
      : {};
  const rawPostcode = typeof address.postcode === "string" ? address.postcode : "";
  const pincode = rawPostcode.match(/\b[1-9][0-9]{5}\b/)?.[0];
  if (!pincode) return null;

  const city = [
    address.city,
    address.town,
    address.village,
    address.suburb,
    address.county,
  ].find((value) => typeof value === "string" && value.trim().length > 0);
  const state =
    typeof address.state === "string" && address.state.trim()
      ? address.state.trim()
      : null;

  const result = {
    pincode,
    city: typeof city === "string" ? city.trim() : null,
    state,
  };
  return GeoLocationSchema.safeParse(result).success ? result : null;
}

export function createNominatimProvider(
  options: NominatimProviderOptions = {},
): GeoProvider {
  const env = getServerEnv();
  const baseUrl = (options.baseUrl ?? env.NOMINATIM_BASE_URL).replace(/\/+$/, "");
  const userAgent = options.userAgent ?? env.NOMINATIM_USER_AGENT ?? FALLBACK_USER_AGENT;
  const fetchImpl = options.fetchImpl ?? fetch;
  const gate = options.gate ?? defaultGate;
  const cache = options.cache ?? new Map<string, CacheEntry>();
  const now = options.now ?? Date.now;
  const timeoutMs = options.timeoutMs ?? NOMINATIM_TIMEOUT_MS;

  return {
    id: "nominatim",
    async reverseGeocode(lat, lon): Promise<ReverseGeocodeResult | null> {
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
      ) {
        throw new GeoProviderError("invalid_coordinates", "Invalid coordinates.");
      }

      // Rounded keys avoid repeated near-identical lookups without losing
      // enough precision to cross a pincode boundary.
      const key = `${lat.toFixed(4)}:${lon.toFixed(4)}`;
      const cached = cache.get(key);
      if (cached && cached.expiresAt > now()) return cached.value;

      const value = await gate(async () => {
        const url = new URL("/reverse", baseUrl);
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("zoom", "18");
        url.searchParams.set("accept-language", "en");
        url.searchParams.set("lat", String(lat));
        url.searchParams.set("lon", String(lon));

        let response: Response;
        try {
          response = await fetchImpl(url, {
            headers: {
              "user-agent": userAgent,
              accept: "application/json",
            },
            signal: AbortSignal.timeout(timeoutMs),
            cache: "no-store",
          });
        } catch {
          throw new GeoProviderError(
            "provider_unavailable",
            "Location service is unavailable.",
          );
        }

        if (response.status === 429 || response.status >= 500) {
          throw new GeoProviderError(
            "provider_unavailable",
            "Location service is busy. Try again later.",
          );
        }
        if (!response.ok) {
          throw new GeoProviderError("invalid_response", "Location lookup failed.");
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new GeoProviderError("invalid_response", "Location lookup failed.");
        }
        return parseNominatimPayload(payload);
      });

      cache.set(key, { value, expiresAt: now() + NOMINATIM_CACHE_TTL_MS });
      return value;
    },
  };
}
