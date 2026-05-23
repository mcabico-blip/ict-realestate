"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Building2, Menu, X, Heart, User, LogOut, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/properties?listing=FOR_SALE", label: "Buy" },
  { href: "/properties?listing=FOR_RENT", label: "Rent" },
  { href: "/properties?listing=FOR_LEASE", label: "Lease" },
  { href: "/professionals?type=BROKER", label: "Brokers" },
  { href: "/professionals?type=LAWYER", label: "Lawyers" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Building2 className="h-7 w-7 text-red-600" />
          <span>
            <span className="text-red-600">ICT</span>
            <span className="text-gray-800"> Realtors</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 ml-1 bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-violet-200">
            <Sparkles className="h-2.5 w-2.5" />
            AI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link href="/dashboard/listings/new">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="h-4 w-4" />
                  List Property
                </Button>
              </Link>
              <Link href="/dashboard/favorites">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          menuOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 pb-4 border-t bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-2 text-sm font-medium text-gray-700 hover:text-red-600"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            {session ? (
              <>
                <Link href="/dashboard/listings/new" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white" size="sm">
                    List a Property
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">Dashboard</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full"
                  size="sm"
                  onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white" size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
