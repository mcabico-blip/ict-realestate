import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Building2, Plus, MessageSquare, Heart, Eye, Scale, MessageCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;
  const isLawyer = role === "LAWYER";

  const [properties, inquiries, favorites, engagementCount, unreadMessages] = await Promise.all([
    db.property.findMany({
      where: { ownerId: userId },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { inquiries: true, favorites: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.inquiry.findMany({
      where: { buyerId: userId },
      include: { property: { select: { title: true, id: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.favorite.count({ where: { userId } }),
    db.engagement.count({
      where: isLawyer ? { lawyerId: userId } : { buyerId: userId },
    }),
    // Unread messages — messages in any conversation user participates in,
    // not from this user, where this user isn't in readBy.
    (async () => {
      const ownedIds = (
        await db.property.findMany({ where: { ownerId: userId }, select: { id: true } })
      ).map((p) => p.id);
      const lawyerEngs = await db.engagement.findMany({
        where: { lawyerId: userId },
        select: { buyerId: true, propertyId: true },
      });
      const conversationIds = (
        await db.conversation.findMany({
          where: {
            OR: [
              { buyerId: userId },
              ...(ownedIds.length > 0 ? [{ propertyId: { in: ownedIds } }] : []),
              ...lawyerEngs.map((e) => ({
                AND: [{ buyerId: e.buyerId }, { propertyId: e.propertyId }],
              })),
            ],
          },
          select: { id: true },
        })
      ).map((c) => c.id);
      if (conversationIds.length === 0) return 0;
      return await db.message.count({
        where: {
          conversationId: { in: conversationIds },
          senderId: { not: userId },
          NOT: { readBy: { has: userId } },
        },
      });
    })(),
  ]);

  const totalViews = properties.reduce((acc, p) => acc + p.viewCount, 0);
  const totalInquiries = properties.reduce((acc, p) => acc + p._count.inquiries, 0);

  // Friendly first name — strip "Atty." prefix for lawyers
  const firstName = (() => {
    const parts = session.user.name?.split(" ") ?? [];
    return parts[0]?.replace(/\.$/, "") === "Atty" ? parts[1] : parts[0];
  })();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}!</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLawyer ? "Manage your assigned contracts" : "Manage your listings and inquiries"}
          </p>
        </div>
        {!isLawyer && (
          <Link
            href="/dashboard/listings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Listing
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          isLawyer
            ? { label: "Assigned Contracts", value: engagementCount, icon: <Scale className="h-5 w-5 text-purple-500" />, href: "/dashboard/engagements" }
            : { label: "My Listings", value: properties.length, icon: <Building2 className="h-5 w-5 text-red-500" />, href: null },
          { label: unreadMessages > 0 ? `Unread Messages` : "Messages", value: unreadMessages, icon: <MessageCircle className="h-5 w-5 text-red-500" />, href: "/dashboard/conversations" },
          { label: "Inquiries Received", value: totalInquiries, icon: <MessageSquare className="h-5 w-5 text-green-500" />, href: "/dashboard/inquiries" },
          isLawyer
            ? { label: "Saved Properties", value: favorites, icon: <Heart className="h-5 w-5 text-pink-500" />, href: "/dashboard/favorites" }
            : { label: "My Contracts", value: engagementCount, icon: <Scale className="h-5 w-5 text-purple-500" />, href: "/dashboard/engagements" },
        ].map((stat) => {
          const inner = (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{stat.label}</span>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-green-200 hover:shadow-md transition-all">
              {inner}
            </Link>
          ) : (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              {inner}
            </div>
          );
        })}
      </div>

      {/* My Listings — hidden for lawyers since they don't list properties */}
      {!isLawyer && (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">My Listings</h2>
          <Link href="/dashboard/listings" className="text-sm text-red-600 hover:underline">
            View all
          </Link>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">You haven't listed any properties yet</p>
            <Link
              href="/dashboard/listings/new"
              className="inline-flex items-center gap-1 text-sm text-red-600 font-medium hover:underline"
            >
              <Plus className="h-4 w-4" />
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {p.images[0] && (
                    <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/properties/${p.id}`} className="font-medium text-sm text-gray-800 hover:text-red-600 truncate block">
                    {p.title}
                  </Link>
                  <p className="text-xs text-gray-400">{p._count.inquiries} inquiries · {p.viewCount} views</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-red-600">{formatPrice(Number(p.price))}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Recent Inquiries Sent */}
      {inquiries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">My Inquiries</h2>
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <div key={inq.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <Link href={`/properties/${inq.property.id}`} className="text-sm font-medium text-gray-800 hover:text-red-600">
                    {inq.property.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{inq.message}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  inq.status === "RESPONDED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {inq.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
