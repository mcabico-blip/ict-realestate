import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, FileText, MapPin, Scale } from "lucide-react";

export const metadata = { title: "Contracts | ICT Realtors" };

const statusLabel: Record<string, string> = {
  NEW: "New",
  IN_REVIEW: "In Review",
  AWAITING_DOCUMENTS: "Awaiting Docs",
  DRAFTING: "Drafting",
  PENDING_SIGNATURES: "Awaiting Signatures",
  NOTARIZED: "Notarized",
  TITLE_TRANSFER: "Title Transfer",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusColors: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  AWAITING_DOCUMENTS: "bg-amber-100 text-amber-700",
  DRAFTING: "bg-indigo-100 text-indigo-700",
  PENDING_SIGNATURES: "bg-purple-100 text-purple-700",
  NOTARIZED: "bg-cyan-100 text-cyan-700",
  TITLE_TRANSFER: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function EngagementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const isLawyer = role === "LAWYER";

  const engagements = await db.engagement.findMany({
    where: isLawyer ? { lawyerId: userId } : { buyerId: userId },
    include: {
      buyer: { select: { name: true, email: true } },
      lawyer: { select: { name: true } },
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          province: true,
          price: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      _count: { select: { documents: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const pageTitle = isLawyer ? "Assigned Contracts" : "My Contracts";
  const subtitle = isLawyer
    ? `${engagements.length} engagement${engagements.length !== 1 ? "s" : ""} assigned to you`
    : `${engagements.length} active contract${engagements.length !== 1 ? "s" : ""}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="h-6 w-6 text-purple-600" />
            {pageTitle}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
      </div>

      {engagements.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <Scale className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {isLawyer ? "No contracts assigned yet" : "No active contracts"}
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-6">
            {isLawyer
              ? "When a buyer engages you on a property, it will appear here."
              : "When you engage a lawyer on a property, your contract workspace appears here."}
          </p>
          {!isLawyer && (
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Browse Properties
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {engagements.map((e) => {
            const img = e.property.images[0];
            return (
              <Link
                key={e.id}
                href={`/dashboard/engagements/${e.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                    {img ? (
                      <Image
                        src={img.url}
                        alt={e.property.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                        🏠
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          statusColors[e.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabel[e.status]}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {e._count.documents} doc{e._count.documents !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {e.property.title}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {e.property.city}, {e.property.province}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {isLawyer ? `Buyer: ${e.buyer.name}` : `Lawyer: ${e.lawyer.name}`}
                    </p>
                  </div>
                  {/* Price */}
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-red-600 text-sm">
                      {formatPrice(Number(e.property.price))}
                    </p>
                    <p className="text-xs text-gray-400">
                      Updated{" "}
                      {new Date(e.updatedAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
