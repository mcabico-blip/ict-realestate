import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice, getListingTypeLabel, getPropertyTypeLabel } from "@/lib/utils";
import { InquiryForm } from "@/components/property/inquiry-form";
import { FavoriteButton } from "@/components/property/favorite-button";
import { ShareButton } from "@/components/property/share-button";
import { EngageLawyerCard } from "@/components/engagement/engage-lawyer-card";
import { StartChatButton } from "@/components/chat/start-chat-button";
import {
  MapPin, Bed, Bath, Maximize, Car, Calendar, Home,
  Phone, Mail, CheckCircle2, Eye, Heart,
} from "lucide-react";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await db.property.findUnique({
    where: { id },
    select: { title: true, city: true, province: true, description: true },
  });
  if (!property) return { title: "Property Not Found" };
  return {
    title: `${property.title} - ICT Realtors`,
    description: property.description.slice(0, 160),
  };
}

const listingColors: Record<string, string> = {
  FOR_SALE: "bg-red-600",
  FOR_RENT: "bg-blue-600",
  FOR_LEASE: "bg-purple-600",
};

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = await db.property.findUnique({
    where: { id, status: "ACTIVE" },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      amenities: true,
      owner: {
        include: { professionalProfile: true },
      },
      _count: { select: { favorites: true, inquiries: true } },
    },
  });

  if (!property) notFound();

  await db.property.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const primaryImage = property.images.find((i) => i.isPrimary) ?? property.images[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="space-y-2">
            {primaryImage && (
              <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src={primaryImage.url}
                  alt={property.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${listingColors[property.listingType] ?? "bg-gray-600"}`}>
                    {getListingTypeLabel(property.listingType)}
                  </span>
                  {property.featured && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white">Featured</span>
                  )}
                </div>
              </div>
            )}
            {property.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {property.images.slice(1, 5).map((img, i) => (
                  <div key={img.id} className="relative h-20 rounded-xl overflow-hidden bg-gray-100">
                    <Image src={img.url} alt={`Photo ${i + 2}`} fill className="object-cover" />
                    {i === 3 && property.images.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm">
                        +{property.images.length - 5}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title & Price */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{property.title}</h1>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{property.address}, {property.city}, {property.province}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-red-600">
                  {formatPrice(Number(property.price))}
                  {property.listingType !== "FOR_SALE" && (
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  )}
                </p>
                {property.negotiable && (
                  <span className="text-xs text-green-600 font-medium">Price Negotiable</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-3 flex-wrap">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{property.viewCount} views</span>
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{property._count.favorites} saves</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Listed {new Date(property.createdAt).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FavoriteButton propertyId={property.id} />
                <ShareButton title={property.title} />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="h-4 w-4 text-red-500" /> Property Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.bedrooms != null && (
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <Bed className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="font-bold text-gray-800">{property.bedrooms}</p>
                  <p className="text-xs text-gray-500">Bedrooms</p>
                </div>
              )}
              {property.bathrooms != null && (
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <Bath className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="font-bold text-gray-800">{property.bathrooms}</p>
                  <p className="text-xs text-gray-500">Bathrooms</p>
                </div>
              )}
              {property.floorArea && (
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <Maximize className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="font-bold text-gray-800">{property.floorArea} sqm</p>
                  <p className="text-xs text-gray-500">Floor Area</p>
                </div>
              )}
              {property.parkingSpaces != null && (
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <Car className="h-5 w-5 text-red-500 mx-auto mb-1" />
                  <p className="font-bold text-gray-800">{property.parkingSpaces}</p>
                  <p className="text-xs text-gray-500">Parking</p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Property Type</span>
                <span className="font-medium">{getPropertyTypeLabel(property.propertyType)}</span>
              </div>
              {property.lotArea && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Lot Area</span>
                  <span className="font-medium">{property.lotArea} sqm</span>
                </div>
              )}
              {property.yearBuilt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Year Built</span>
                  <span className="font-medium">{property.yearBuilt}</span>
                </div>
              )}
              {property.floors && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Floors</span>
                  <span className="font-medium">{property.floors}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Furnished</span>
                <span className="font-medium">{property.furnished ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pet Friendly</span>
                <span className="font-medium">{property.petFriendly ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Amenities & Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {property.amenities.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    {a.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Agent/Owner Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Lister</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg shrink-0">
                {property.owner.name?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{property.owner.name}</p>
                <p className="text-xs text-gray-500">
                  {property.owner.role === "BROKER"
                    ? "Licensed Real Estate Broker"
                    : property.owner.role === "SALESPERSON"
                    ? "Licensed Salesperson"
                    : "Property Owner"}
                </p>
                {property.owner.professionalProfile?.agency && (
                  <p className="text-xs text-gray-400">{property.owner.professionalProfile.agency}</p>
                )}
                {property.owner.professionalProfile?.licenseNo && (
                  <p className="text-xs text-blue-500 font-medium">
                    PRC {property.owner.professionalProfile.licenseNo}
                  </p>
                )}
              </div>
            </div>

            <StartChatButton propertyId={property.id} ownerId={property.owner.id} />

            {property.owner.phone && (
              <a
                href={`tel:${property.owner.phone}`}
                className="flex items-center gap-2 w-full py-2.5 px-4 mb-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Phone className="h-4 w-4 text-red-500" />
                {property.owner.phone}
              </a>
            )}
            <a
              href={`mailto:${property.owner.email}`}
              className="flex items-center gap-2 w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-4 w-4 text-red-500" />
              Email Agent
            </a>
          </div>

          {/* Inquiry Form */}
          <InquiryForm propertyId={property.id} agentId={property.owner.id} />

          {/* Engage Lawyer — only shown to logged-in buyers, opens contract management flow */}
          <EngageLawyerCard propertyId={property.id} />
        </div>
      </div>
    </div>
  );
}
