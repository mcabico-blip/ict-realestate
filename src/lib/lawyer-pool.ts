/**
 * Lawyer pool integration layer.
 *
 * Today: queries the local ict_realtors database (User table where role=LAWYER).
 *
 * Future: this will call the sister `ict_services` app, which will own the
 * unified professional directory across all ict_* products (realtors, fleet,
 * jgm_store, etc.). When ict_services is live, swap the internals of these
 * functions to fetch from its HTTP API — the callers (engagement API + UI)
 * will not need to change.
 *
 * To prepare for that swap, both functions return a plain `LawyerSummary`
 * shape rather than a Prisma model. Don't leak Prisma types from this module.
 */

import { db } from "@/lib/db";
import { isOnline, presenceScore } from "@/lib/presence";

export type LawyerSummary = {
  id: string;
  name: string | null;
  // Optional professional metadata. All nullable so the shape works whether
  // we read from the local DB today or from ict_services tomorrow.
  lawFirm: string | null;
  ibpRollNo: string | null;
  ibpChapter: string | null;
  barYear: number | null;
  city: string | null;
  yearsExp: number | null;
  lawSpecialties: string[];
  verified: boolean;
  featured: boolean;
  // Presence — true if the lawyer has hit an authed endpoint in the last 5 min.
  online: boolean;
};

/**
 * Fetch the pool of lawyers available for engagement.
 *
 * @param filters Optional filters to narrow the pool. All optional.
 *   - `city` — match lawyers practicing in the given city
 *   - `specialty` — match lawyers whose specialty list contains this string
 */
export async function fetchLawyerPool(filters: {
  city?: string;
  specialty?: string;
} = {}): Promise<LawyerSummary[]> {
  // TODO(ict_services): when ict_services is live, replace this block with:
  //   const url = new URL(`${process.env.ICT_SERVICES_URL}/api/professionals`);
  //   url.searchParams.set("type", "LAWYER");
  //   if (filters.city) url.searchParams.set("city", filters.city);
  //   const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.ICT_SERVICES_TOKEN}` } });
  //   return await res.json();
  const lawyers = await db.user.findMany({
    where: {
      role: "LAWYER",
      professionalProfile: {
        professionalType: "LAWYER",
        ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
        ...(filters.specialty
          ? { lawSpecialties: { has: filters.specialty } }
          : {}),
      },
    },
    select: {
      id: true,
      name: true,
      lastSeenAt: true,
      professionalProfile: {
        select: {
          lawFirm: true,
          ibpRollNo: true,
          ibpChapter: true,
          barYear: true,
          city: true,
          yearsExp: true,
          lawSpecialties: true,
          verified: true,
          featured: true,
        },
      },
    },
  });

  // Sort: online > featured > verified > recently active > name
  const enriched = lawyers.map((l) => ({
    id: l.id,
    name: l.name,
    lawFirm: l.professionalProfile?.lawFirm ?? null,
    ibpRollNo: l.professionalProfile?.ibpRollNo ?? null,
    ibpChapter: l.professionalProfile?.ibpChapter ?? null,
    barYear: l.professionalProfile?.barYear ?? null,
    city: l.professionalProfile?.city ?? null,
    yearsExp: l.professionalProfile?.yearsExp ?? null,
    lawSpecialties: l.professionalProfile?.lawSpecialties ?? [],
    verified: l.professionalProfile?.verified ?? false,
    featured: l.professionalProfile?.featured ?? false,
    online: isOnline(l.lastSeenAt),
    _score: presenceScore(l.lastSeenAt),
  }));
  enriched.sort((a, b) => {
    // Online comes first
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a._score !== b._score) return b._score - a._score;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
  return enriched.map(({ _score: _unused, ...rest }) => rest);
}

/**
 * Verify that a given user ID is a valid lawyer in the pool.
 * Used by the engagement-create API to validate the requested lawyerId before
 * creating an Engagement row.
 *
 * Returns `true` if the user exists and is a lawyer, `false` otherwise.
 */
export async function isLawyerInPool(lawyerId: string): Promise<boolean> {
  // TODO(ict_services): replace with HTTP HEAD/GET to ict_services when live.
  const user = await db.user.findUnique({
    where: { id: lawyerId },
    select: { role: true },
  });
  return user?.role === "LAWYER";
}
