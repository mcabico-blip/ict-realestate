import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessageCircle, ArrowLeft, MapPin } from "lucide-react";

export const metadata = { title: "Messages | ICT Realtors" };

export default async function ConversationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  const userId = (session.user as { id: string }).id;

  // All conversations this user participates in (as buyer, broker, or lawyer)
  const ownedProps = await db.property.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  const lawyerEngs = await db.engagement.findMany({
    where: { lawyerId: userId },
    select: { buyerId: true, propertyId: true },
  });

  const conversations = await db.conversation.findMany({
    where: {
      OR: [
        { buyerId: userId },
        ...(ownedProps.length > 0
          ? [{ propertyId: { in: ownedProps.map((p) => p.id) } }]
          : []),
        ...lawyerEngs.map((e) => ({
          AND: [{ buyerId: e.buyerId }, { propertyId: e.propertyId }],
        })),
      ],
    },
    include: {
      buyer: { select: { id: true, name: true } },
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          province: true,
          owner: { select: { id: true, name: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, senderId: true, readBy: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Pre-compute unread for each
  const unreadByConv = new Map<string, number>();
  await Promise.all(
    conversations.map(async (c) => {
      const n = await db.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: userId },
          NOT: { readBy: { has: userId } },
        },
      });
      unreadByConv.set(c.id, n);
    })
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-red-500" />
            Messages
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <MessageCircle className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No conversations yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Send an inquiry on a property to start a conversation with the lister.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const isBuyer = c.buyerId === userId;
            const other = isBuyer ? c.property.owner : c.buyer;
            const last = c.messages[0];
            const unread = unreadByConv.get(c.id) ?? 0;
            const img = c.property.images[0];
            return (
              <Link
                key={c.id}
                href={`/dashboard/conversations/${c.id}`}
                className={`block bg-white rounded-xl border shadow-sm p-3 hover:shadow-md transition-shadow ${
                  unread > 0 ? "border-red-200 ring-1 ring-red-100" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                    {img ? (
                      <Image
                        src={img.url}
                        alt={c.property.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        🏠
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-800 truncate">
                        {other.name}
                      </p>
                      {last && (
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {new Date(last.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {c.property.title}
                    </p>
                    {last ? (
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          unread > 0 ? "text-gray-900 font-medium" : "text-gray-500"
                        }`}
                      >
                        {last.senderId === userId ? "You: " : ""}
                        {last.content}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-0.5">No messages yet</p>
                    )}
                  </div>
                  {unread > 0 && (
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full">
                      {unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
