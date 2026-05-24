"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X, Bot, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const INITIAL_GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'm the ICT Realtors Support Agent. I can help you find properties, explain the Philippine real estate process, or walk you through using the platform. What would you like to know?",
};

export function SupportAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages([...next, { role: "assistant", content: data.reply as string }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
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

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI support chat"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-full shadow-lg shadow-purple-500/30 transition-all"
        >
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline text-sm font-semibold">Ask AI</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[92vw] sm:w-[400px] h-[600px] max-h-[85vh] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">ICT Realtors AI</p>
                <p className="text-[10px] text-white/80">Support Agent · powered by Claude</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50"
          >
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {sending && <ThinkingBubble />}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-2 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything…"
                rows={1}
                className="flex-1 resize-none text-sm border border-gray-200 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 max-h-32"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="shrink-0 p-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-center">
              AI may make mistakes. Verify legal info with a real lawyer.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
          <Bot className="h-3.5 w-3.5 text-purple-700" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-red-600 text-white rounded-br-md"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start gap-2">
      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
        <Bot className="h-3.5 w-3.5 text-purple-700" />
      </div>
      <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
