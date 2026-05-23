"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Star, BadgeCheck, Briefcase, Scale, Award } from "lucide-react";
import { PROFESSIONAL_LABELS } from "@/lib/professionals";
import { cn } from "@/lib/utils";

interface ProfessionalCardProps {
  professional: {
    id: string;
    userId: string;
    professionalType: string;
    photoUrl?: string | null;
    bio?: string | null;
    city?: string | null;
    province?: string | null;
    yearsExp?: number | null;
    verified: boolean;
    featured: boolean;
    licenseNo?: string | null;
    ibpRollNo?: string | null;
    agency?: string | null;
    lawFirm?: string | null;
    specialties: string[];
    lawSpecialties: string[];
    languages: string[];
    user: {
      name: string | null;
      email: string;
      phone?: string | null;
    };
    _count?: { properties?: number };
  };
}

const typeIcons: Record<string, React.ReactNode> = {
  BROKER: <Briefcase className="h-4 w-4" />,
  SALESPERSON: <Award className="h-4 w-4" />,
  LAWYER: <Scale className="h-4 w-4" />,
};

export function ProfessionalCard({ professional: p }: ProfessionalCardProps) {
  const meta = PROFESSIONAL_LABELS[p.professionalType];
  const allSpecs = p.professionalType === "LAWYER" ? p.lawSpecialties : p.specialties;
  const orgName = p.professionalType === "LAWYER" ? p.lawFirm : p.agency;

  return (
    <Link href={`/professionals/${p.userId}`}>
      <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 p-5 cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.user.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-gray-500">
                  {p.user.name?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            {p.verified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <BadgeCheck className="h-5 w-5 text-blue-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors leading-tight">
                  {p.user.name}
                </h3>
                <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1", meta?.bg, meta?.color)}>
                  {typeIcons[p.professionalType]}
                  {meta?.short}
                </span>
              </div>
              {p.featured && (
                <span className="shrink-0 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 font-semibold rounded-full">
                  Featured
                </span>
              )}
            </div>

            {orgName && (
              <p className="text-xs text-gray-500 mt-1 truncate">{orgName}</p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              {(p.city || p.province) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[p.city, p.province].filter(Boolean).join(", ")}
                </span>
              )}
              {p.yearsExp && (
                <span>{p.yearsExp}+ yrs exp</span>
              )}
              {p._count?.properties != null && p.professionalType !== "LAWYER" && (
                <span>{p._count.properties} listings</span>
              )}
            </div>
          </div>
        </div>

        {/* License / Roll */}
        <div className="mt-3 text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
          {p.licenseNo && (
            <span>PRC: <span className="text-gray-600 font-medium">{p.licenseNo}</span></span>
          )}
          {p.ibpRollNo && (
            <span>IBP Roll: <span className="text-gray-600 font-medium">{p.ibpRollNo}</span></span>
          )}
        </div>

        {/* Specialties */}
        {allSpecs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {allSpecs.slice(0, 3).map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {s}
              </span>
            ))}
            {allSpecs.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                +{allSpecs.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
