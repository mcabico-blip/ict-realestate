import { NextRequest, NextResponse } from "next/server";
import { getMobileSession } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

// POST /api/mobile/presence/heartbeat — explicit heartbeat from the Flutter
// app while it's in the foreground. Same semantics as the web equivalent.
export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.user.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
