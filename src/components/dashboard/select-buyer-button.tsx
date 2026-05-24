"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Broker-side action: "Select this buyer" on an inquiry. Once selected:
 *   - property.selectedBuyerId is set
 *   - other inquiries on this property are closed
 *   - property.status moves to PENDING
 */
export function SelectBuyerButton({
  propertyId,
  buyerId,
  buyerName,
  isSelected,
}: {
  propertyId: string;
  buyerId: string;
  buyerName: string | null;
  isSelected: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSelect() {
    if (
      !confirm(
        `Select ${buyerName ?? "this buyer"} as the buyer for this property?\n\nThis closes all other inquiries and marks the property as PENDING. You can undo this later from the listing.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/select-buyer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to select buyer");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (isSelected) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Selected buyer
      </span>
    );
  }

  return (
    <button
      onClick={handleSelect}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      title="Select this buyer to move forward with the deal"
    >
      {busy && <Loader2 className="h-3 w-3 animate-spin" />}
      Select Buyer
    </button>
  );
}
