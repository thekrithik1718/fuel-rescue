"use client";

import React from "react";
import Link from "next/link";
import { Flame, ShieldCheck, FileText, Scale, PhoneCall, AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 text-xs border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
              <span className="text-white font-bold text-base">Fuel Rescue</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              On-demand emergency roadside fuel delivery platform. Connecting stranded motorists with verified, PESO-compliant fuel delivery partners in under 20 minutes.
            </p>
            <div className="flex items-center gap-2 text-zinc-300 font-semibold">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>24x7 Helpline: 1800-RESCUE-24</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              Emergency Services
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/request" className="hover:text-emerald-400 transition">
                  Request Petrol Delivery
                </Link>
              </li>
              <li>
                <Link href="/request" className="hover:text-emerald-400 transition">
                  Request Diesel Delivery
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-emerald-400 transition">
                  Track Live Rescue
                </Link>
              </li>
              <li>
                <Link href="/request" className="hover:text-emerald-400 transition">
                  ₹30 Delivery Fee Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Role Portals */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">
              Operational Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/partner" className="hover:text-emerald-400 transition">
                  Delivery Partner Console
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition">
                  Admin Command Center
                </Link>
              </li>
              <li>
                <Link href="/admin/pricing" className="hover:text-emerald-400 transition">
                  Pricing & Zone Rules
                </Link>
              </li>
              <li>
                <Link href="/admin/suppliers" className="hover:text-emerald-400 transition">
                  Authorized OMC Depots
                </Link>
              </li>
            </ul>
          </div>

          {/* Statutory Compliance Notice */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Scale className="w-4 h-4" />
              <span>Regulatory Architecture & Legal Notice</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Doorstep fuel delivery in India is subject to statutory regulations under the Petroleum Act 1934 and PESO guidelines. While commercial diesel delivery has approved frameworks for designated uses, mobile petrol delivery is subject to stringent restrictions. Workflows and canister parameters in this application reflect a demonstration safety model.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <div>
            &copy; 2026 Fuel Rescue Simulation Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Safety Architecture Model
            </span>
            <span>Bengaluru Demo Hub</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
