"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "FOR_SALE", label: "Buy" },
  { value: "FOR_RENT", label: "Rent" },
  { value: "FOR_LEASE", label: "Lease" },
];

const propertyTypes = [
  { value: "", label: "All Types" },
  { value: "HOUSE", label: "House" },
  { value: "CONDO", label: "Condo" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "LOT", label: "Lot" },
  { value: "COMMERCIAL", label: "Commercial" },
];

export function HeroSearch() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("FOR_SALE");
  const [keyword, setKeyword] = useState("");
  const [propertyType, setPropertyType] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    params.set("listing", activeTab);
    if (keyword) params.set("keyword", keyword);
    if (propertyType) params.set("type", propertyType);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              activeTab === tab.value
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search inputs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="City, province, or address..."
            className="pl-10 h-12 border-gray-200"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <select
          className="h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          {propertyTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <Button
          onClick={handleSearch}
          className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
      </div>

      {/* Quick links */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
        <span>Popular:</span>
        {["Makati", "BGC Taguig", "Cebu City", "Davao City", "Quezon City"].map((city) => (
          <button
            key={city}
            onClick={() => {
              router.push(`/properties?listing=${activeTab}&keyword=${encodeURIComponent(city)}`);
            }}
            className="hover:text-red-600 transition-colors underline-offset-2 hover:underline"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
