import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { PROFESSIONAL_LABELS } from "@/lib/professionals";
import { PropertyCard } from "@/components/property/property-card";
import { ConsultationForm } from "@/components/professionals/consultation-form";
import {
  BadgeCheck, MapPin, Phone, Mail, Briefcase, Scale, Award,
  Calendar, Globe, Star, CheckCircle2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const profile = await db.professionalProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true } } },
  });
  if (!profile) return { title: "Professional Not Found" };
  return {
    title: `${profile.user.name} — ${PROFESSIONAL_LABELS[profile.professionalType]?.label} | ICT Realtors`,
  };
}

const typeIcons: Record<string, React.ReactNode> = {
  BROKER: <Briefcase className="h-5 w-5" />,
  SALESPERSON: <Award className="h-5 w-5" />,
  LAWYER: <Scale className="h-5 w-5" />,
};

export default async function ProfessionalProfilePage({ params }: Props) {
  const { userId } = await params;
  const profile = await db.professionalProfile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!profile) notFound();

  const meta = PROFESSIONAL_LABELS[profile.professionalType];
  const isBrokerOrSalesperson = profile.professionalType !== "LAWYER";

  // Fetch listings if broker/salesperson
  const properties = isBrokerOrSalesperson
    ? await db.property.findMany({
        where: { ownerId: userId, status: "ACTIVE" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 6,
        select: {
          id: true, title: true, listingType: true, propertyType: true,
          status: true, price: true, priceUnit: true, city: true,
          province: true, bedrooms: true, bathrooms: true, floorArea: true,
          lotArea: true, featured: true, createdAt: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true, isPrimary: true } },
        },
      })
    : [];

  const orgName = profile.professionalType === "LAWYER" ? profile.lawFirm : profile.agency;
  const allSpecs = profile.professionalType === "LAWYER" ? profile.lawSpecialties : profile.specialties;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main profile */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-sm">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt={profile.user.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-gray-400">
                      {profile.user.name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                {profile.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                    <BadgeCheck className="h-6 w-6 text-blue-500" />
                  </div>
                )}
              </div>

              {/* Basic info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{profile.user.name}</h1>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full mt-1.5",
                      meta?.bg, meta?.color
                    )}>
                      {typeIcons[profile.professionalType]}
                      {meta?.label}
                    </span>
                  </div>
                  {profile.verified && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                {orgName && (
                  <p className="text-gray-500 text-sm mt-1">{orgName}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  {(profile.city || profile.province) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {[profile.city, profile.province].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {profile.yearsExp && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {profile.yearsExp}+ years experience
                    </span>
                  )}
                </div>

                {profile.languages.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                    {profile.languages.map((l) => (
                      <span key={l} className="text-xs text-gray-500">{l}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Credentials */}
            <div className="mt-5 pt-5 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {profile.licenseNo && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2.5">
                  <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-blue-400">PRC License No.</p>
                    <p className="font-semibold text-blue-800">{profile.licenseNo}</p>
                  </div>
                </div>
              )}
              {profile.accreditationNo && (
                <div className="flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2.5">
                  <BadgeCheck className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-xs text-green-400">Accreditation No.</p>
                    <p className="font-semibold text-green-800">{profile.accreditationNo}</p>
                  </div>
                </div>
              )}
              {profile.ibpRollNo && (
                <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-4 py-2.5">
                  <Scale className="h-4 w-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-xs text-purple-400">IBP Roll No.</p>
                    <p className="font-semibold text-purple-800">{profile.ibpRollNo}</p>
                  </div>
                </div>
              )}
              {profile.ibpChapter && (
                <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-4 py-2.5">
                  <Scale className="h-4 w-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-xs text-purple-400">IBP Chapter</p>
                    <p className="font-semibold text-purple-800">{profile.ibpChapter}</p>
                  </div>
                </div>
              )}
              {profile.realtorBoard && (
                <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-2.5">
                  <Star className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-blue-400">Realtor Board</p>
                    <p className="font-semibold text-blue-800">{profile.realtorBoard}</p>
                  </div>
                </div>
              )}
              {profile.barYear && (
                <div className="flex items-center gap-2 bg-purple-50 rounded-xl px-4 py-2.5">
                  <Calendar className="h-4 w-4 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-xs text-purple-400">Bar Passist</p>
                    <p className="font-semibold text-purple-800">Bar {profile.barYear}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {allSpecs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                {profile.professionalType === "LAWYER" ? "Legal Specializations" : "Specialties"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allSpecs.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lawyer services info */}
          {profile.professionalType === "LAWYER" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="font-semibold text-amber-900 mb-2">⚖️ Why You Need a Real Estate Lawyer</h2>
              <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
                <li>Verify the authenticity and clean title at the Registry of Deeds</li>
                <li>Draft and notarize the Deed of Absolute Sale (DAS)</li>
                <li>Process BIR clearance, Capital Gains Tax, and Documentary Stamp Tax</li>
                <li>Facilitate title transfer at the Register of Deeds</li>
                <li>Handle ejectment, unlawful detainer, or foreclosure proceedings</li>
                <li>Review lease contracts, mortgage agreements, and JV deals</li>
              </ul>
            </div>
          )}

          {/* Active Listings */}
          {properties.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Active Listings ({properties.length})</h2>
                <Link href={`/properties?owner=${userId}`} className="text-sm text-red-600 hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>

            {profile.user.phone && (
              <a
                href={`tel:${profile.user.phone}`}
                className="flex items-center gap-3 w-full py-2.5 px-4 mb-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Phone className="h-4 w-4" />
                {profile.user.phone}
              </a>
            )}

            <a
              href={`mailto:${profile.user.email}`}
              className="flex items-center gap-3 w-full py-2.5 px-4 mb-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-4 w-4 text-red-500" />
              Send Email
            </a>

            {profile.socialLinked && (
              <a
                href={profile.socialLinked}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-blue-500" />
                LinkedIn Profile
              </a>
            )}
          </div>

          {/* Office / Firm address */}
          {(profile.agencyAddress || profile.lawFirmAddress) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                {profile.professionalType === "LAWYER" ? "Law Firm Address" : "Office Address"}
              </h3>
              <p className="text-sm text-gray-600">
                {profile.agencyAddress ?? profile.lawFirmAddress}
              </p>
            </div>
          )}

          {/* Send inquiry / consultation */}
          <ConsultationForm
            professionalId={profile.userId}
            type={profile.professionalType}
            name={profile.user.name ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
