import { db } from "@/lib/db";

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Update a user's lastSeenAt timestamp. Called by authed API routes as a
 * lightweight "heartbeat" so we can show online indicators in the UI and
 * sort broker/lawyer suggestions by who's available now.
 *
 * Throttled in-memory to one DB write per user per 60 seconds to avoid
 * hammering the DB on every request.
 */
const lastWritten = new Map<string, number>();
const THROTTLE_MS = 60 * 1000;

export async function touchPresence(userId: string) {
  if (!userId) return;
  const now = Date.now();
  const last = lastWritten.get(userId) ?? 0;
  if (now - last < THROTTLE_MS) return;
  lastWritten.set(userId, now);
  try {
    await db.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  } catch {
    // best-effort; don't surface errors from a non-critical write
  }
}

export function isOnline(lastSeenAt: Date | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

/**
 * Returns a sortable score where higher = more recently active.
 * Online users (within window) get a large boost so they always sort first.
 */
export function presenceScore(lastSeenAt: Date | null | undefined): number {
  if (!lastSeenAt) return 0;
  const ageMs = Date.now() - new Date(lastSeenAt).getTime();
  if (ageMs < ONLINE_WINDOW_MS) return 1_000_000_000 - ageMs; // online: big boost
  return -ageMs; // offline: most recent first within offline group
}
