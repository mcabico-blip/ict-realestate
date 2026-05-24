"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Scale, Loader2, CheckCircle2, X } from "lucide-react";

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
  online: boolean;
};

type Engagement = {
  id: string;
  status: string;
  lawyer: { name: string | null };
};

export function EngageLawyerCard({ propertyId }: { propertyId: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [existing, setExisting] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Check if buyer already has an engagement on this property
  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch(`/api/engagements?propertyId=${propertyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.engagement) setExisting(data.engagement);
      })
      .finally(() => setLoading(false));
  }, [propertyId, sessionStatus]);

  // Hide for unauthenticated users — engagement is a logged-in action
  if (sessionStatus !== "authenticated") {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-purple-800 mb-1 flex items-center gap-2">
          <Scale className="h-4 w-4" /> Engaging a Lawyer
        </p>
        <p className="text-xs text-purple-600">
          Once you sign in and inquire on this property, you can engage a lawyer to handle
          your contract documents (Deed of Sale, Title Transfer, etc.).
        </p>
      </div>
    );
  }

  // Hide for property owners/brokers/lawyers — only buyers engage
  const role = (session?.user as { role?: string })?.role;
  if (role === "BROKER" || role === "SALESPERSON" || role === "LAWYER" || role === "ADMIN") {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
        <Loader2 className="h-4 w-4 animate-spin text-purple-600 mx-auto" />
      </div>
    );
  }

  // Already engaged — show status link to dashboard
  if (existing) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-purple-800 mb-1 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Lawyer Engaged
        </p>
        <p className="text-xs text-purple-700 mb-3">
          {existing.lawyer.name} is handling your contract for this property.
        </p>
        <button
          onClick={() => router.push(`/dashboard/engagements/${existing.id}`)}
          className="w-full text-center py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          View Contract Workspace →
        </button>
      </div>
    );
  }

  // Not yet engaged — open the lawyer picker modal
  return (
    <>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-purple-800 mb-1 flex items-center gap-2">
          <Scale className="h-4 w-4" /> Ready to Move Forward?
        </p>
        <p className="text-xs text-purple-700 mb-3">
          Engage a lawyer to handle title transfer, deed drafting, and other contract paperwork
          for this property.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="w-full text-center py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Engage a Lawyer →
        </button>
      </div>
      {modalOpen && (
        <LawyerPickerModal
          propertyId={propertyId}
          onClose={() => setModalOpen(false)}
          onEngaged={(e) => {
            setExisting(e);
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function LawyerPickerModal({
  propertyId,
  onClose,
  onEngaged,
}: {
  propertyId: string;
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
        body: JSON.stringify({ propertyId, lawyerId: selected }),
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Choose Your Lawyer</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select an IBP-registered lawyer to manage your contract documents.
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{l.name}</p>
                        {l.online && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Online
                          </span>
                        )}
                      </div>
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
            Engage Lawyer
          </button>
        </div>
      </div>
    </div>
  );
}
