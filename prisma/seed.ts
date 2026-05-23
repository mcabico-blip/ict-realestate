import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin
  const adminPw = await bcrypt.hash("admin123456", 12);
  await db.user.upsert({
    where: { email: "admin@ictrealtors.ph" },
    update: {},
    create: {
      name: "ICT Admin",
      email: "admin@ictrealtors.ph",
      password: adminPw,
      role: "ADMIN",
      phone: "+63 917 123 4567",
    },
  });

  // Broker
  const brokerPw = await bcrypt.hash("broker123456", 12);
  const broker = await db.user.upsert({
    where: { email: "broker@ictrealtors.ph" },
    update: {},
    create: {
      name: "Maria Santos",
      email: "broker@ictrealtors.ph",
      password: brokerPw,
      role: "BROKER",
      phone: "+63 918 987 6543",
      professionalProfile: {
        create: {
          professionalType: "BROKER",
          licenseNo: "PRC-REB-2019-001234",
          licenseExpiry: new Date("2026-12-31"),
          agency: "Santos Properties Group",
          agencyAddress: "Unit 1502, Ayala Avenue, Makati City",
          realtorBoard: "PAREB - Makati",
          bio: "Licensed real estate broker with 8 years of experience in Metro Manila and Cebu. Specializing in high-rise condominiums, commercial spaces, and investment properties. PRC License #001234. Member of PAREB.",
          specialties: ["Residential", "Condominium", "Commercial", "Pre-selling"],
          yearsExp: 8,
          city: "Makati",
          province: "Metro Manila",
          languages: ["Filipino", "English"],
          verified: true,
          featured: true,
        },
      },
    },
  });

  // Salesperson
  const spPw = await bcrypt.hash("sales123456", 12);
  const salesperson = await db.user.upsert({
    where: { email: "salesperson@ictrealtors.ph" },
    update: {},
    create: {
      name: "Jose Reyes",
      email: "salesperson@ictrealtors.ph",
      password: spPw,
      role: "SALESPERSON",
      phone: "+63 920 111 2222",
      professionalProfile: {
        create: {
          professionalType: "SALESPERSON",
          accreditationNo: "RESA-SP-2022-007890",
          supervisingBroker: "Maria Santos (PRC #001234)",
          agency: "Santos Properties Group",
          bio: "Accredited real estate salesperson with 3 years of experience, focused on residential properties in Quezon City, Pasig, and Mandaluyong.",
          specialties: ["Residential", "House & Lot", "Townhouse"],
          yearsExp: 3,
          city: "Quezon City",
          province: "Metro Manila",
          languages: ["Filipino", "English"],
          verified: true,
        },
      },
    },
  });

  // Lawyer
  const lawyerPw = await bcrypt.hash("lawyer123456", 12);
  const lawyer = await db.user.upsert({
    where: { email: "lawyer@ictrealtors.ph" },
    update: {},
    create: {
      name: "Atty. Ana Dela Cruz",
      email: "lawyer@ictrealtors.ph",
      password: lawyerPw,
      role: "LAWYER",
      phone: "+63 917 555 8899",
      professionalProfile: {
        create: {
          professionalType: "LAWYER",
          ibpRollNo: "IBP-2015-056789",
          ibpChapter: "IBP Makati City Chapter",
          lawFirm: "Dela Cruz & Associates Law Office",
          lawFirmAddress: "12/F Zuellig Building, Makati Avenue, Makati City",
          barYear: 2015,
          notaryUntil: new Date("2026-12-31"),
          bio: "Specializing in real estate law for over 9 years. Experienced in title transfers, Deeds of Sale, due diligence, foreclosure proceedings, ejectment cases, and HLURB/DHSUD matters. Notary Public for Makati City.",
          lawSpecialties: [
            "Title Transfer (Deed of Sale)",
            "Property Due Diligence",
            "Ejectment / Unlawful Detainer",
            "Foreclosure Proceedings",
            "Lease Agreement Drafting",
            "Notarial Services",
            "BIR / Tax Clearance",
            "Registry of Deeds",
          ],
          yearsExp: 9,
          city: "Makati",
          province: "Metro Manila",
          languages: ["Filipino", "English"],
          verified: true,
          featured: true,
        },
      },
    },
  });

  // Sample properties by broker
  const properties = [
    {
      title: "Modern 3BR House for Sale in Quezon City near UP",
      description: "Beautiful modern house in a quiet subdivision near the University of the Philippines Diliman. Features open-plan living area, spacious kitchen, and a landscaped garden. Walking distance to schools, supermarkets, and public transport.",
      listingType: "FOR_SALE" as const,
      propertyType: "HOUSE" as const,
      price: 8500000,
      address: "123 Mabini St., Project 6",
      city: "Quezon City",
      province: "Metro Manila",
      region: "NCR",
      bedrooms: 3,
      bathrooms: 2,
      floorArea: 150.0,
      lotArea: 220.0,
      parkingSpaces: 2,
      floors: 2,
      yearBuilt: 2018,
      furnished: false,
      featured: true,
      images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"],
      amenities: ["24/7 Security", "CCTV", "Parking", "Garden"],
    },
    {
      title: "1BR Condo for Rent in BGC Taguig - Fully Furnished",
      description: "Stylish and fully-furnished 1-bedroom condominium unit in the heart of Bonifacio Global City. High floor with city view. Perfect for professionals.",
      listingType: "FOR_RENT" as const,
      propertyType: "CONDO" as const,
      price: 35000,
      address: "High Street South Corporate Plaza",
      city: "Taguig",
      province: "Metro Manila",
      region: "NCR",
      bedrooms: 1,
      bathrooms: 1,
      floorArea: 38.5,
      parkingSpaces: 1,
      furnished: true,
      featured: true,
      images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"],
      amenities: ["Swimming Pool", "Gym / Fitness Center", "24/7 Security", "Elevator", "Airconditioning"],
    },
    {
      title: "Affordable House & Lot in Cavite - Near Tagaytay",
      description: "Brand new house and lot in a gated subdivision in Silang, Cavite. Perfect for first-time homebuyers.",
      listingType: "FOR_SALE" as const,
      propertyType: "HOUSE" as const,
      price: 2800000,
      address: "Lot 12 Block 5, Silang Heights",
      city: "Silang",
      province: "Cavite",
      region: "Region IV-A",
      bedrooms: 2,
      bathrooms: 1,
      floorArea: 50.0,
      lotArea: 88.0,
      yearBuilt: 2023,
      furnished: false,
      images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80"],
      amenities: ["24/7 Security", "Playground", "Basketball Court"],
    },
    {
      title: "Commercial Space for Lease in Cebu IT Park",
      description: "Prime commercial office space available for lease in Cebu IT Park. PEZA accredited building with backup power and high-speed internet ready.",
      listingType: "FOR_LEASE" as const,
      propertyType: "OFFICE" as const,
      price: 450,
      address: "Cardinal Rosales Ave., Cebu IT Park",
      city: "Cebu City",
      province: "Cebu",
      region: "Region VII",
      floorArea: 300.0,
      parkingSpaces: 5,
      floors: 1,
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"],
      amenities: ["Elevator", "Generator", "Fiber Internet Ready", "CCTV", "24/7 Security"],
    },
    {
      title: "Beachfront Lot for Sale in El Nido, Palawan",
      description: "Rare opportunity to own a beachfront lot in El Nido, Palawan. Crystal clear waters and stunning limestone cliffs. Perfect for resort development.",
      listingType: "FOR_SALE" as const,
      propertyType: "LOT" as const,
      price: 15000000,
      address: "Nacpan Beach Road",
      city: "El Nido",
      province: "Palawan",
      region: "MIMAROPA",
      lotArea: 500.0,
      featured: true,
      images: ["https://images.unsplash.com/photo-1548430395-ec39eaf2aa1a?w=800&q=80"],
      amenities: [],
    },
    {
      title: "Townhouse for Sale in Pasig near Ortigas",
      description: "Well-maintained 3-bedroom townhouse in a secure gated community in Pasig. Minutes away from Ortigas CBD and SM Megamall.",
      listingType: "FOR_SALE" as const,
      propertyType: "TOWNHOUSE" as const,
      price: 6200000,
      address: "Greenville Townhomes, Oranbo",
      city: "Pasig",
      province: "Metro Manila",
      region: "NCR",
      bedrooms: 3,
      bathrooms: 2,
      floorArea: 120.0,
      lotArea: 80.0,
      parkingSpaces: 1,
      floors: 3,
      yearBuilt: 2015,
      furnished: false,
      images: ["https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&q=80"],
      amenities: ["24/7 Security", "CCTV", "Parking", "Clubhouse"],
    },
  ];

  for (const prop of properties) {
    const { images, amenities, ...data } = prop;
    await db.property.create({
      data: {
        ...data,
        ownerId: broker.id,
        status: "ACTIVE",
        negotiable: true,
        zipCode: null,
        images: {
          create: images.map((url, i) => ({ url, isPrimary: i === 0, order: i })),
        },
        amenities: {
          create: amenities.map((name) => ({ name })),
        },
      },
    });
  }

  console.log(`✅ Seeded ${properties.length} properties`);
  console.log("🔑 Admin:       admin@ictrealtors.ph / admin123456");
  console.log("🔑 Broker:      broker@ictrealtors.ph / broker123456");
  console.log("🔑 Salesperson: salesperson@ictrealtors.ph / sales123456");
  console.log("🔑 Lawyer:      lawyer@ictrealtors.ph / lawyer123456");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
