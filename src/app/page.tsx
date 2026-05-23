import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { Building2, TrendingUp, Shield, Headphones, ChevronRight } from "lucide-react";

const stats = [
  { label: "Active Listings", value: "50,000+" },
  { label: "Cities Covered", value: "200+" },
  { label: "Registered Agents", value: "5,000+" },
  { label: "Happy Clients", value: "100,000+" },
];

const propertyCategories = [
  { type: "HOUSE", label: "House & Lot", icon: "🏠", listing: "FOR_SALE" },
  { type: "CONDO", label: "Condominium", icon: "🏢", listing: "FOR_SALE" },
  { type: "APARTMENT", label: "Apartment", icon: "🏬", listing: "FOR_RENT" },
  { type: "TOWNHOUSE", label: "Townhouse", icon: "🏘️", listing: "FOR_SALE" },
  { type: "LOT", label: "Lots & Land", icon: "📐", listing: "FOR_SALE" },
  { type: "COMMERCIAL", label: "Commercial", icon: "🏪", listing: "FOR_LEASE" },
  { type: "OFFICE", label: "Office Space", icon: "💼", listing: "FOR_LEASE" },
  { type: "WAREHOUSE", label: "Warehouse", icon: "🏭", listing: "FOR_LEASE" },
];

const popularLocations = [
  { city: "Makati", province: "Metro Manila", img: "https://images.unsplash.com/photo-1555990538-1a5bfe40b00b?w=400&q=80" },
  { city: "Taguig", province: "Metro Manila", img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80" },
  { city: "Cebu City", province: "Cebu", img: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400&q=80" },
  { city: "Davao City", province: "Davao del Sur", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
];

const features = [
  {
    icon: <Building2 className="h-7 w-7 text-red-600" />,
    title: "Extensive Listings",
    desc: "Browse thousands of verified properties across all regions of the Philippines.",
  },
  {
    icon: <Shield className="h-7 w-7 text-red-600" />,
    title: "Verified Properties",
    desc: "All listings go through our verification process to ensure authenticity.",
  },
  {
    icon: <TrendingUp className="h-7 w-7 text-red-600" />,
    title: "Market Insights",
    desc: "Get real-time market data, price trends, and investment analytics.",
  },
  {
    icon: <Headphones className="h-7 w-7 text-red-600" />,
    title: "Expert Support",
    desc: "Our team of licensed real estate professionals is here to guide you.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-[560px] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.35)), url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80')`,
        }}
      >
        <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
          <p className="text-red-400 font-semibold text-sm uppercase tracking-widest mb-3">
            🇵🇭 Philippines' Real Estate Marketplace
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Find Your Dream
            <br />
            <span className="text-red-400">Property in the Philippines</span>
          </h1>
          <p className="text-gray-200 text-lg mb-8 max-w-xl mx-auto">
            Buy, sell, or rent houses, condos, lots, and commercial spaces — from Luzon to Mindanao.
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* Stats */}
      <section className="bg-red-600 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-red-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Categories */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Browse by Property Type</h2>
          <p className="text-gray-500 mt-2">Explore properties that match your needs</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {propertyCategories.map((cat) => (
            <Link
              key={cat.type}
              href={`/properties?type=${cat.type}&listing=${cat.listing}`}
              className="group flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
            >
              <span className="text-4xl">{cat.icon}</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-red-600 transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Locations */}
      <section className="bg-gray-50 py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Popular Locations</h2>
              <p className="text-gray-500 mt-1">Most searched cities in the Philippines</p>
            </div>
            <Link href="/properties" className="text-red-600 text-sm font-semibold flex items-center gap-1 hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularLocations.map((loc) => (
              <Link
                key={loc.city}
                href={`/properties?city=${encodeURIComponent(loc.city)}`}
                className="group relative h-48 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
              >
                <img
                  src={loc.img}
                  alt={loc.city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="font-bold">{loc.city}</p>
                  <p className="text-xs text-gray-300">{loc.province}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose ICT Realtors?</h2>
          <p className="text-gray-500 mt-2">The platform built for Filipino property seekers</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="flex justify-center mb-4">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-red-600 to-red-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to List Your Property?
          </h2>
          <p className="text-red-200 text-lg mb-8 max-w-xl mx-auto">
            Reach thousands of buyers and renters across the Philippines. List for free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-red-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/agents"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
            >
              Find an Agent
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
