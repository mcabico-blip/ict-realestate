import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SupportAgent } from "@/components/ai/support-agent";
import { PresenceTracker } from "@/components/presence/presence-tracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ICT Real Estate — Philippines' AI-Powered Property Platform",
  description:
    "Find properties for sale, rent, and lease in the Philippines — powered by AI. Browse houses, condos, lots, and commercial spaces. Connect with PRC-licensed brokers, RESA salespersons, and IBP lawyers.",
  keywords: "Philippines real estate, AI real estate Philippines, property for sale Philippines, condo for rent Manila, house and lot, PRC broker, IBP lawyer, Innocube Technologies",
  metadataBase: new URL("https://ictrealestate.innocubetechnologies.com"),
  openGraph: {
    title: "ICT Real Estate — AI-Powered Philippine Property Platform",
    description: "Philippines' first AI-powered real estate marketplace. Buy, sell, rent, and connect with licensed professionals.",
    type: "website",
    url: "https://ictrealestate.innocubetechnologies.com",
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
          <SupportAgent />
          <PresenceTracker />
        </Providers>
      </body>
    </html>
  );
}
