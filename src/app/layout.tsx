import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ICT Realtors - Philippines Real Estate Marketplace",
  description:
    "Find properties for sale, rent, and lease in the Philippines. Browse houses, condos, lots, and commercial spaces across all regions.",
  keywords: "Philippines real estate, property for sale Philippines, condo for rent Manila, house and lot",
  openGraph: {
    title: "ICT Realtors",
    description: "Philippines' trusted real estate marketplace",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen flex flex-col bg-gray-50 antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
