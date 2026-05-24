"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Compact "Mark as SOLD / RENTED" action for the broker's My Listings page.
 * Closes all outstanding inquiries when triggered.
 */
export function PropertyStatusActions({
  propertyId,
  currentStatus,
  listingType,
}: {
  propertyId: string;
  currentStatus: string;
  listingType: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const finalStatus =
    listingType === "FOR_RENT" || listingType === "FOR_LEASE" ? "RENTED" : "SOLD";

  async function setStatus(s: string) {
    const label =
      s === "SOLD"
        ? "Mark as SOLD?"
        : s === "RENTED"
        ? "Mark as RENTED?"
        : `Move back to ACTIVE?`;
    if (!confirm(`${label}\n\nAll outstanding inquiries on this listing will be closed.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (currentStatus === "SOLD" || currentStatus === "RENTED") {
    return (
      <button
        onClick={() => setStatus("ACTIVE")}
        disabled={busy}
        className="text-[11px] font-semibold text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
      >
        {busy ? "…" : "Reopen"}
      </button>
    );
  }

  return (
    <button
      onClick={() => setStatus(finalStatus)}
      disabled={busy}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
    >
      {busy && <Loader2 className="h-3 w-3 animate-spin" />}
      Mark {finalStatus === "SOLD" ? "Sold" : "Rented"}
    </button>
  );
}
