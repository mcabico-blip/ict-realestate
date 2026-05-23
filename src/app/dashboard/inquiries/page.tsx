import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  MessageSquare, Mail, ExternalLink,
  Clock, CheckCircle2, XCircle, ArrowLeft,
} from "lucide-react";
import { InquiryActions } from "@/components/dashboard/inquiry-actions";

export const metadata = { title: "Inquiries Received | ICT Realtors" };

function StatusBadge({ status }: { status: string }) {
  if (status === "RESPONDED")
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="h-3.5 w-3.5" /> Responded
      </span>
    );
  if (status === "CLOSED")
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
        <XCircle className="h-3.5 w-3.5" /> Closed
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
      <MessageSquare className="h-3.5 w-3.5" /> Open
    </span>
  );
}

export default async function InquiriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const userId = (session.user as { id: string }).id;

  const inquiries = await db.inquiry.findMany({
    where: { agentId: userId },
    include: {
      property: {
        select: { id: true, title: true, city: true, province: true },
      },
      buyer: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const open = inquiries.filter((i) => i.status === "OPEN").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquiries Received</h1>
          <p className="text-gray-500 text-sm mt-1">
            {inquiries.length} total &middot;{" "}
            <span className="text-blue-600 font-medium">{open} open</span>
          </p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
          <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No inquiries yet</p>
          <p className="text-xs text-gray-400 mt-1">
            When buyers message you about your listings, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className={`bg-white rounded-xl border shadow-sm p-5 transition-colors ${
                inq.status === "OPEN"
                  ? "border-blue-100 ring-1 ring-blue-50"
                  : "border-gray-100"
              }`}
            >
              {/* Property + Status */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Link
                    href={`/properties/${inq.property.id}`}
                    className="font-semibold text-gray-800 hover:text-red-600 flex items-center gap-1.5 text-sm"
                  >
                    {inq.property.title}
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {inq.property.city}, {inq.property.province}
                  </p>
                </div>
                <StatusBadge status={inq.status} />
              </div>

              {/* Buyer info */}
              <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {inq.buyer.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{inq.buyer.name}</p>
                  <p className="text-xs text-gray-400">{inq.buyer.email}</p>
                  {inq.buyer.phone && (
                    <p className="text-xs text-gray-400">{inq.buyer.phone}</p>
                  )}
                </div>
                <a
                  href={`mailto:${inq.buyer.email}?subject=Re: ${encodeURIComponent(inq.property.title)}`}
                  className="inline-flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Reply via Email
                </a>
              </div>

              {/* Message */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-lg px-4 py-3 mb-3">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {inq.message}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(inq.createdAt).toLocaleDateString("en-PH", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <InquiryActions inquiryId={inq.id} status={inq.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
