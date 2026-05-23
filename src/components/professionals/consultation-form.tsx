"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Scale, Briefcase } from "lucide-react";
import { LAWYER_SPECIALTIES } from "@/lib/professionals";

interface ConsultationFormProps {
  professionalId: string;
  type: string;
  name: string;
}

const DEFAULT_MESSAGES: Record<string, string> = {
  BROKER: "Hi! I'm looking to buy/sell a property and would like your assistance. Can we discuss my requirements?",
  SALESPERSON: "Hi! I'm interested in your services. Can you help me find a property that fits my budget?",
  LAWYER: "Hi! I need legal assistance with a real estate transaction. Can you help me with this?",
};

export function ConsultationForm({ professionalId, type, name }: ConsultationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGES[type] ?? "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const isLawyer = type === "LAWYER";
  const icon = isLawyer ? <Scale className="h-4 w-4 text-purple-500" /> : <Briefcase className="h-4 w-4 text-blue-500" />;
  const title = isLawyer ? "Request Legal Consultation" : "Contact this Professional";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { router.push("/auth/login"); return; }

    setLoading(true);
    setError("");

    const endpoint = isLawyer ? "/api/consultations" : "/api/professional-inquiries";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId, subject, message }),
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
        <p className="text-green-700 font-semibold text-sm">Message sent to {name}!</p>
        <p className="text-green-600 text-xs mt-1">They will contact you soon.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isLawyer && (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Legal Matter</label>
            <select
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">Select legal service...</option>
              {LAWYER_SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="General Consultation">General Consultation</option>
            </select>
          </div>
        )}

        <textarea
          className="w-full h-28 rounded-xl border border-gray-200 p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your needs..."
          required
        />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className={`w-full ${isLawyer ? "bg-purple-600 hover:bg-purple-700" : "bg-red-600 hover:bg-red-700"} text-white`}
        >
          {loading ? "Sending..." : session ? "Send Message" : "Sign in to Contact"}
        </Button>
      </form>
    </div>
  );
}
