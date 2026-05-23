"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Building2, Briefcase, Scale, Award, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const roles = [
  { value: "BUYER", label: "Buyer / Renter", desc: "Looking to buy or rent a property", icon: <Home className="h-5 w-5" /> },
  { value: "SELLER", label: "Property Owner", desc: "I want to sell or rent out", icon: <User className="h-5 w-5" /> },
  { value: "BROKER", label: "Licensed Broker", desc: "PRC-licensed real estate broker", icon: <Briefcase className="h-5 w-5" /> },
  { value: "SALESPERSON", label: "Salesperson", desc: "Accredited under RESA Law", icon: <Award className="h-5 w-5" /> },
  { value: "LAWYER", label: "Real Estate Lawyer", desc: "IBP-registered attorney", icon: <Scale className="h-5 w-5" /> },
];

const roleColors: Record<string, string> = {
  BUYER: "border-red-400 bg-red-50 text-red-700",
  SELLER: "border-orange-400 bg-orange-50 text-orange-700",
  BROKER: "border-blue-400 bg-blue-50 text-blue-700",
  SALESPERSON: "border-green-400 bg-green-50 text-green-700",
  LAWYER: "border-purple-400 bg-purple-50 text-purple-700",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "BUYER" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const isProfessional = ["BROKER", "SALESPERSON", "LAWYER"].includes(form.role);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });

    // Redirect professionals to complete their profile
    if (isProfessional) {
      router.push("/dashboard/profile/professional");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl">
            <Building2 className="h-8 w-8 text-red-600" />
            <span><span className="text-red-600">ICT</span><span className="text-gray-800"> Realtors</span></span>
          </Link>
          <p className="text-gray-500 mt-2">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">I am a...</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => update("role", r.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.role === r.value
                        ? roleColors[r.value]
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <div className="mb-1.5 opacity-70">{r.icon}</div>
                    <p className="font-semibold text-xs leading-tight">{r.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 hidden sm:block leading-tight">{r.desc}</p>
                  </button>
                ))}
              </div>
              {isProfessional && (
                <p className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  After registering, you'll be prompted to complete your professional profile with your license/accreditation details.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <Input placeholder="Juan dela Cruz" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
              <Input type="tel" placeholder="+63 9XX XXX XXXX" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <Input type="password" placeholder="At least 8 characters" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold">
              {loading ? "Creating account..." : "Create Free Account"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-gray-400">
            By registering, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
          </p>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-red-600 font-semibold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
