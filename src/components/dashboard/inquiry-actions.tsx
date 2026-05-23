"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Props {
  inquiryId: string;
  status: string;
}

export function InquiryActions({ inquiryId, status }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const update = async (newStatus: string) => {
    setLoading(newStatus);
    try {
      await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  if (status === "CLOSED") return null;

  return (
    <div className="flex items-center gap-2">
      {status === "OPEN" && (
        <button
          onClick={() => update("RESPONDED")}
          disabled={!!loading}
          className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading === "RESPONDED" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Mark Responded
        </button>
      )}
      <button
        onClick={() => update("CLOSED")}
        disabled={!!loading}
        className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {loading === "CLOSED" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        Close
      </button>
    </div>
  );
}
