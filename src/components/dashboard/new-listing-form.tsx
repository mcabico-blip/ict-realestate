"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AMENITIES, POPULAR_CITIES, PH_REGIONS } from "@/lib/utils";
import { cn } from "@/lib/utils";

const listingTypes = ["FOR_SALE", "FOR_RENT", "FOR_LEASE"];
const listingLabels: Record<string, string> = {
  FOR_SALE: "For Sale", FOR_RENT: "For Rent", FOR_LEASE: "For Lease",
};
const propertyTypes = [
  "HOUSE", "CONDO", "APARTMENT", "TOWNHOUSE", "LOT",
  "COMMERCIAL", "WAREHOUSE", "OFFICE", "FARM",
];
const propertyLabels: Record<string, string> = {
  HOUSE: "House & Lot", CONDO: "Condominium", APARTMENT: "Apartment",
  TOWNHOUSE: "Townhouse", LOT: "Lot", COMMERCIAL: "Commercial",
  WAREHOUSE: "Warehouse", OFFICE: "Office", FARM: "Farm",
};

const PH_PROVINCES = [
  "Metro Manila", "Cebu", "Davao del Sur", "Bulacan", "Cavite", "Laguna",
  "Rizal", "Pampanga", "Batangas", "Iloilo", "Negros Occidental", "Pangasinan",
  "Leyte", "Zamboanga del Sur", "Misamis Oriental", "Albay", "Bataan",
];

export function NewListingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    listingType: "FOR_SALE",
    propertyType: "HOUSE",
    price: "",
    negotiable: false,
    address: "",
    city: "",
    municipality: "",
    province: "Metro Manila",
    region: "NCR",
    zipCode: "",
    bedrooms: "",
    bathrooms: "",
    floorArea: "",
    lotArea: "",
    parkingSpaces: "",
    floors: "",
    yearBuilt: "",
    furnished: false,
    petFriendly: false,
    amenities: [] as string[],
  });

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAmenity(a: string) {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const payload = {
      ...form,
      price: parseFloat(form.price),
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      floorArea: form.floorArea ? parseFloat(form.floorArea) : null,
      lotArea: form.lotArea ? parseFloat(form.lotArea) : null,
      parkingSpaces: form.parkingSpaces ? parseInt(form.parkingSpaces) : null,
      floors: form.floors ? parseInt(form.floors) : null,
      yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : null,
    };

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/properties/${data.property.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create listing");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Steps */}
      <div className="flex border-b">
        {[
          { n: 1, label: "Basic Info" },
          { n: 2, label: "Location" },
          { n: 3, label: "Details" },
          { n: 4, label: "Amenities" },
        ].map((s) => (
          <button
            key={s.n}
            onClick={() => setStep(s.n)}
            className={cn(
              "flex-1 py-3.5 text-xs font-semibold border-b-2 transition-all",
              step === s.n
                ? "border-red-500 text-red-600 bg-red-50"
                : step > s.n
                ? "border-green-400 text-green-600"
                : "border-transparent text-gray-400"
            )}
          >
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-5">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {listingTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("listingType", t)}
                    className={cn(
                      "py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                      form.listingType === t ? "border-red-500 bg-red-50 text-red-600" : "border-gray-200 text-gray-600"
                    )}
                  >
                    {listingLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {propertyTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("propertyType", t)}
                    className={cn(
                      "py-2 rounded-xl border-2 text-xs font-medium transition-all",
                      form.propertyType === t ? "border-red-500 bg-red-50 text-red-600" : "border-gray-200 text-gray-600"
                    )}
                  >
                    {propertyLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing Title *</label>
              <Input
                placeholder="e.g. 3BR House for Sale in Quezon City near SM"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
              <textarea
                className="w-full h-32 rounded-xl border border-gray-200 p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Describe the property, its features, nearby establishments, etc."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (PHP) *</label>
              <Input
                type="number"
                placeholder="e.g. 5000000"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="negotiable"
                  checked={form.negotiable}
                  onChange={(e) => set("negotiable", e.target.checked)}
                  className="h-4 w-4 accent-red-600"
                />
                <label htmlFor="negotiable" className="text-sm text-gray-600">Price is negotiable</label>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
              <Input
                placeholder="e.g. 123 Rizal St., Barangay..."
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                <Input
                  placeholder="e.g. Quezon City"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Municipality</label>
                <Input
                  placeholder="Optional"
                  value={form.municipality}
                  onChange={(e) => set("municipality", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Province *</label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={form.province}
                  onChange={(e) => set("province", e.target.value)}
                >
                  {PH_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Region *</label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                >
                  {PH_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP Code</label>
              <Input
                placeholder="e.g. 1100"
                value={form.zipCode}
                onChange={(e) => set("zipCode", e.target.value)}
                maxLength={10}
              />
            </div>
          </>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bedrooms</label>
                <Input type="number" min="0" placeholder="e.g. 3" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bathrooms</label>
                <Input type="number" min="0" placeholder="e.g. 2" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Floor Area (sqm)</label>
                <Input type="number" min="0" placeholder="e.g. 120" value={form.floorArea} onChange={(e) => set("floorArea", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lot Area (sqm)</label>
                <Input type="number" min="0" placeholder="e.g. 250" value={form.lotArea} onChange={(e) => set("lotArea", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Parking Slots</label>
                <Input type="number" min="0" placeholder="0" value={form.parkingSpaces} onChange={(e) => set("parkingSpaces", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Floors</label>
                <Input type="number" min="1" placeholder="e.g. 2" value={form.floors} onChange={(e) => set("floors", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Year Built</label>
                <Input type="number" min="1900" max={new Date().getFullYear()} placeholder="e.g. 2020" value={form.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.furnished} onChange={(e) => set("furnished", e.target.checked)} className="h-4 w-4 accent-red-600" />
                <span className="text-sm text-gray-700">Furnished</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.petFriendly} onChange={(e) => set("petFriendly", e.target.checked)} className="h-4 w-4 accent-red-600" />
                <span className="text-sm text-gray-700">Pet Friendly</span>
              </label>
            </div>
          </>
        )}

        {/* Step 4: Amenities */}
        {step === 4 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Amenities ({form.amenities.length} selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES.map((a) => (
                  <label key={a} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.amenities.includes(a)}
                      onChange={() => toggleAmenity(a)}
                      className="h-4 w-4 accent-red-600"
                    />
                    <span className="text-xs text-gray-700">{a}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 pb-6 gap-3">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          Back
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={
              (step === 1 && (!form.title || !form.price || !form.description)) ||
              (step === 2 && (!form.address || !form.city || !form.province))
            }
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Publishing..." : "Publish Listing"}
          </Button>
        )}
      </div>
    </div>
  );
}
