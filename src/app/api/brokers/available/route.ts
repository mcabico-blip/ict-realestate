import { NextRequest, NextResponse } from "next/server";
import { fetchBrokerPool } from "@/lib/broker-pool";

/**
 * GET /api/brokers/available?excludeId=…&city=…&onlineOnly=true
 *
 * Public endpoint that powers the "Other available brokers" panel on
 * property pages and the broker fallback when a listing's agent is offline.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const excludeId = sp.get("excludeId") ?? undefined;
  const city = sp.get("city") ?? undefined;
  const onlineOnly = sp.get("onlineOnly") === "true";
  const limit = Number(sp.get("limit") ?? 6);

  const brokers = await fetchBrokerPool({ excludeId, city, onlineOnly, limit });
  return NextResponse.json({ brokers });
}
