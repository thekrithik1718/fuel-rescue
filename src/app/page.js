"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Flame,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Navigation,
  Zap,
  PhoneCall,
  ChevronRight,
  Car,
  Fuel,
  Info,
  Award,
} from "lucide-react";
import { calculateDeliveryFee, calculateOrderPrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  // Interactive mini pricing preview on homepage
  const [demoDistance, setDemoDistance] = useState(3.5);
  const [demoFuelType, setDemoFuelType] = useState("PETROL");
  const [demoLitres, setDemoLitres] = useState(5);

  const priceQuote = calculateOrderPrice({
    fuelType: demoFuelType,
    quantityLitres: demoLitres,
    distanceKm: demoDistance,
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-zinc-50 to-[#F4F6F4] pt-12 pb-20 border-b border-zinc-200">
        {/* Subtle geometric grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Vision & Primary Call to Action */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-900 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Now Serving Bengaluru Urban • Average Arrival 17 Mins</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 tracking-tight leading-[1.1]">
                Ran out of fuel on the road?{" "}
                <span className="bg-gradient-to-r from-emerald-800 to-emerald-950 bg-clip-text text-transparent">
                  Rescue is minutes away.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed">
                India’s premier on-demand emergency roadside fuel delivery platform. Verified emergency responders deliver authorized Petrol & Diesel directly to your stranded vehicle with upfront, transparent pricing.
              </p>

              {/* Pricing Highlight Pill */}
              <div className="inline-flex items-center gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-lg">
                  ₹30
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">
                    Transparent Fixed Delivery Fee Policy
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Only ₹30 for all deliveries up to 4 km. No hidden emergency surges.
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/request"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-white font-bold text-base px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                >
                  <Fuel className="w-5 h-5 text-amber-400" />
                  <span>Request Emergency Fuel</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-sm px-5 py-3.5 rounded-xl border border-zinc-300 shadow-sm transition duration-150"
                >
                  <Navigation className="w-4 h-4 text-emerald-700" />
                  <span>Track Active Rescue (#FR-8921)</span>
                </Link>
              </div>

              {/* Quick trust metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200 text-left">
                <div>
                  <div className="text-xl font-bold text-zinc-900">&lt; 20 Mins</div>
                  <div className="text-[11px] text-zinc-500 font-medium">Average Rescuer ETA</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-zinc-900">100% PESO</div>
                  <div className="text-[11px] text-zinc-500 font-medium">Explosion-Proof Cans</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-zinc-900">₹30 Base</div>
                  <div className="text-[11px] text-zinc-500 font-medium">Up to 4km delivery</div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Transparent Price Calculator Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-zinc-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-800 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Live Price Engine
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-zinc-900 text-base">
                      Instant Price Calculator
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-500">
                    See exactly what you will pay before placing your request. Complete transparency with zero surprises.
                  </p>

                  {/* Fuel Type Tabs */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl">
                    <button
                      onClick={() => setDemoFuelType("PETROL")}
                      className={`py-2 text-xs font-bold rounded-lg transition ${
                        demoFuelType === "PETROL"
                          ? "bg-white text-emerald-900 shadow-sm"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Petrol (91 Octane)
                    </button>
                    <button
                      onClick={() => setDemoFuelType("DIESEL")}
                      className={`py-2 text-xs font-bold rounded-lg transition ${
                        demoFuelType === "DIESEL"
                          ? "bg-white text-emerald-900 shadow-sm"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      Diesel (BS-VI)
                    </button>
                  </div>

                  {/* Quantity Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-700">
                      <span>Emergency Quantity:</span>
                      <span className="text-emerald-800 font-bold">{demoLitres} Litres</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="1"
                      value={demoLitres}
                      onChange={(e) => setDemoLitres(Number(e.target.value))}
                      className="w-full accent-emerald-800 h-2 bg-zinc-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>2L (Emergency restart)</span>
                      <span>15L (Canister cap)</span>
                    </div>
                  </div>

                  {/* Distance Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-zinc-700">
                      <span>Distance from Nearest Depot:</span>
                      <span className="text-emerald-800 font-bold">{demoDistance} km</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="12"
                      step="0.5"
                      value={demoDistance}
                      onChange={(e) => setDemoDistance(Number(e.target.value))}
                      className="w-full accent-emerald-800 h-2 bg-zinc-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>0.5 km</span>
                      <span className="text-emerald-700 font-bold">4.0 km (₹30 flat zone)</span>
                      <span>12.0 km</span>
                    </div>
                  </div>

                  {/* Transparent Itemized Breakdown Box */}
                  <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>
                        Fuel Subtotal ({demoLitres}L @ ₹{priceQuote.pricePerLitre}/L):
                      </span>
                      <span className="font-semibold text-zinc-900">
                        {formatCurrency(priceQuote.fuelSubtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-zinc-600">
                      <span className="flex items-center gap-1">
                        Delivery Fee ({demoDistance} km):
                        {priceQuote.isWithinFreeDistance && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            ₹30 Flat Rule
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-emerald-800">
                        {formatCurrency(priceQuote.deliveryFee)}
                      </span>
                    </div>

                    <div className="flex justify-between text-zinc-600">
                      <span>PESO Safety Canister & Handling:</span>
                      <span className="font-semibold text-zinc-900">
                        {formatCurrency(priceQuote.emergencyFee)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline">
                      <div>
                        <span className="text-sm font-bold text-zinc-950">Total Payable:</span>
                        <p className="text-[10px] text-zinc-500">Includes all taxes & delivery</p>
                      </div>
                      <span className="text-xl font-extrabold text-emerald-900">
                        {formatCurrency(priceQuote.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/request?fuel=${demoFuelType}&qty=${demoLitres}&dist=${demoDistance}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white font-bold text-sm py-3 rounded-xl transition shadow-sm"
                  >
                    <span>Proceed with this Selection</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 SIMPLE EMERGENCY STEPS) */}
      <section className="py-20 bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-emerald-800 font-bold text-xs uppercase tracking-wider">
              Fast, Safe & Frictionless
            </span>
            <h2 className="text-3xl font-extrabold text-zinc-950">
              How Fuel Rescue Works in 3 Simple Steps
            </h2>
            <p className="text-sm text-zinc-600">
              Engineered for extreme ease during stressful highway or street breakdowns. No phone tags, no waiting for hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 hover:border-emerald-300 transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-bold text-xl flex items-center justify-center shadow-md mb-5 group-hover:scale-105 transition-transform">
                1
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Share Stranded Pin</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                One-tap GPS sharing or drag the interactive map marker directly to your car, bike, or commercial vehicle location on the road.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 hover:border-emerald-300 transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-bold text-xl flex items-center justify-center shadow-md mb-5 group-hover:scale-105 transition-transform">
                2
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Choose Fuel & View Fee</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Select Petrol or Diesel (2L - 20L). Instantly receive your transparent breakdown adhering to the ₹30 flat fee for deliveries up to 4 km.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200 hover:border-emerald-300 transition-all duration-200 relative group">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white font-bold text-xl flex items-center justify-center shadow-md mb-5 group-hover:scale-105 transition-transform">
                3
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Track Rescuer & Refuel</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Watch your certified delivery partner navigate live on Leaflet road maps. They dispense fuel safely into your tank and verify completion with an OTP.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SAFETY & STATUTORY REGULATORY NOTICE */}
      <section className="py-16 bg-[#0B1510] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-950/80 to-zinc-900/90 rounded-3xl p-8 border border-emerald-800/40">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  PESO & Petroleum Rules Compliant Architecture
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Built Strictly for Safety & Regulatory Compliance
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                  Fuel delivery is a safety-critical service. Every Fuel Rescue order is filled at verified, authorized Oil Marketing Company retail outlets (such as IOCL and BPCL) into PESO-certified explosion-proof composite canisters. Delivery partners carry static ground grounding wires and fire extinguishers.
                </p>
              </div>

              <div className="md:col-span-4 flex flex-col gap-3">
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 text-xs space-y-1">
                  <div className="text-emerald-400 font-bold">Authorized Depots Only</div>
                  <div className="text-zinc-400 text-[11px]">Direct dealer verification before dispatch.</div>
                </div>
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 text-xs space-y-1">
                  <div className="text-amber-400 font-bold">Anti-Static Safety Kit</div>
                  <div className="text-zinc-400 text-[11px]">Strict two-point grounding protocol during vehicle refuel.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CONVERSION CTA */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl font-extrabold text-zinc-900">
            Need Fuel Right Now?
          </h2>
          <p className="text-sm text-zinc-600">
            Don’t leave your car unattended on dark highways or push your bike for kilometres. We have responders standing by.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/request"
              className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base px-8 py-4 rounded-xl shadow-md transition"
            >
              <span>Place Emergency Request</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
