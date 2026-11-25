import { PincodeSchema } from "@/lib/schemas/geo";

/** Attribution required by the Nominatim usage policy when showing results. */
export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

/** Strip spaces and common formatting so manual entry can be forgiving. */
export function normalizePincode(raw: string): string {
  return raw.replace(/[^\d]/g, "").trim();
}

export function isPincode(value: string): boolean {
  return PincodeSchema.safeParse(value).success;
}

export type GeolocationErrorCode =
  | "unsupported"
  | "permission_denied"
  | "timeout"
  | "unavailable";

/** Map the browser's numeric PositionError codes to our UI states. */
export function geolocationErrorCode(
  error: { code?: number } | null | undefined,
): GeolocationErrorCode {
  if (error?.code === 1) return "permission_denied";
  if (error?.code === 3) return "timeout";
  return "unavailable";
}

/** User-facing copy for browser geolocation failures. */
export function geolocationErrorMessage(code: GeolocationErrorCode): string {
  switch (code) {
    case "unsupported":
      return "Location is not available in this browser. Enter your pincode instead.";
    case "permission_denied":
      return "Location access was denied. Enter your pincode instead.";
    case "timeout":
      return "Location took too long. Enter your pincode instead.";
    case "unavailable":
      return "Location is unavailable right now. Enter your pincode instead.";
  }
}
