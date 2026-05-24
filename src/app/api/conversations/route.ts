import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { ensureConversation } from "@/lib/chat";
import { touchPresence } from "@/lib/presence";

const createSchema = z.object({
  propertyId: z.string().min(1),
});

async function getUser(req: NextRequest) {
  const web = await getServerSession(authOptions);
  if (web?.user) {
    const u = web.user as { id: string; role?: string };
    return { id: u.id, role: u.role ?? "BUYER" };
  }
  const mobile = await getMobileSession(req);
  if (mobile) return { id: mobile.id, role: mobile.role };
  return null;
}

// POST /api/conversations — buyer starts (or fetches existing) a chat thread
// for a given property. Returns the conversation id.
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(user.id);

  let body;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Verify property exists and the requester isn't the owner
  const property = await db.property.findUnique({
    where: { id: body.propertyId },
    select: { id: true, ownerId: true },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.ownerId === user.id) {
    return NextResponse.json(
      { error: "You can't start a chat with yourself about your own listing." },
      { status: 400 }
    );
  }

  const convo = await ensureConversation(user.id, body.propertyId);
  return NextResponse.json({ conversation: { id: convo.id, propertyId: convo.propertyId } });
}

// GET /api/conversations — list conversations relevant to the current user
//   - As buyer: all their conversations (one per property)
//   - As broker: all conversations on properties they own
//   - As lawyer: all conversations for engagements they're on
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(user.id);

  // Build the OR filter based on role
  const ownedProperties = await db.property.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  });
  const lawyerEngagements = await db.engagement.findMany({
    where: { lawyerId: user.id },
    select: { buyerId: true, propertyId: true },
  });

  const orClauses: Array<Record<string, unknown>> = [{ buyerId: user.id }];
  if (ownedProperties.length > 0) {
    orClauses.push({ propertyId: { in: ownedProperties.map((p) => p.id) } });
  }
  for (const e of lawyerEngagements) {
    orClauses.push({ AND: [{ buyerId: e.buyerId }, { propertyId: e.propertyId }] });
  }

  const conversations = await db.conversation.findMany({
    where: { OR: orClauses },
    include: {
      buyer: { select: { id: true, name: true, image: true } },
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          ownerId: true,
          owner: { select: { id: true, name: true, image: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, senderId: true, readBy: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Decorate with unread count (count messages not from current user where user isn't in readBy)
  const decorated = await Promise.all(
    conversations.map(async (c) => {
      const unread = await db.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: user.id },
          NOT: { readBy: { has: user.id } },
        },
      });
      return {
        id: c.id,
        propertyId: c.propertyId,
        propertyTitle: c.property.title,
        propertyCity: c.property.city,
        propertyImageUrl: c.property.images[0]?.url ?? null,
        buyer: c.buyer,
        broker: c.property.owner,
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
