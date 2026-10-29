"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ROLES } from "@/lib/state-machine";
import {
  Flame,
  PhoneCall,
  Menu,
  X,
  Compass,
  Truck,
  Shield,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { role, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-zinc-900">
                  Fuel<span className="text-emerald-800 font-extrabold">Rescue</span>
                </span>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  24x7
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-medium -mt-0.5">
                Emergency Doorstep Fuel Delivery
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === "/"
                  ? "text-emerald-900 bg-emerald-50 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              Home
            </Link>

            <Link
              href="/request"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === "/request"
                  ? "text-emerald-900 bg-emerald-50 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              Request Fuel
            </Link>

            <Link
              href="/orders"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname.startsWith("/orders")
                  ? "text-emerald-900 bg-emerald-50 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              My Orders & Receipts
            </Link>

            <span className="h-4 w-px bg-zinc-200 mx-2" />

            {/* Quick role portal switchers */}
            <Link
              href="/partner"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                pathname.startsWith("/partner")
                  ? "bg-emerald-800 text-white border-emerald-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Partner View
            </Link>

            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                pathname.startsWith("/admin")
                  ? "bg-zinc-900 text-white border-black"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Ops
            </Link>
          </nav>

          {/* Right Action: Emergency Hotline & Primary CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-semibold text-zinc-800">1800-RESCUE-24</span>
            </div>

            <Link
              href="/request"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition duration-150"
            >
              <span>Instant Fuel Rescue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/request"
              className="bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
            >
              Rescue Now
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Home
          </Link>
          <Link
            href="/request"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-emerald-800 bg-emerald-50"
          >
            Emergency Fuel Request (₹30 Policy)
          </Link>
          <Link
            href="/orders"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Orders & Live Tracking
          </Link>
          <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
            <Link
              href="/partner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-800"
            >
              <Truck className="w-4 h-4 text-emerald-700" />
              Delivery Partner Portal
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-800"
            >
              <Shield className="w-4 h-4 text-zinc-800" />
              Administrator Command Center
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
