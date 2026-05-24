"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Loader2, CheckCircle2, X, ExternalLink } from "lucide-react";

type Lawyer = {
  id: string;
  name: string | null;
  lawFirm: string | null;
  ibpRollNo: string | null;
  ibpChapter: string | null;
  barYear: number | null;
  city: string | null;
  yearsExp: number | null;
  lawSpecialties: string[];
};

type Engagement = {
  id: string;
  status: string;
  lawyer: { name: string | null };
};

// Broker-side variant of the engage-lawyer flow. Lives on the inquiries inbox
// (one button per inquiry). Tags a lawyer to that buyer-property pair on the
// buyer's behalf — the buyer will see the engagement appear in their dashboard.
export function EngageLawyerForInquiry({
  inquiryId,
  propertyId,
  buyerId,
  buyerName,
  propertyTitle,
}: {
  inquiryId: string;
  propertyId: string;
  buyerId: string;
  buyerName: string | null;
  propertyTitle: string;
}) {
  const router = useRouter();
  const [existing, setExisting] = useState<Engagement | null>(null);
  const [checking, setChecking] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Check whether this buyer-property pair already has an engagement
  useEffect(() => {
    fetch(`/api/engagements?propertyId=${propertyId}&buyerId=${buyerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.engagement) setExisting(data.engagement);
      })
      .finally(() => setChecking(false));
  }, [propertyId, buyerId]);

  if (checking) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    );
  }

  if (existing) {
    return (
      <button
        onClick={() => router.push(`/dashboard/engagements/${existing.id}`)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
        Lawyer engaged ({existing.lawyer.name?.split(" ")[0] ?? "—"})
        <ExternalLink className="h-3 w-3" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
        title="Tag a lawyer to handle this deal's contract paperwork"
      >
        <Scale className="h-3.5 w-3.5" />
        Engage Lawyer
      </button>
      {modalOpen && (
        <LawyerPickerForBuyerModal
          propertyId={propertyId}
          buyerId={buyerId}
          buyerName={buyerName}
          propertyTitle={propertyTitle}
          onClose={() => setModalOpen(false)}
          onEngaged={(e) => {
            setExisting(e);
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function LawyerPickerForBuyerModal({
  propertyId,
  buyerId,
  buyerName,
  propertyTitle,
  onClose,
  onEngaged,
}: {
  propertyId: string;
  buyerId: string;
  buyerName: string | null;
  propertyTitle: string;
  onClose: () => void;
  onEngaged: (e: Engagement) => void;
}) {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/engagements/lawyers")
      .then((r) => r.json())
      .then((data) => setLawyers(data.lawyers ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleEngage() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/engagements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, lawyerId: selected, buyerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to engage lawyer");
      onEngaged(data.engagement);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-lg text-gray-900">
              Tag a Lawyer for {buyerName ?? "this buyer"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              For deal: <span className="font-medium">{propertyTitle}</span>
              <br />
              The buyer will see this engagement in their contracts dashboard.
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg shrink-0">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            </div>
          ) : lawyers.length === 0 ? (
            <p className="text-center py-12 text-sm text-gray-500">
              No lawyers are currently registered on the platform.
            </p>
          ) : (
            <div className="space-y-2">
              {lawyers.map((l) => (
                <label
                  key={l.id}
                  className={`block border rounded-xl p-3 cursor-pointer transition-colors ${
                    selected === l.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="lawyer"
                    value={l.id}
                    checked={selected === l.id}
                    onChange={(e) => setSelected(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{l.name}</p>
                      {l.lawFirm && <p className="text-xs text-gray-600">{l.lawFirm}</p>}
                      {l.ibpRollNo && (
                        <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                          IBP Roll No. {l.ibpRollNo}
                          {l.ibpChapter && ` · ${l.ibpChapter}`}
                        </p>
                      )}
                      {l.lawSpecialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {l.lawSpecialties.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {l.barYear && <p className="text-[11px] text-gray-500">Bar {l.barYear}</p>}
                      {l.yearsExp && (
                        <p className="text-[11px] text-gray-500">{l.yearsExp}+ yrs exp</p>
                      )}
                      {l.city && <p className="text-[11px] text-gray-400">{l.city}</p>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleEngage}
            disabled={!selected || submitting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Tag Lawyer
          </button>
        </div>
      </div>
    </div>
  );
}
