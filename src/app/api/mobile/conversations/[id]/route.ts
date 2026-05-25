import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { getConversationParticipants, isParticipant } from "@/lib/chat";
import { touchPresence, isOnline } from "@/lib/presence";

// GET /api/mobile/conversations/[id] — full thread (auth required)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(session.id);

  const { id } = await params;
  const p = await getConversationParticipants(id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isParticipant(session.id, p)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [convo, messages, participantUsers] = await Promise.all([
    db.conversation.findUnique({
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
    }),
    db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, role: true } } },
    }),
    db.user.findMany({
      where: { id: { in: [p.buyerId, p.brokerId, ...(p.lawyerId ? [p.lawyerId] : [])] } },
      select: { id: true, name: true, role: true, lastSeenAt: true },
    }),
  ]);

  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark unread as read
  const unreadIds = messages
    .filter((m) => m.senderId !== session.id && !m.readBy.includes(session.id))
    .map((m) => m.id);
  if (unreadIds.length > 0) {
    await Promise.all(
      unreadIds.map((mid) =>
        db.message.update({ where: { id: mid }, data: { readBy: { push: session.id } } })
      )
    );
  }

  const byId = new Map(participantUsers.map((u) => [u.id, u]));
  const part = (id: string | null) => {
    if (!id) return null;
    const u = byId.get(id);
    if (!u) return null;
    return { id: u.id, name: u.name, role: u.role, online: isOnline(u.lastSeenAt) };
  };

  return NextResponse.json({
    conversation: {
      id: convo.id,
      property: {
        id: convo.property.id,
        title: convo.property.title,
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
