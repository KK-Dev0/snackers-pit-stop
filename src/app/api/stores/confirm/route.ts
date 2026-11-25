import { NextRequest, NextResponse } from "next/server";

import { ConfirmStoreRequestSchema } from "@/lib/schemas";
import { getDb } from "@/server/db/client";
import {
  addConfirmation,
  countRecentConfirmationsByIp,
  countRecentConfirmationsByPincodeStore,
  getAvailabilityForPincode,
  getStoreById,
} from "@/server/db/queries/stores";
import {
  getClientIp,
  hashIp,
  rateLimitRequest,
  RATE_LIMITS,
} from "@/server/rate-limit";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const CONFIRM_WINDOW_MS = RATE_LIMITS["stores-confirm"].windowMs;
/** A device gets one vote per pincode/store, even after the hourly bucket clears. */
const DUPLICATE_VOTE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RETRY_AFTER_SECONDS = String(CONFIRM_WINDOW_MS / 1000);

function tooMany() {
  return NextResponse.json(
    {
      error: "Too many confirmations. Try again later.",
      code: "rate_limited",
    },
    { status: 429, headers: { ...NO_STORE, "Retry-After": RETRY_AFTER_SECONDS } },
  );
}

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

  const parsed = ConfirmStoreRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        code: "invalid_request",
        issues: parsed.error.issues,
      },
      { status: 400, headers: NO_STORE },
    );
  }

  // Raw IPs never enter a bucket key, a log line, or the database.
  if (!rateLimitRequest(request, "stores-confirm").allowed) return tooMany();

  const db = getDb();
  const { pincode, storeId } = parsed.data;
  const store = await getStoreById(storeId, db);
  if (!store) {
    return NextResponse.json(
      { error: "Unknown store.", code: "unknown_store" },
      { status: 404, headers: NO_STORE },
    );
  }

  const ipHash = hashIp(getClientIp(request));
  const now = Date.now();

  const duplicate = await countRecentConfirmationsByPincodeStore(
    pincode,
    storeId,
    ipHash,
    now - DUPLICATE_VOTE_WINDOW_MS,
    db,
  );
  if (duplicate > 0) {
    return NextResponse.json(
      {
        error: "You already confirmed this store for this pincode.",
        code: "duplicate",
      },
      { status: 409, headers: NO_STORE },
    );
  }

  // Persisted counts back up the in-memory bucket across restarts/instances.
  const recentByIp = await countRecentConfirmationsByIp(
    ipHash,
    now - CONFIRM_WINDOW_MS,
    db,
  );
  if (recentByIp >= RATE_LIMITS["stores-confirm"].limit) return tooMany();

  await addConfirmation(pincode, storeId, ipHash, db);

  const availability = await getAvailabilityForPincode(pincode, db);
  const row = availability.find((item) => item.store.id === storeId);
  return NextResponse.json(
    {
      pincode,
      storeId,
      confirmedCount: row?.confirmedCount ?? 1,
      confirmed: row?.confirmed ?? true,
      lastConfirmedAt: row?.lastConfirmedAt ?? now,
    },
    { headers: NO_STORE },
  );
}
