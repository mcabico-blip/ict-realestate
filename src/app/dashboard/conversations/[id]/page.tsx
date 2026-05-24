import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ChatPanel } from "@/components/chat/chat-panel";
import { getConversationParticipants, isParticipant } from "@/lib/chat";
import { ArrowLeft, MapPin } from "lucide-react";

export const metadata = { title: "Conversation | ICT Realtors" };

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const p = await getConversationParticipants(id);
  if (!p) notFound();
  if (!isParticipant(userId, p)) notFound();

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
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
    },
  });
  if (!conversation) notFound();

  const img = conversation.property.images[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/dashboard/conversations"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> All Messages
      </Link>

      {/* Property summary */}
      <Link
        href={`/properties/${conversation.property.id}`}
        className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 mb-4 hover:shadow-sm transition-shadow"
      >
        <div className="w-16 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
          {img ? (
            <Image src={img.url} alt={conversation.property.title} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {conversation.property.title}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {conversation.property.city}, {conversation.property.province}
          </p>
        </div>
        <p className="font-bold text-red-600 text-sm shrink-0">
          {formatPrice(Number(conversation.property.price))}
        </p>
      </Link>

      <ChatPanel conversationId={conversation.id} currentUserId={userId} />
    </div>
  );
}
