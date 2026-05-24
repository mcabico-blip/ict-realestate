import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchLawyerPool } from "@/lib/lawyer-pool";

// Returns the pool of lawyers available for engagement.
//
// Auth required — this is NOT a public directory; it's the picker shown to a
// buyer (or broker, on behalf of a buyer) during the engagement flow.
//
// Implementation note: this currently queries the local DB via lawyer-pool.ts.
// When ict_services is live, the swap happens there, not here.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const city = req.nextUrl.searchParams.get("city") ?? undefined;
  const specialty = req.nextUrl.searchParams.get("specialty") ?? undefined;

  const lawyers = await fetchLawyerPool({ city, specialty });
  return NextResponse.json({ lawyers });
}
