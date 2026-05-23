"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PropertyFiltersProps {
  searchParams: Record<string, string | undefined>;
}

const listingTypes = [
  { value: "", label: "All" },
  { value: "FOR_SALE", label: "For Sale" },
  { value: "FOR_RENT", label: "For Rent" },
  { value: "FOR_LEASE", label: "For Lease" },
];

const propertyTypes = [
  { value: "", label: "All Types" },
  { value: "HOUSE", label: "House & Lot" },
  { value: "CONDO", label: "Condominium" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "LOT", label: "Lot" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "OFFICE", label: "Office" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "FARM", label: "Farm" },
];

const bedroomOptions = ["1", "2", "3", "4", "5+"];
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "oldest", label: "Oldest First" },
];

export function PropertyFilters({ searchParams }: PropertyFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [filters, setFilters] = useState({
    listing: searchParams.listing ?? "",
    type: searchParams.type ?? "",
    keyword: searchParams.keyword ?? "",
    city: searchParams.city ?? "",
    minPrice: searchParams.minPrice ?? "",
    maxPrice: searchParams.maxPrice ?? "",
    bedrooms: searchParams.bedrooms ?? "",
    bathrooms: searchParams.bathrooms ?? "",
    furnished: searchParams.furnished ?? "",
    sortBy: searchParams.sortBy ?? "newest",
  });

  function applyFilters() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setFilters({
      listing: "", type: "", keyword: "", city: "",
      minPrice: "", maxPrice: "", bedrooms: "", bathrooms: "",
      furnished: "", sortBy: "newest",
    });
    router.push(pathname);
  }

  function set(field: string, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="lg:hidden w-full flex items-center justify-between p-4 font-semibold text-gray-800"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <div className={cn("p-5 space-y-5", !open && "hidden lg:block")}>
        <div className="hidden lg:flex items-center gap-2 font-semibold text-gray-800 pb-2 border-b">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>

        {/* Listing Type */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Listing Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {listingTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => set("listing", t.value)}
                className={cn(
                  "py-1.5 text-xs font-medium rounded-lg border transition-all",
                  filters.listing === t.value
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Property Type
          </label>
          <select
            className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filters.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {propertyTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            City / Location
          </label>
          <Input
            placeholder="e.g. Makati, Cebu"
            value={filters.city}
            onChange={(e) => set("city", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Price Range (PHP)
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Min"
              type="number"
              value={filters.minPrice}
              onChange={(e) => set("minPrice", e.target.value)}
              className="h-9 text-sm"
            />
            <Input
              placeholder="Max"
              type="number"
              value={filters.maxPrice}
              onChange={(e) => set("maxPrice", e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Bedrooms
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => set("bedrooms", "")}
              className={cn(
                "flex-1 py-1 text-xs font-medium rounded-lg border transition-all",
                !filters.bedrooms ? "border-red-500 bg-red-50 text-red-600" : "border-gray-200 text-gray-600"
              )}
            >
              Any
            </button>
            {bedroomOptions.map((n) => (
              <button
                key={n}
                onClick={() => set("bedrooms", n.replace("+", ""))}
                className={cn(
                  "flex-1 py-1 text-xs font-medium rounded-lg border transition-all",
                  filters.bedrooms === n.replace("+", "")
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-600"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Furnished */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="furnished"
            checked={filters.furnished === "true"}
            onChange={(e) => set("furnished", e.target.checked ? "true" : "")}
            className="h-4 w-4 accent-red-600"
          />
          <label htmlFor="furnished" className="text-sm text-gray-700">Furnished only</label>
        </div>

        {/* Sort */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Sort By
          </label>
          <select
            className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filters.sortBy}
            onChange={(e) => set("sortBy", e.target.value)}
          >
            {sortOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={applyFilters} className="w-full bg-red-600 hover:bg-red-700 text-white">
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline" className="w-full text-sm">
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
