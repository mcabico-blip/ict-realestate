import { db } from "@/lib/db";
import { isOnline, presenceScore } from "@/lib/presence";

export type BrokerSummary = {
  id: string;
  name: string | null;
  role: string; // BROKER or SALESPERSON
  agency: string | null;
  licenseNo: string | null;
  accreditationNo: string | null;
  city: string | null;
  yearsExp: number | null;
  specialties: string[];
  verified: boolean;
  featured: boolean;
  online: boolean;
  activeListingCount: number;
};

/**
 * Fetch the pool of brokers + salespersons available to help.
 *
 * Used by the "Suggested available brokers" panel on property pages when
 * the listing's own agent is offline, and the broker browser at /professionals.
 *
 * @param filters Optional narrowing
 *   - excludeId: skip this user (typically the listing's own owner)
 *   - city: prefer brokers in this city
 *   - onlineOnly: filter to only currently-online brokers
 *   - limit: max results (default 8)
 */
export async function fetchBrokerPool(
  filters: {
    excludeId?: string;
    city?: string;
    onlineOnly?: boolean;
    limit?: number;
  } = {}
): Promise<BrokerSummary[]> {
  const brokers = await db.user.findMany({
    where: {
      role: { in: ["BROKER", "SALESPERSON"] },
      ...(filters.excludeId ? { id: { not: filters.excludeId } } : {}),
      professionalProfile: { isNot: null },
    },
    select: {
      id: true,
      name: true,
      role: true,
      lastSeenAt: true,
      professionalProfile: {
        select: {
          agency: true,
          licenseNo: true,
          accreditationNo: true,
          city: true,
          yearsExp: true,
          specialties: true,
          verified: true,
          featured: true,
        },
      },
      _count: {
        select: { properties: { where: { status: "ACTIVE" } } },
      },
    },
  });

  const enriched = brokers.map((b) => ({
    id: b.id,
    name: b.name,
    role: b.role,
    agency: b.professionalProfile?.agency ?? null,
    licenseNo: b.professionalProfile?.licenseNo ?? null,
    accreditationNo: b.professionalProfile?.accreditationNo ?? null,
    city: b.professionalProfile?.city ?? null,
    yearsExp: b.professionalProfile?.yearsExp ?? null,
    specialties: b.professionalProfile?.specialties ?? [],
    verified: b.professionalProfile?.verified ?? false,
    featured: b.professionalProfile?.featured ?? false,
    online: isOnline(b.lastSeenAt),
    activeListingCount: b._count.properties,
    _score: presenceScore(b.lastSeenAt),
    _cityMatch: filters.city
      ? (b.professionalProfile?.city ?? "").toLowerCase() === filters.city.toLowerCase()
      : false,
  }));

  // Sort: city match > online > featured > verified > recent activity > listing count
  enriched.sort((a, b) => {
    if (a._cityMatch !== b._cityMatch) return a._cityMatch ? -1 : 1;
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a._score !== b._score) return b._score - a._score;
    return b.activeListingCount - a.activeListingCount;
  });

  let result = enriched;
  if (filters.onlineOnly) result = result.filter((b) => b.online);

  // Strip internal sort keys
  return result
    .slice(0, filters.limit ?? 8)
    .map(({ _score: _s, _cityMatch: _c, ...rest }) => rest);
}
