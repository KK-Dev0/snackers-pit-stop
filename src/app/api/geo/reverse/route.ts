import { NextRequest, NextResponse } from "next/server";

import { GeoReverseRequestSchema } from "@/lib/schemas";
import { GeoProviderError, getGeoProvider } from "@/server/geo";
import { rateLimitRequest } from "@/server/rate-limit";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "invalid_json" },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = GeoReverseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", code: "invalid_request", issues: parsed.error.issues },
      { status: 400, headers: NO_STORE },
    );
  }

  const rl = rateLimitRequest(request, "geo-reverse");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "rate_limited" },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } },
    );
  }

  try {
    // Only the pincode and coarse labels leave the server; coordinates are
    // never persisted or returned to the client.
    const location = await getGeoProvider().reverseGeocode(
      parsed.data.lat,
      parsed.data.lon,
    );
    if (!location) {
      return NextResponse.json(
        { error: "No Indian pincode found for that location.", code: "not_supported" },
        { status: 404, headers: NO_STORE },
      );
    }
    return NextResponse.json(location, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof GeoProviderError) {
      const status =
        error.code === "invalid_coordinates"
          ? 400
          : error.code === "provider_unavailable"
            ? 503
            : 502;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status, headers: NO_STORE },
      );
    }
    return NextResponse.json(
      { error: "Location lookup failed.", code: "provider_error" },
      { status: 502, headers: NO_STORE },
    );
  }
}
