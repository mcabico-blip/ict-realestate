import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Correct, verified Unsplash photo IDs mapped to property types
const fixes = [
  {
    titleContains: "El Nido",
    // shoe image → actual beach/coastal photo
    newUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
  },
  {
    titleContains: "Townhouse for Sale in Pasig",
    // verify townhouse image
    newUrl: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800",
  },
  {
    titleContains: "2BR Condo for Rent in Makati CBD",
    // no image → modern condo interior
    newUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
    createIfMissing: true,
  },
  {
    titleContains: "Studio Unit for Rent in Ortigas",
    // no image → studio apartment
    newUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    createIfMissing: true,
  },
  {
    titleContains: "3BR Premium Condo for Sale in BGC",
    // same as 1BR BGC → different luxury condo photo
    newUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
  },
  {
    titleContains: "Prime Office Space for Lease in Makati",
    // same as Cebu commercial → different office photo
    newUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
  },
  {
    titleContains: "3BR House for Rent in Quezon City",
    // same as QC house for sale → suburban house
    newUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
  },
  {
    titleContains: "5BR House for Sale in Paranaque",
    // luxury mansion photo
    newUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  },
  {
    titleContains: "Beach Lot for Sale in Nasugbu",
    // beach lot / white sand beach
    newUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  },
  {
    titleContains: "Warehouse for Lease in Caloocan",
    // warehouse interior
    newUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800",
  },
];

async function main() {
  for (const fix of fixes) {
    const property = await db.property.findFirst({
      where: { title: { contains: fix.titleContains } },
      include: { images: { where: { isPrimary: true } } },
    });

    if (!property) {
      console.log(`❌ Not found: ${fix.titleContains}`);
      continue;
    }

    const primaryImage = property.images[0];

    if (primaryImage) {
      await db.propertyImage.update({
        where: { id: primaryImage.id },
        data: { url: fix.newUrl },
      });
      console.log(`✅ Updated: ${property.title.substring(0, 50)}`);
    } else if (fix.createIfMissing) {
      await db.propertyImage.create({
        data: {
          propertyId: property.id,
          url: fix.newUrl,
          isPrimary: true,
          order: 0,
        },
      });
      console.log(`➕ Created image: ${property.title.substring(0, 50)}`);
    } else {
      console.log(`⚠️  No image to update: ${property.title.substring(0, 50)}`);
    }
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
