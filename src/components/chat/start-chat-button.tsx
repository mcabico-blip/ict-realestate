"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MessageCircle, Loader2 } from "lucide-react";

/**
 * "Message Lister" button on the property detail page. Creates (or fetches)
 * a conversation between the current buyer and the property owner, then
 * routes to the chat page.
 */
export function StartChatButton({ propertyId, ownerId }: { propertyId: string; ownerId: string }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Hide for unauthenticated users and for the property owner themselves
  if (status !== "authenticated") return null;
  if ((session?.user as { id?: string })?.id === ownerId) return null;

  async function handleClick() {
    setBusy(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Could not start chat");
        return;
      }
      router.push(`/dashboard/conversations/${data.conversation.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 mb-2 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-semibold text-red-700 transition-colors disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      Message Lister
    </button>
  );
}
