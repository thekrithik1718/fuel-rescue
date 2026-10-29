"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { mockStore } from "@/lib/mock-store";
import { ORDER_STATUS } from "@/lib/state-machine";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Shield,
  Truck,
  Fuel,
  Users,
  Settings,
  ArrowUpRight,
  MapPin,
  Clock,
  Layers,
  Sliders,
  DollarSign,
  AlertTriangle,
  Building2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    function load() {
      setOrders(mockStore.getOrders());
      setPartners(mockStore.getPartners());
      setPricingRules(mockStore.state.pricingRules);
      setSuppliers(mockStore.state.suppliers);
    }
    load();
    const unsub = mockStore.subscribe(load);
    return () => unsub();
  }, []);

  const totalOrders = orders.length;
  const activeOrders = orders.filter(
    (o) => !["COMPLETED", "CANCELLED"].includes(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length;
  const availablePartners = partners.filter((p) => p.is_available).length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5 text-zinc-800" />
            <span>Platform Governance & Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
            Operations Command Center
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time monitoring of roadside dispatches, partner fleet, and depot compliance.
          </p>
        </div>

        {/* Navigation Bar for Admin Subsections */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/orders"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 transition"
          >
            All Orders
          </Link>
          <Link
            href="/admin/partners"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 transition"
          >
            Rescuer Fleet
          </Link>
          <Link
            href="/admin/pricing"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white transition shadow-sm"
          >
            ₹30 Pricing Policy Engine
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="text-xs font-semibold text-zinc-500">Total Requests</div>
          <div className="text-2xl font-black text-zinc-950 mt-1">{totalOrders}</div>
          <div className="text-[10px] text-zinc-400 mt-1">Lifetime platform volume</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-300 ring-2 ring-emerald-50 shadow-sm">
          <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            Active Dispatches
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{activeOrders}</div>
          <div className="text-[10px] text-emerald-700 mt-1">Currently on roads</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="text-xs font-semibold text-zinc-500">Completed Rescues</div>
          <div className="text-2xl font-black text-zinc-950 mt-1">{completedOrders}</div>
          <div className="text-[10px] text-zinc-400 mt-1">Safe OTP handovers</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="text-xs font-semibold text-zinc-500">Fleet Available</div>
          <div className="text-2xl font-black text-zinc-950 mt-1">
            {availablePartners} / {partners.length}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">PESO Kits Verified</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-xs font-semibold text-zinc-500">Total GMV (Paise Acc.)</div>
          <div className="text-2xl font-black text-zinc-950 mt-1">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Includes ₹30 delivery fee</div>
        </div>
      </div>

      {/* Main Command Center Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Order Dispatch Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-zinc-950 text-base">Live Orders & Dispatches</h3>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                View Table <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-4 rounded-2xl border border-zinc-100 hover:border-zinc-300 bg-zinc-50/60 transition flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-zinc-800">
                        #{o.order_number}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800">
                        {o.status}
                      </span>
                      <span className="text-xs font-semibold text-zinc-600">
                        {o.fuel_type} • {o.quantity_litres}L
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span className="truncate max-w-[280px] sm:max-w-md">
                        {o.delivery_address}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Motorist: {o.customer_name} • Rescuer: {o.partner_name || "Unassigned"}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div className="text-sm font-extrabold text-emerald-900">
                      {formatCurrency(o.total_amount)}
                    </div>
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-zinc-700 hover:text-black bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-xs"
                    >
                      Inspect <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quick Settings & Compliance Cards */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Pricing Engine Summary */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="font-bold text-zinc-900 text-sm">Configured Pricing Rule</span>
              <Link
                href="/admin/pricing"
                className="text-[11px] font-bold text-emerald-800 hover:underline"
              >
                Modify
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Base Delivery Fee:</span>
                <span className="font-bold text-emerald-800">₹30.00</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Included Distance:</span>
                <span className="font-bold text-zinc-900">4.0 km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Extra per-km Rate:</span>
                <span className="font-bold text-zinc-900">₹14.00 / km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Safety & Canister Fee:</span>
                <span className="font-bold text-zinc-900">₹15.00</span>
              </div>
            </div>
          </div>

          {/* Authorized Suppliers */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="font-bold text-zinc-900 text-sm">Authorized OMC Depots</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                {suppliers.length} Verified
              </span>
            </div>
            <div className="space-y-3">
              {suppliers.map((s) => (
                <div key={s.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                  <div className="font-bold text-zinc-900">{s.trade_name}</div>
                  <div className="text-[11px] text-zinc-500">
                    License: <span className="font-mono">{s.license_number}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold">
                    ✓ PESO Verification Active
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
