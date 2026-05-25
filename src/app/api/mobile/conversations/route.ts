import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { ensureConversation } from "@/lib/chat";
import { touchPresence } from "@/lib/presence";

const createSchema = z.object({ propertyId: z.string().min(1) });

// POST /api/mobile/conversations — start (or fetch existing) chat thread
export async function POST(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(session.id);

  let body;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const property = await db.property.findUnique({
    where: { id: body.propertyId },
    select: { id: true, ownerId: true },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.ownerId === session.id) {
    return NextResponse.json(
      { error: "You can't start a chat with yourself about your own listing." },
      { status: 400 }
    );
  }

  const c = await ensureConversation(session.id, body.propertyId);
  return NextResponse.json({ conversation: { id: c.id, propertyId: c.propertyId } });
}

// GET /api/mobile/conversations — list this user's conversations
export async function GET(req: NextRequest) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(session.id);

  const ownedIds = (
    await db.property.findMany({ where: { ownerId: session.id }, select: { id: true } })
  ).map((p) => p.id);
  const lawyerEngs = await db.engagement.findMany({
    where: { lawyerId: session.id },
    select: { buyerId: true, propertyId: true },
  });

  const orClauses: Array<Record<string, unknown>> = [{ buyerId: session.id }];
  if (ownedIds.length > 0) {
    orClauses.push({ propertyId: { in: ownedIds } });
  }
  for (const e of lawyerEngs) {
    orClauses.push({ AND: [{ buyerId: e.buyerId }, { propertyId: e.propertyId }] });
  }

  const conversations = await db.conversation.findMany({
    where: { OR: orClauses },
    include: {
      buyer: { select: { id: true, name: true } },
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          ownerId: true,
          owner: { select: { id: true, name: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, senderId: true, readBy: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const decorated = await Promise.all(
    conversations.map(async (c) => {
      const unread = await db.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: session.id },
          NOT: { readBy: { has: session.id } },
        },
      });
      return {
        id: c.id,
        propertyId: c.propertyId,
        propertyTitle: c.property.title,
        propertyCity: c.property.city,
        propertyImageUrl: c.property.images[0]?.url ?? null,
        otherName:
          c.buyerId === session.id ? c.property.owner.name : c.buyer.name,
        lastMessage: c.messages[0]
          ? {
              content: c.messages[0].content,
              senderId: c.messages[0].senderId,
              createdAt: c.messages[0].createdAt.toISOString(),
            }
          : null,
        unread,
        updatedAt: c.updatedAt.toISOString(),
      };
    })
  );

  return NextResponse.json({ conversations: decorated });
}
