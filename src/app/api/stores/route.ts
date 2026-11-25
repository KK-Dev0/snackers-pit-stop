import { NextRequest, NextResponse } from "next/server";

import { StoresQuerySchema } from "@/lib/schemas";
import { getDb } from "@/server/db/client";
import {
  getAvailabilityForPincode,
  listStores,
} from "@/server/db/queries/stores";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rawPincode = request.nextUrl.searchParams.get("pincode");
  let pincode: string | null = null;

  if (rawPincode !== null && rawPincode !== "") {
    const parsed = StoresQuerySchema.safeParse({ pincode: rawPincode });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid pincode", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    pincode = parsed.data.pincode;
  }

  const db = getDb();
  const availability = pincode
    ? await getAvailabilityForPincode(pincode, db)
    : null;

  // Unknown pincodes still receive every store, simply unconfirmed.
  const items = availability
    ? availability.map(({ store, confirmedCount, confirmed, lastConfirmedAt }) => ({
        ...store,
        confirmedCount,
        confirmed,
        lastConfirmedAt,
      }))
    : (await listStores(db)).map((store) => ({
        ...store,
        confirmedCount: 0,
        confirmed: false,
        lastConfirmedAt: null,
      }));

  return NextResponse.json(
    {
      items,
      pincode,
      hasAvailabilityData: availability?.some((row) => row.hasRow) ?? false,
    },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } },
  );
}
