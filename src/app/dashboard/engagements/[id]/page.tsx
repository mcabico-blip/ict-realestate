import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { DocumentUploader } from "@/components/engagement/document-uploader";
import { DocumentRow } from "@/components/engagement/document-row";
import { StatusUpdater } from "@/components/engagement/status-updater";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ensureConversation } from "@/lib/chat";
import {
  ArrowLeft,
  Scale,
  MapPin,
  Phone,
  Mail,
  FileText,
  User,
  Building,
} from "lucide-react";

export const metadata = { title: "Contract Workspace | ICT Realtors" };

const statusLabel: Record<string, string> = {
  NEW: "New",
  IN_REVIEW: "In Review",
  AWAITING_DOCUMENTS: "Awaiting Documents",
  DRAFTING: "Drafting",
  PENDING_SIGNATURES: "Awaiting Signatures",
  NOTARIZED: "Notarized",
  TITLE_TRANSFER: "Title Transfer",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusColors: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  AWAITING_DOCUMENTS: "bg-amber-100 text-amber-700",
  DRAFTING: "bg-indigo-100 text-indigo-700",
  PENDING_SIGNATURES: "bg-purple-100 text-purple-700",
  NOTARIZED: "bg-cyan-100 text-cyan-700",
  TITLE_TRANSFER: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function EngagementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const engagement = await db.engagement.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true, email: true, phone: true } },
      lawyer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          professionalProfile: {
            select: { lawFirm: true, ibpRollNo: true, ibpChapter: true, barYear: true },
          },
        },
      },
      property: {
        include: {
          owner: { select: { name: true, email: true, phone: true } },
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!engagement) notFound();
  const isBuyer = engagement.buyerId === userId;
  const isLawyer = engagement.lawyerId === userId;
  if (!isBuyer && !isLawyer) notFound();

  // Ensure a chat conversation exists for this buyer + property pair so the
  // ChatPanel can load it. (Buyer initiates; idempotent.)
  const conversation = await ensureConversation(engagement.buyerId, engagement.propertyId);

  const img = engagement.property.images[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link
        href="/dashboard/engagements"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> All Contracts
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-purple-600" />
                  Contract Workspace
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Created{" "}
                  {new Date(engagement.createdAt).toLocaleDateString("en-PH", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · Last update{" "}
                  {new Date(engagement.updatedAt).toLocaleDateString("en-PH", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              {isLawyer ? (
                <StatusUpdater engagementId={engagement.id} currentStatus={engagement.status} />
              ) : (
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    statusColors[engagement.status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusLabel[engagement.status]}
                </span>
              )}
            </div>

            {/* Property summary */}
            <Link
              href={`/properties/${engagement.property.id}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-16 h-14 rounded-lg overflow-hidden bg-gray-200 shrink-0 relative">
                {img ? (
                  <Image src={img.url} alt={engagement.property.title} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {engagement.property.title}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {engagement.property.address}, {engagement.property.city}
                </p>
              </div>
              <p className="font-bold text-red-600 text-sm shrink-0">
                {formatPrice(Number(engagement.property.price))}
              </p>
            </Link>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Conversation
            </h2>
            <ChatPanel conversationId={conversation.id} currentUserId={userId} />
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                Contract Documents
                <span className="text-xs font-normal text-gray-400">
                  ({engagement.documents.length})
                </span>
              </h2>
            </div>

            <div className="space-y-2 mb-3">
              {engagement.documents.length === 0 ? (
                <p className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl">
                  No documents uploaded yet.
                  {isLawyer && " Upload the first contract document below."}
                </p>
              ) : (
                engagement.documents.map((d) => (
                  <DocumentRow
                    key={d.id}
                    id={d.id}
                    documentType={d.documentType}
                    fileName={d.fileName}
                    fileSize={d.fileSize}
                    notes={d.notes}
                    uploadedBy={d.uploadedBy}
                    uploadedAt={d.createdAt.toISOString()}
                    canDelete={d.uploadedById === userId || isLawyer}
                  />
                ))
              )}
            </div>

            <DocumentUploader engagementId={engagement.id} />
          </div>

          {/* Notes (lawyer's running notes, both can see) */}
          {engagement.notes && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-2">Lawyer Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{engagement.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Lawyer card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-purple-600" />
              Assigned Lawyer
            </h3>
            <p className="font-semibold text-sm text-gray-900">{engagement.lawyer.name}</p>
            {engagement.lawyer.professionalProfile?.lawFirm && (
              <p className="text-xs text-gray-500">
                {engagement.lawyer.professionalProfile.lawFirm}
              </p>
            )}
            {engagement.lawyer.professionalProfile?.ibpRollNo && (
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                IBP {engagement.lawyer.professionalProfile.ibpRollNo}
                {engagement.lawyer.professionalProfile.ibpChapter &&
                  ` · ${engagement.lawyer.professionalProfile.ibpChapter}`}
              </p>
            )}
            {isBuyer && (
              <div className="mt-3 space-y-1.5">
                {engagement.lawyer.phone && (
                  <a
                    href={`tel:${engagement.lawyer.phone}`}
                    className="flex items-center gap-2 text-xs text-gray-700 hover:text-purple-600"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {engagement.lawyer.phone}
                  </a>
                )}
                <a
                  href={`mailto:${engagement.lawyer.email}`}
                  className="flex items-center gap-2 text-xs text-gray-700 hover:text-purple-600"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {engagement.lawyer.email}
                </a>
              </div>
            )}
          </div>

          {/* Buyer card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              Buyer
            </h3>
            <p className="font-semibold text-sm text-gray-900">{engagement.buyer.name}</p>
            {isLawyer && (
              <div className="mt-2 space-y-1.5">
                {engagement.buyer.phone && (
                  <a
                    href={`tel:${engagement.buyer.phone}`}
                    className="flex items-center gap-2 text-xs text-gray-700 hover:text-purple-600"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {engagement.buyer.phone}
                  </a>
                )}
                <a
                  href={`mailto:${engagement.buyer.email}`}
                  className="flex items-center gap-2 text-xs text-gray-700 hover:text-purple-600"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {engagement.buyer.email}
                </a>
              </div>
            )}
          </div>

          {/* Seller / broker contact (visible to lawyer for coordination) */}
          {isLawyer && engagement.property.owner && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                Listing Agent
              </h3>
              <p className="font-semibold text-sm text-gray-900">
                {engagement.property.owner.name}
              </p>
              <div className="mt-2 space-y-1.5">
                {engagement.property.owner.phone && (
                  <a
                    href={`tel:${engagement.property.owner.phone}`}
                    className="flex items-center gap-2 text-xs text-gray-700 hover:text-purple-600"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {engagement.property.owner.phone}
                  </a>
                )}
                <a
                  href={`mailto:${engagement.property.owner.email}`}
                  className="flex items-center gap-2 text-xs text-gray-700 hover:text-purple-600"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {engagement.property.owner.email}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
