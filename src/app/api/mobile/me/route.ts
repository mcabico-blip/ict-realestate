import { NextRequest, NextResponse } from "next/server";
import { getMobileSession } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

// GET /api/mobile/me — returns the current user given a valid Bearer token.
// Used by the Flutter app to validate stored tokens and rehydrate session
// state on cold start.
export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Re-fetch fresh user info in case role/name changed since token issuance
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User no longer exists" }, { status: 401 });

  return NextResponse.json({ user });
}
