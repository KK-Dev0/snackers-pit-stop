import { NextResponse } from "next/server";

import { getDb } from "@/server/db/client";
import { listStores } from "@/server/db/queries/stores";

export const runtime = "nodejs";

export async function GET() {
  const items = await listStores(getDb());
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } },
  );
}
