import { GeoLocationSchema, type GeoLocation } from "@/lib/schemas/geo";

/** Reverse geocoding returns only coarse place data — never coordinates. */
export type ReverseGeocodeResult = GeoLocation;

export type GeoProviderErrorCode =
  | "configuration"
  | "invalid_coordinates"
  | "not_found"
  | "timeout"
  | "provider_unavailable"
  | "invalid_response";

export class GeoProviderError extends Error {
  constructor(
    readonly code: GeoProviderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GeoProviderError";
  }
}

/**
 * Swappable reverse-geocoding boundary. Implementations must return a pincode
 * or null; they never expose the coordinates passed to them.
 */
export interface GeoProvider {
  readonly id: string;
  reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult | null>;
}

export function parseReverseGeocodeResult(value: unknown): ReverseGeocodeResult | null {
  const parsed = GeoLocationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
