import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { getConversationParticipants, isParticipant } from "@/lib/chat";
import { touchPresence, isOnline } from "@/lib/presence";

async function getUser(req: NextRequest) {
  const web = await getServerSession(authOptions);
  if (web?.user) return { id: (web.user as { id: string }).id };
  const mobile = await getMobileSession(req);
  return mobile ? { id: mobile.id } : null;
}

// GET /api/conversations/[id] — full conversation detail (messages + participants)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(user.id);

  const { id } = await params;
  const p = await getConversationParticipants(id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isParticipant(user.id, p)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [convo, messages, participantUsers] = await Promise.all([
    db.conversation.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            province: true,
            price: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, role: true } } },
    }),
    db.user.findMany({
      where: { id: { in: [p.buyerId, p.brokerId, ...(p.lawyerId ? [p.lawyerId] : [])] } },
      select: { id: true, name: true, email: true, role: true, lastSeenAt: true },
    }),
  ]);

  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-mark messages as read for this user (one DB call)
  const unreadIds = messages
    .filter((m) => m.senderId !== user.id && !m.readBy.includes(user.id))
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await Promise.all(
      unreadIds.map((mid) =>
        db.message.update({
          where: { id: mid },
          data: { readBy: { push: user.id } },
        })
      )
    );
  }

  const byId = new Map(participantUsers.map((u) => [u.id, u]));
  const part = (id: string | null) => {
    if (!id) return null;
    const u = byId.get(id);
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      online: isOnline(u.lastSeenAt),
    };
  };

  return NextResponse.json({
    conversation: {
      id: convo.id,
      property: {
        id: convo.property.id,
        title: convo.property.title,
        address: convo.property.address,
        city: convo.property.city,
        province: convo.property.province,
        price: Number(convo.property.price),
        imageUrl: convo.property.images[0]?.url ?? null,
      },
      participants: {
        buyer: part(p.buyerId),
        broker: part(p.brokerId),
        lawyer: part(p.lawyerId),
      },
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.sender.name,
        senderRole: m.sender.role,
        content: m.content,
        readBy: m.readBy,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
}
