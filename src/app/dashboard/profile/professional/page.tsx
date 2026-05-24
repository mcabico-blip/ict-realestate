import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfessionalProfileForm } from "@/components/profile/professional-profile-form";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Complete Your Professional Profile | ICT Realtors" };

export default async function ProfessionalProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role?: string }).role;

  if (role !== "BROKER" && role !== "SALESPERSON" && role !== "LAWYER") {
    redirect("/dashboard");
  }

  const profile = await db.professionalProfile.findUnique({ where: { userId } });

  const title =
    role === "BROKER"
      ? "Broker Profile"
      : role === "SALESPERSON"
      ? "Salesperson Profile"
      : "Lawyer Profile";

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Complete your professional profile so buyers and sellers can find and trust you.
          {role === "BROKER" || role === "SALESPERSON"
            ? " Include your PRC license details."
            : " Include your IBP roll number."}
        </p>

        <ProfessionalProfileForm
          role={role as "BROKER" | "SALESPERSON" | "LAWYER"}
          initial={profile}
        />
      </div>
    </div>
  );
}
