"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";

type Message = {
  id: string;
  senderId: string;
  senderName: string | null;
  senderRole: string;
  content: string;
  readBy: string[];
  createdAt: string;
};

type Participant = { id: string; name: string | null; role: string; online: boolean } | null;

/**
 * Inline chat panel for an engagement / conversation. Polls for new messages
 * every 4 seconds while the panel is open and visible.
 */
export function ChatPanel({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<{
    buyer: Participant;
    broker: Participant;
    lawyer: Participant;
  }>({ buyer: null, broker: null, lawyer: null });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFetchedAtRef = useRef<string | null>(null);

  const loadInitial = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setMessages(data.conversation.messages);
      setParticipants(data.conversation.participants);
      lastFetchedAtRef.current = data.conversation.messages.at(-1)?.createdAt ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load conversation");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Poll for new messages every 4s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const url = lastFetchedAtRef.current
          ? `/api/conversations/${conversationId}/messages?since=${encodeURIComponent(lastFetchedAtRef.current)}`
          : `/api/conversations/${conversationId}/messages`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const newMsgs = data.messages as Message[];
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const merged = [...prev, ...newMsgs.filter((m) => !ids.has(m.id))];
            return merged;
          });
          lastFetchedAtRef.current = newMsgs.at(-1)?.createdAt ?? lastFetchedAtRef.current;
        }
      } catch {
        /* swallow polling errors */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setMessages((prev) => [...prev, data.message]);
      lastFetchedAtRef.current = data.message.createdAt;
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function roleColor(role: string) {
    if (role === "BROKER" || role === "SALESPERSON") return "bg-blue-100 text-blue-700";
    if (role === "LAWYER") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  }

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 500 }}>
      {/* Participants header */}
      <div className="px-4 py-2.5 border-b bg-gray-50 flex items-center gap-3 flex-wrap text-xs">
        {([participants.buyer, participants.broker, participants.lawyer] as Participant[])
          .filter(Boolean)
          .map((p) => (
            <div key={p!.id} className="flex items-center gap-1.5">
              <span className="relative">
                <span className="w-6 h-6 rounded-full bg-gray-300 inline-flex items-center justify-center text-white font-bold text-[10px]">
                  {p!.name?.[0]?.toUpperCase() ?? "?"}
                </span>
                {p!.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-white" />
                )}
              </span>
              <span className="font-medium text-gray-800">{p!.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${roleColor(p!.role)}`}>
                {p!.role === "BROKER" ? "Broker" : p!.role === "SALESPERSON" ? "Agent" : p!.role === "LAWYER" ? "Lawyer" : "Buyer"}
              </span>
            </div>
          ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((m) => {
              const isMine = m.senderId === currentUserId;
              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
                  {!isMine && (
                    <div className="flex flex-col items-end shrink-0">
                      <span className="w-7 h-7 rounded-full bg-gray-300 inline-flex items-center justify-center text-white font-bold text-[10px]">
                        {m.senderName?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}
                  <div className={`max-w-[75%]`}>
                    {!isMine && (
                      <p className="text-[10px] text-gray-500 mb-0.5 ml-1">
                        {m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                        isMine
                          ? "bg-red-600 text-white rounded-br-md"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      {m.content}
                    </div>
                    {isMine && (
                      <p className="text-[10px] text-gray-400 mt-0.5 mr-1 text-right">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-2 bg-white">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2 mb-2">
            {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none text-sm border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 max-h-32"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="shrink-0 p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
