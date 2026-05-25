import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getMobileSession } from "@/lib/mobile-auth";
import { getConversationParticipants, isParticipant } from "@/lib/chat";
import { touchPresence } from "@/lib/presence";

const sendSchema = z.object({ content: z.string().min(1).max(4000) });

// POST /api/mobile/conversations/[id]/messages — send a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(session.id);

  const { id } = await params;
  const p = await getConversationParticipants(id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isParticipant(session.id, p)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = sendSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = await db.message.create({
    data: { conversationId: id, senderId: session.id, content: body.content, readBy: [session.id] },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    message: {
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderRole: message.sender.role,
      content: message.content,
      readBy: message.readBy,
      createdAt: message.createdAt.toISOString(),
    },
  });
}

// GET /api/mobile/conversations/[id]/messages?since=<ISO> — poll for new messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMobileSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  touchPresence(session.id);

  const { id } = await params;
  const p = await getConversationParticipants(id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isParticipant(session.id, p)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const since = req.nextUrl.searchParams.get("since");
  const where: Record<string, unknown> = { conversationId: id };
  if (since) {
    const d = new Date(since);
    if (!isNaN(d.getTime())) where.createdAt = { gt: d };
  }

  const messages = await db.message.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderRole: m.sender.role,
      content: m.content,
      readBy: m.readBy,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
