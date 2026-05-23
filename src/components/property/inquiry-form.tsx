"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface InquiryFormProps {
  propertyId: string;
  agentId: string;
}

export function InquiryForm({ propertyId, agentId }: InquiryFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("Hi! I'm interested in this property. Can you provide more details?");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, agentId, message }),
    });

    setLoading(false);

    if (res.ok) {
      setSent(true);
    } else {
      setError("Failed to send. Please try again.");
    }
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-green-700 font-semibold text-sm">Inquiry sent!</p>
        <p className="text-green-600 text-xs mt-1">The agent will contact you soon.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-red-500" />
        Send an Inquiry
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="w-full h-28 rounded-xl border border-gray-200 p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          required
        />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? "Sending..." : session ? "Send Inquiry" : "Sign in to Inquire"}
        </Button>
      </form>
    </div>
  );
}
