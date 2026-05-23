import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProfessionalCard } from "@/components/professionals/professional-card";
import { Briefcase, Scale, Award, Search, BadgeCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Find Professionals | ICT Realtors",
  description: "Connect with licensed real estate brokers, salespersons, and lawyers in the Philippines.",
};

const typeFilters = [
  { value: "", label: "All Professionals", icon: <Search className="h-4 w-4" /> },
  { value: "BROKER", label: "Brokers", icon: <Briefcase className="h-4 w-4" /> },
  { value: "SALESPERSON", label: "Salespersons", icon: <Award className="h-4 w-4" /> },
  { value: "LAWYER", label: "Lawyers", icon: <Scale className="h-4 w-4" /> },
];

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const type = sp.type;
  const city = sp.city;
  const keyword = sp.keyword;

  type ProfResult = Awaited<ReturnType<typeof db.professionalProfile.findMany<{ include: { user: { select: { name: true; email: true; phone: true } } } }>>>;
  let professionals: ProfResult = [];
  let brokerCount = 0, salespersonCount = 0, lawyerCount = 0;

  try {
    professionals = await db.professionalProfile.findMany({
    where: {
      verified: true,
      ...(type ? { professionalType: type as "BROKER" | "SALESPERSON" | "LAWYER" } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(keyword
        ? {
            OR: [
              { user: { name: { contains: keyword, mode: "insensitive" } } },
              { agency: { contains: keyword, mode: "insensitive" } },
              { lawFirm: { contains: keyword, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });

    [brokerCount, salespersonCount, lawyerCount] = await Promise.all([
      db.professionalProfile.count({ where: { professionalType: "BROKER", verified: true } }),
      db.professionalProfile.count({ where: { professionalType: "SALESPERSON", verified: true } }),
      db.professionalProfile.count({ where: { professionalType: "LAWYER", verified: true } }),
    ]);
  } catch {
    // DB not yet migrated or unavailable — show empty state
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-14 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Find Real Estate Professionals
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Connect with PRC-licensed brokers, accredited salespersons, and IBP-registered lawyers across the Philippines.
          </p>

          {/* Search */}
          <form method="GET" className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              name="keyword"
              defaultValue={keyword}
              placeholder="Search by name, agency, or law firm..."
              className="flex-1 h-12 rounded-xl border border-gray-600 bg-gray-800 text-white placeholder-gray-400 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              name="city"
              defaultValue={city}
              placeholder="City (e.g. Makati)"
              className="w-full sm:w-44 h-12 rounded-xl border border-gray-600 bg-gray-800 text-white placeholder-gray-400 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {type && <input type="hidden" name="type" value={type} />}
            <button
              type="submit"
              className="h-12 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2">
            {[
              { value: "", label: "All", count: brokerCount + salespersonCount + lawyerCount },
              { value: "BROKER", label: "Brokers", count: brokerCount },
              { value: "SALESPERSON", label: "Salespersons", count: salespersonCount },
              { value: "LAWYER", label: "Lawyers", count: lawyerCount },
            ].map((f) => (
              <Link
                key={f.value}
                href={`/professionals${f.value ? `?type=${f.value}` : ""}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  (type ?? "") === f.value
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {f.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Role explanations */}
        {!type && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: <Briefcase className="h-6 w-6 text-blue-600" />,
                bg: "bg-blue-50 border-blue-100",
                title: "Real Estate Brokers",
                desc: "PRC-licensed professionals authorized to negotiate and transact real estate. They supervise salespersons and handle the full transaction.",
                cta: "Find a Broker",
                link: "/professionals?type=BROKER",
              },
              {
                icon: <Award className="h-6 w-6 text-green-600" />,
                bg: "bg-green-50 border-green-100",
                title: "Licensed Salespersons",
                desc: "RESA-accredited salespersons working under a supervising broker. They assist buyers and sellers in finding and marketing properties.",
                cta: "Find a Salesperson",
                link: "/professionals?type=SALESPERSON",
              },
              {
                icon: <Scale className="h-6 w-6 text-purple-600" />,
                bg: "bg-purple-50 border-purple-100",
                title: "Real Estate Lawyers",
                desc: "IBP-registered attorneys handling title transfers, Deeds of Sale, due diligence, ejectment, foreclosure, and all legal aspects of real estate.",
                cta: "Find a Lawyer",
                link: "/professionals?type=LAWYER",
              },
            ].map((card) => (
              <div key={card.title} className={`rounded-xl border p-5 ${card.bg}`}>
                <div className="flex items-center gap-3 mb-3">
                  {card.icon}
                  <h3 className="font-bold text-gray-900">{card.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{card.desc}</p>
                <Link
                  href={card.link}
                  className="text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors"
                >
                  {card.cta} →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{professionals.length}</span> professionals found
          </p>
          <Link
            href="/auth/register?role=professional"
            className="text-sm text-red-600 font-semibold hover:underline"
          >
            + Join as a Professional
          </Link>
        </div>

        {professionals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-4xl mb-3">👔</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No professionals found</h3>
            <p className="text-gray-400 text-sm">Try broadening your search or removing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {professionals.map((p) => (
              <ProfessionalCard
                key={p.id}
                professional={p}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
