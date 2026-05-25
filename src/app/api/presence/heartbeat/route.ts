import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMobileSession } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

/**
 * POST /api/presence/heartbeat — explicit heartbeat from the client.
 *
 * This is sent ONLY when the user's tab is visible + focused AND they've
 * shown signs of life recently (mouse/keyboard activity or app foreground).
 * It's the authoritative source for "is this user really available right now?".
 *
 * Unlike touchPresence() which fires on any authed request (could mean a
 * background tab open for hours), this confirms intent.
 *
 * Throttling: the client should call this every ~60s while active and
 * stop when hidden/blurred. Server bypasses throttling here — every call
 * writes (and is cheap: one indexed by-id update).
 */
export async function POST(req: NextRequest) {
  const web = await getServerSession(authOptions);
  const userId = web?.user
    ? (web.user as { id: string }).id
    : (await getMobileSession(req))?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
