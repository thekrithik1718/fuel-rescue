"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { mockStore } from "@/lib/mock-store";
import { useAuth } from "@/lib/auth-context";
import { ORDER_STATUS, getStatusDetails } from "@/lib/state-machine";
import { validatePartnerAcceptance } from "@/lib/dispatch";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  Fuel,
  ArrowRight,
  ShieldCheck,
  Phone,
  Power,
  Navigation,
  Award,
} from "lucide-react";

export default function PartnerDashboardPage() {
  const { user } = useAuth();
  // Rajesh Kumar partner record
  const [partner, setPartner] = useState(null);
  const [orders, setOrders] = useState([]);
  const [incomingDispatches, setIncomingDispatches] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [acceptError, setAcceptError] = useState(null);

  useEffect(() => {
    function load() {
      const p = mockStore.getPartners()[0]; // Rajesh Kumar
      setPartner({ ...p });

      const allOrders = mockStore.getOrders();
      setOrders([...allOrders]);

      // Find incoming orders offered to this partner or waiting for partner
      const offered = allOrders.filter(
        (o) =>
          [ORDER_STATUS.SEARCHING_FOR_PARTNER, ORDER_STATUS.PARTNER_ASSIGNED].includes(o.status) &&
          (!o.partner_id || o.partner_id === p?.id)
      );
      setIncomingDispatches(offered);

      // Find currently active delivery assigned to this partner
      const active = allOrders.find(
        (o) =>
          o.partner_id === p?.id &&
          [
            ORDER_STATUS.ACCEPTED,
            ORDER_STATUS.PREPARING,
            ORDER_STATUS.EN_ROUTE,
            ORDER_STATUS.ARRIVED,
          ].includes(o.status)
      );
      setActiveOrder(active || null);
    }

    load();
    const unsub = mockStore.subscribe(load);
    return () => unsub();
  }, []);

  const handleToggleDuty = () => {
    if (!partner) return;
    const updated = mockStore.togglePartnerAvailability(partner.id, !partner.is_available);
    setPartner({ ...updated });
  };

  // Atomic Partner Acceptance via Server API
  const handleAcceptOrder = async (order) => {
    setAcceptError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: partner.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAcceptError(data.error || "Could not accept order.");
        return;
      }
      // Update local partner view
      setOrders([...mockStore.getOrders()]);
    } catch (err) {
      setAcceptError(err.message);
    }
  };

  const handleRejectOrder = (order) => {
    // Re-broadcasting
    mockStore.updateOrderStatus(order.id, ORDER_STATUS.SEARCHING_FOR_PARTNER, {
      partner_id: null,
      notes: `Rejected by partner ${partner.name}. Re-broadcasting.`,
    });
  };

  if (!partner) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Partner Status Header */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
              alt={partner.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-zinc-950">{partner.name}</h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                PESO Certified Rescuer
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Vehicle: Bajaj Pulsar 150 ({partner.vehicle_plate}) • Depots: BPCL Indiranagar
            </p>
          </div>
        </div>

        {/* Duty Toggle Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-zinc-900">
              {partner.is_available ? "On Duty (Accepting Dispatches)" : "Off Duty (Offline)"}
            </div>
            <div className="text-[11px] text-zinc-400">
              {partner.is_available ? "Broadcasting radar active" : "No orders will be sent"}
            </div>
          </div>
          <button
            onClick={handleToggleDuty}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-sm ${
              partner.is_available
                ? "bg-emerald-800 text-white hover:bg-emerald-900"
                : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
            }`}
          >
            <Power className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-zinc-200">
          <div className="text-xs font-medium text-zinc-500">Today’s Earnings</div>
          <div className="text-2xl font-extrabold text-zinc-950 mt-1">₹1,840</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">+₹30 base on each</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-zinc-200">
          <div className="text-xs font-medium text-zinc-500">Deliveries Completed</div>
          <div className="text-2xl font-extrabold text-zinc-950 mt-1">{partner.total_deliveries}</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">100% verified canisters</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-zinc-200">
          <div className="text-xs font-medium text-zinc-500">Customer Rating</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">★ 4.92</div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Top 5% Rescuer</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-zinc-200">
          <div className="text-xs font-medium text-zinc-500">Safety Kit Status</div>
          <div className="text-sm font-bold text-emerald-800 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Verified & Sealed
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Fire extinguisher checked</div>
        </div>
      </div>

      {acceptError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{acceptError}</span>
        </div>
      )}

      {/* ACTIVE RESCUE ORDER (IF IN PROGRESS) */}
      {activeOrder && (
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
            <div>
              <span className="text-[10px] bg-amber-400 text-black font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                Current Active Assignment
              </span>
              <h2 className="text-xl font-bold mt-1">
                Order #{activeOrder.order_number} • {activeOrder.fuel_type} ({activeOrder.quantity_litres}L)
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                Status: {activeOrder.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 text-zinc-200">
              <div className="text-zinc-400 text-[11px]">Motorist:</div>
              <div className="font-bold text-white text-sm">{activeOrder.customer_name}</div>
              <div>{activeOrder.delivery_address}</div>
              <div className="text-amber-300">
                Landmark: {activeOrder.delivery_landmark || "Near road"}
              </div>
            </div>

            <div className="space-y-1 text-zinc-200">
              <div className="text-zinc-400 text-[11px]">Vehicle:</div>
              <div className="font-bold text-white text-sm">
                {activeOrder.vehicle_model} ({activeOrder.vehicle_plate})
              </div>
              <div>Delivery Payout: {formatCurrency(activeOrder.delivery_fee)}</div>
              <div className="pt-1">
                <span className="text-zinc-400 text-[11px]">Exact GPS: </span>
                <span className="font-mono font-bold text-amber-300 text-xs">
                  {activeOrder.customer_lat.toFixed(6)}, {activeOrder.customer_lng.toFixed(6)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/partner/orders/${activeOrder.id}`}
              className="inline-flex items-center gap-2 bg-white text-emerald-950 hover:bg-zinc-100 font-extrabold text-xs px-5 py-3 rounded-xl transition shadow-md"
            >
              <Navigation className="w-4 h-4 text-emerald-800" />
              <span>Open Rescuer Console & Navigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${activeOrder.customer_lat},${activeOrder.customer_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-xs px-4 py-3 rounded-xl transition shadow-md"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Turn-by-Turn GPS Navigation</span>
            </a>

            <a
              href={`tel:${activeOrder.customer_phone || "+919876511111"}`}
              className="inline-flex items-center gap-2 bg-emerald-800/80 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-3 rounded-xl border border-emerald-700 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Customer</span>
            </a>
          </div>
        </div>
      )}

      {/* INCOMING EMERGENCY DISPATCH OFFERS */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-zinc-950 text-base">Incoming Dispatch Broadcasts</h3>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            {incomingDispatches.length} Available
          </span>
        </div>

        {incomingDispatches.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 space-y-1">
            <Truck className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
            <p className="font-semibold text-zinc-600">No pending dispatches right now.</p>
            <p>You are active on radar. New emergency requests will alert you immediately.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingDispatches.map((req) => (
              <div
                key={req.id}
                className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 hover:border-emerald-300 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      #{req.order_number}
                    </span>
                    <h4 className="font-bold text-zinc-900 text-sm">
                      {req.fuel_type} • {req.quantity_litres} Litres (
                      {req.vehicle_model || "Stranded Motorist"})
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-emerald-900">
                      {formatCurrency(req.delivery_fee)}
                    </div>
                    <div className="text-[10px] text-zinc-500">Partner Earnings</div>
                  </div>
                </div>

                <div className="text-xs text-zinc-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{req.delivery_address}</span>
                </div>

                {req.customer_lat && req.customer_lng && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-semibold text-zinc-500">Exact GPS:</span>
                    <span className="font-mono font-bold text-zinc-800 bg-zinc-200/70 px-2 py-0.5 rounded">
                      {req.customer_lat.toFixed(6)}, {req.customer_lng.toFixed(6)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${req.customer_lat},${req.customer_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline font-semibold ml-auto"
                    >
                      Preview in Navigation →
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-200 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>~{req.estimated_distance_km || 3.8} km away</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRejectOrder(req)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-200 transition"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptOrder(req)}
                      className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
