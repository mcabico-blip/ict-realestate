import { db } from "@/lib/db";

export type ChatParticipants = {
  buyerId: string;
  brokerId: string; // property owner = listing's broker/seller
  lawyerId: string | null; // null until an engagement is created
};

/**
 * Resolve the canonical 3-way participant set for a conversation:
 * the buyer, the property's owner (= listing's broker / seller), and
 * the lawyer (if any engagement exists for this buyer+property).
 *
 * Returns null if the conversation doesn't exist.
 */
export async function getConversationParticipants(
  conversationId: string,
): Promise<(ChatParticipants & { propertyId: string }) | null> {
  const c = await db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      buyerId: true,
      propertyId: true,
      property: { select: { ownerId: true } },
    },
  });
  if (!c) return null;
  const engagement = await db.engagement.findUnique({
    where: { buyerId_propertyId: { buyerId: c.buyerId, propertyId: c.propertyId } },
    select: { lawyerId: true },
  });
  return {
    buyerId: c.buyerId,
    brokerId: c.property.ownerId,
    lawyerId: engagement?.lawyerId ?? null,
    propertyId: c.propertyId,
  };
}

/**
 * True if `userId` may read/write to this conversation. Used by every
 * chat-related API route as the auth gate.
 */
export function isParticipant(userId: string, p: ChatParticipants): boolean {
  return userId === p.buyerId || userId === p.brokerId || userId === p.lawyerId;
}

/**
 * Find-or-create a conversation for a buyer + property pair. Idempotent —
 * called the first time a buyer sends a message on a property.
 */
export async function ensureConversation(buyerId: string, propertyId: string) {
  const existing = await db.conversation.findUnique({
    where: { buyerId_propertyId: { buyerId, propertyId } },
  });
  if (existing) return existing;
  return await db.conversation.create({
    data: { buyerId, propertyId },
  });
}
