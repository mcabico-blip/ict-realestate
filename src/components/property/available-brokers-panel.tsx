"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, MessageCircle, Loader2 } from "lucide-react";

type Broker = {
  id: string;
  name: string | null;
  role: string;
  agency: string | null;
  licenseNo: string | null;
  accreditationNo: string | null;
  city: string | null;
  yearsExp: number | null;
  specialties: string[];
  verified: boolean;
  online: boolean;
  activeListingCount: number;
};

/**
 * Show "Other available brokers" when the listing's own broker hasn't been
 * online in a while. Lets the buyer reach out to someone who can actually
 * respond now rather than waiting indefinitely.
 *
 * Hidden when the listing's broker IS online.
 */
export function AvailableBrokersPanel({
  excludeId,
  city,
  listingBrokerOnline,
}: {
  excludeId: string;
  city?: string;
  listingBrokerOnline: boolean;
}) {
  const [brokers, setBrokers] = useState<Broker[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Only fetch when we actually need fallback suggestions
  useEffect(() => {
    if (listingBrokerOnline) return;
    setLoading(true);
    const qs = new URLSearchParams({ excludeId, limit: "4" });
    if (city) qs.set("city", city);
    fetch(`/api/brokers/available?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => setBrokers(data.brokers ?? []))
      .finally(() => setLoading(false));
  }, [excludeId, city, listingBrokerOnline]);

  if (listingBrokerOnline) return null;
  if (loading) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <Loader2 className="h-4 w-4 animate-spin text-amber-700 mx-auto" />
      </div>
    );
  }
  if (!brokers || brokers.length === 0) return null;

  // Prefer online brokers at the top of the list (already sorted server-side)
  const onlineBrokers = brokers.filter((b) => b.online);
  const offlineBrokers = brokers.filter((b) => !b.online);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-amber-700" />
        <p className="text-sm font-semibold text-amber-900">
          Listing agent is offline
        </p>
      </div>
      <p className="text-xs text-amber-800 mb-3">
        {onlineBrokers.length > 0
          ? `${onlineBrokers.length} broker${onlineBrokers.length === 1 ? " is" : "s are"} online now and can help you${city ? ` in ${city}` : ""}.`
          : "Here are recently active brokers who can help you when the listing agent isn't around."}
      </p>
      <div className="space-y-2">
        {[...onlineBrokers, ...offlineBrokers].slice(0, 3).map((b) => (
          <Link
            key={b.id}
            href={`/professionals/${b.id}`}
            className="flex items-center gap-3 p-2.5 bg-white border border-amber-100 rounded-lg hover:border-amber-300 transition-colors"
          >
            <div className="relative w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
              {b.name?.[0]?.toUpperCase() ?? "?"}
              {b.online && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-xs text-gray-900">{b.name}</p>
                {b.online && (
                  <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                    ONLINE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 truncate">
                {b.agency ?? (b.role === "BROKER" ? "Licensed Broker" : "Salesperson")}
                {b.city ? ` · ${b.city}` : ""}
              </p>
            </div>
            <MessageCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
