import Link from "next/link";
import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mb-3">
              <Building2 className="h-7 w-7 text-red-500" />
              <span>
                <span className="text-red-500">ICT</span> Realtors
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              The Philippines' trusted real estate marketplace. Find your dream home, commercial space, or investment property.
            </p>
            <div className="flex gap-3 text-sm">
              <a href="#" className="hover:text-white transition-colors font-medium">Facebook</a>
              <a href="#" className="hover:text-white transition-colors font-medium">Instagram</a>
              <a href="#" className="hover:text-white transition-colors font-medium">YouTube</a>
            </div>
          </div>

          {/* Properties */}
          <div>
            <h4 className="font-semibold text-white mb-4">Properties</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/properties?listing=FOR_SALE" className="hover:text-white transition-colors">Houses for Sale</Link></li>
              <li><Link href="/properties?listing=FOR_RENT" className="hover:text-white transition-colors">Properties for Rent</Link></li>
              <li><Link href="/properties?listing=FOR_LEASE" className="hover:text-white transition-colors">For Lease</Link></li>
              <li><Link href="/properties?type=CONDO" className="hover:text-white transition-colors">Condominiums</Link></li>
              <li><Link href="/properties?type=LOT" className="hover:text-white transition-colors">Lots & Land</Link></li>
              <li><Link href="/properties?type=COMMERCIAL" className="hover:text-white transition-colors">Commercial Spaces</Link></li>
            </ul>
          </div>

          {/* Professionals */}
          <div>
            <h4 className="font-semibold text-white mb-4">Professionals</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/professionals?type=BROKER" className="hover:text-white transition-colors">Find a Broker</Link></li>
              <li><Link href="/professionals?type=SALESPERSON" className="hover:text-white transition-colors">Find a Salesperson</Link></li>
              <li><Link href="/professionals?type=LAWYER" className="hover:text-white transition-colors">Find a Lawyer</Link></li>
              <li><Link href="/auth/register?role=professional" className="hover:text-white transition-colors">Join as a Professional</Link></li>
              <li><Link href="/professionals" className="hover:text-white transition-colors">All Professionals</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/professionals" className="hover:text-white transition-colors">Find Professionals</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} ICT Realtors. All rights reserved.</p>
          <p>Made with ❤️ for the Philippines 🇵🇭</p>
        </div>
      </div>
    </footer>
  );
}
