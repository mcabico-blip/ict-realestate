import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Plus, Eye, MessageSquare, ArrowLeft, ExternalLink } from "lucide-react";

export const metadata = { title: "My Listings | ICT Realtors" };

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  SOLD: "bg-blue-100 text-blue-700",
  RENTED: "bg-purple-100 text-purple-700",
  INACTIVE: "bg-gray-100 text-gray-500",
};

const listingBadge: Record<string, string> = {
  FOR_SALE: "bg-red-100 text-red-700",
  FOR_RENT: "bg-blue-100 text-blue-700",
  FOR_LEASE: "bg-purple-100 text-purple-700",
};

const listingLabel: Record<string, string> = {
  FOR_SALE: "For Sale",
  FOR_RENT: "For Rent",
  FOR_LEASE: "For Lease",
};

export default async function MyListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const userId = (session.user as { id: string }).id;

  const properties = await db.property.findMany({
    where: { ownerId: userId },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { inquiries: true, favorites: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500 text-sm mt-1">{properties.length} total listing{properties.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <Link
            href="/dashboard/listings/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> New Listing
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <p className="text-4xl mb-4">🏠</p>
          <p className="text-gray-600 font-medium">No listings yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-6">Properties you list will appear here</p>
          <Link
            href="/dashboard/listings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Create First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              {/* Thumbnail */}
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {p.images[0] ? (
                  <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🏠</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${listingBadge[p.listingType]}`}>
                    {listingLabel[p.listingType]}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                  {p.featured && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      Featured
                    </span>
                  )}
                </div>
                <p className="font-semibold text-sm text-gray-800 truncate">{p.title}</p>
                <p className="text-xs text-gray-400">{p.city}, {p.province}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {p.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> {p._count.inquiries}
                </span>
              </div>

              {/* Price */}
              <div className="shrink-0 text-right">
                <p className="font-bold text-red-600 text-sm">{formatPrice(Number(p.price))}</p>
                <p className="text-xs text-gray-400">
                  {new Date(p.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Actions */}
              <Link
                href={`/properties/${p.id}`}
                className="shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="View listing"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
