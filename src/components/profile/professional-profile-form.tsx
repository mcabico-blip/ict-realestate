"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { LAWYER_SPECIALTIES, BROKER_SPECIALTIES, REALTOR_BOARDS, IBP_CHAPTERS } from "@/lib/professionals";

type ProfileFields = {
  bio: string | null;
  yearsExp: number | null;
  city: string | null;
  province: string | null;
  licenseNo: string | null;
  prcIdNo: string | null;
  accreditationNo: string | null;
  supervisingBroker: string | null;
  realtorBoard: string | null;
  agency: string | null;
  specialties: string[];
  ibpRollNo: string | null;
  ibpChapter: string | null;
  lawFirm: string | null;
  barYear: number | null;
  lawSpecialties: string[];
};

export function ProfessionalProfileForm({
  role,
  initial,
}: {
  role: "BROKER" | "SALESPERSON" | "LAWYER";
  initial: Partial<ProfileFields> | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Partial<ProfileFields>>({
    bio: initial?.bio ?? "",
    yearsExp: initial?.yearsExp ?? null,
    city: initial?.city ?? "",
    province: initial?.province ?? "",
    licenseNo: initial?.licenseNo ?? "",
    prcIdNo: initial?.prcIdNo ?? "",
    accreditationNo: initial?.accreditationNo ?? "",
    supervisingBroker: initial?.supervisingBroker ?? "",
    realtorBoard: initial?.realtorBoard ?? "",
    agency: initial?.agency ?? "",
    specialties: initial?.specialties ?? [],
    ibpRollNo: initial?.ibpRollNo ?? "",
    ibpChapter: initial?.ibpChapter ?? "",
    lawFirm: initial?.lawFirm ?? "",
    barYear: initial?.barYear ?? null,
    lawSpecialties: initial?.lawSpecialties ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLawyer = role === "LAWYER";
  const isSalesperson = role === "SALESPERSON";
  const specialties = isLawyer ? LAWYER_SPECIALTIES : BROKER_SPECIALTIES;
  const selectedSpecialties = (isLawyer ? form.lawSpecialties : form.specialties) ?? [];
  const specialtiesKey = isLawyer ? "lawSpecialties" : "specialties";

  function set<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleSpecialty(s: string) {
    const next = selectedSpecialties.includes(s)
      ? selectedSpecialties.filter((x) => x !== s)
      : [...selectedSpecialties, s];
    set(specialtiesKey, next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/professional", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const Input = ({
    label,
    field,
    type = "text",
    placeholder,
    required,
  }: {
    label: string;
    field: keyof ProfileFields;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={(form[field] as string | number | null | undefined) ?? ""}
        onChange={(e) => set(field, (type === "number" ? Number(e.target.value) || null : e.target.value) as ProfileFields[typeof field])}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Bio</label>
        <textarea
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          placeholder="Brief intro about yourself, your areas of expertise…"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Years of Experience" field="yearsExp" type="number" placeholder="5" />
        <Input label="City" field="city" placeholder="Makati" />
      </div>
      <Input label="Province" field="province" placeholder="Metro Manila" />

      {isLawyer ? (
        // Lawyer fields
        <>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-purple-700 mb-3 uppercase tracking-wide">
              IBP Credentials
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="IBP Roll Number"
                field="ibpRollNo"
                placeholder="IBP-2015-056789"
                required
              />
              <Input label="Year Passed the Bar" field="barYear" type="number" placeholder="2015" />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">IBP Chapter</label>
              <select
                value={form.ibpChapter ?? ""}
                onChange={(e) => set("ibpChapter", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">— Select —</option>
                {IBP_CHAPTERS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <Input label="Law Firm" field="lawFirm" placeholder="Dela Cruz & Associates Law Office" />
            </div>
          </div>
        </>
      ) : (
        // Broker / Salesperson fields
        <>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wide">
              PRC Credentials
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={isSalesperson ? "RESA Accreditation No." : "PRC License No."}
                field={isSalesperson ? "accreditationNo" : "licenseNo"}
                placeholder={isSalesperson ? "ACCN-12345" : "PRC-REB-2019-001234"}
                required
              />
              <Input label="PRC ID No." field="prcIdNo" placeholder="0123456" />
            </div>
            {isSalesperson && (
              <div className="mt-3">
                <Input
                  label="Supervising Broker (name)"
                  field="supervisingBroker"
                  placeholder="Maria Santos, PRC-REB-2019-001234"
                  required
                />
              </div>
            )}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Realtor Board</label>
              <select
                value={form.realtorBoard ?? ""}
                onChange={(e) => set("realtorBoard", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">— Select —</option>
                {REALTOR_BOARDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <Input label="Agency / Brokerage" field="agency" placeholder="Santos Properties Group" />
            </div>
          </div>
        </>
      )}

      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          Specialties (pick all that apply)
        </p>
        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpecialty(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedSpecialties.includes(s)
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-4">
        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Profile saved.
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="ml-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Profile
        </button>
      </div>
    </form>
  );
}
