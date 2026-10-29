"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { mockStore } from "@/lib/mock-store";
import { calculateDeliveryFee } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import {
  Sliders,
  CheckCircle2,
  ChevronLeft,
  DollarSign,
  ShieldAlert,
  Info,
} from "lucide-react";

export default function AdminPricingPage() {
  const [rule, setRule] = useState(null);
  const [baseFee, setBaseFee] = useState(30);
  const [includedDistance, setIncludedDistance] = useState(4.0);
  const [perKmRate, setPerKmRate] = useState(14);
  const [handlingFee, setHandlingFee] = useState(15);
  const [savedMsg, setSavedMsg] = useState(false);

  // Live simulation test input
  const [testDist, setTestDist] = useState(6.5);

  useEffect(() => {
    const currentRule = mockStore.state.pricingRules[0];
    if (currentRule) {
      setRule(currentRule);
      setBaseFee(currentRule.base_delivery_fee);
      setIncludedDistance(currentRule.included_distance_km);
      setPerKmRate(currentRule.per_km_rate);
      setHandlingFee(currentRule.emergency_handling_fee);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (rule) {
      mockStore.updatePricingRule(rule.id, {
        base_delivery_fee: Number(baseFee),
        included_distance_km: Number(includedDistance),
        per_km_rate: Number(perKmRate),
        emergency_handling_fee: Number(handlingFee),
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    }
  };

  const simulatedFee = calculateDeliveryFee(testDist, {
    baseDeliveryFee: Number(baseFee),
    includedDistanceKm: Number(includedDistance),
    additionalPerKmRate: Number(perKmRate),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 mb-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Admin Overview
        </Link>
        <h1 className="text-2xl font-extrabold text-zinc-950">
          Core Pricing Engine & Delivery Fee Policy
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Server-authoritative pricing rules persisted in PostgreSQL / mock store.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Pricing rules updated successfully! Changes immediately take effect on all new quotes.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-5">
          <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>Configurable Pricing Parameters</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Base Delivery Fee */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Base Delivery Fee (₹)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Mandated standard: ₹30 fixed fee for deliveries up to 4.0 km.
              </p>
            </div>

            {/* Included Distance */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Included Flat Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={includedDistance}
                onChange={(e) => setIncludedDistance(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Distance threshold covered by base delivery fee (default: 4.0 km).
              </p>
            </div>

            {/* Extra per-km rate */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Additional Fee per Extra Kilometer (₹/km)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Applied only when road distance exceeds {includedDistance} km.
              </p>
            </div>

            {/* Safety & Canister Fee */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                PESO Certified Canister & Safety Handling (₹)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={handlingFee}
                onChange={(e) => setHandlingFee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-bold"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Explosion-proof canister seal and anti-static clip inspection fee.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm"
          >
            <span>Save Pricing Configuration</span>
          </button>
        </form>

        {/* Right Column: Live Policy Simulation Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-2">
              Formula Verification Simulator
            </h3>

            <div className="p-3 bg-zinc-50 rounded-xl font-mono text-[11px] text-zinc-700 border border-zinc-200">
              delivery_fee = ₹{baseFee} + max(0, dist - {includedDistance}) × ₹{perKmRate}
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between font-bold text-zinc-800">
                <span>Test Distance:</span>
                <span className="text-emerald-800">{testDist} km</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="15"
                step="0.5"
                value={testDist}
                onChange={(e) => setTestDist(Number(e.target.value))}
                className="w-full accent-emerald-800 h-2 bg-zinc-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-600">Base Fee (up to {includedDistance}km):</span>
                <span className="font-bold text-zinc-900">₹{baseFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">
                  Extra Distance ({Math.max(0, testDist - includedDistance)} km @ ₹{perKmRate}):
                </span>
                <span className="font-bold text-zinc-900">
                  ₹{Math.max(0, testDist - includedDistance) * perKmRate}
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-950 text-sm">
                <span>Calculated Delivery Fee:</span>
                <span>{formatCurrency(simulatedFee)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
