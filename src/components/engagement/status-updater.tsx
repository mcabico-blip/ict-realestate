"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const STATUSES = [
  "NEW",
  "IN_REVIEW",
  "AWAITING_DOCUMENTS",
  "DRAFTING",
  "PENDING_SIGNATURES",
  "NOTARIZED",
  "TITLE_TRANSFER",
  "COMPLETED",
  "CANCELLED",
] as const;

const labels: Record<string, string> = {
  NEW: "New",
  IN_REVIEW: "In Review",
  AWAITING_DOCUMENTS: "Awaiting Docs",
  DRAFTING: "Drafting",
  PENDING_SIGNATURES: "Awaiting Signatures",
  NOTARIZED: "Notarized",
  TITLE_TRANSFER: "Title Transfer",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function StatusUpdater({
  engagementId,
  currentStatus,
}: {
  engagementId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    const prev = status;
    setStatus(newStatus);
    setSaving(true);
    try {
      const res = await fetch(`/api/engagements/${engagementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setStatus(prev);
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to update status");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {labels[s]}
          </option>
        ))}
      </select>
      {saving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
    </div>
  );
}
