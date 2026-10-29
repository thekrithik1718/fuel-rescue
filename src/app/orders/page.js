"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { mockStore } from "@/lib/mock-store";
import { useAuth } from "@/lib/auth-context";
import { getStatusDetails } from "@/lib/state-machine";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Flame,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  Navigation,
  Fuel,
  Receipt,
  Plus,
} from "lucide-react";

export default function OrdersListPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    function load() {
      const all = mockStore.getOrders();
      setOrders([...all]);
    }
    load();
    const unsub = mockStore.subscribe(load);
    return () => unsub();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filter === "ACTIVE") {
      return !["COMPLETED", "CANCELLED"].includes(o.status);
    }
    if (filter === "COMPLETED") {
      return o.status === "COMPLETED";
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
            Emergency Requests & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time tracking and verified fuel purchase invoices.
          </p>
        </div>

        <Link
          href="/request"
          className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Emergency Request</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        {["ALL", "ACTIVE", "COMPLETED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === tab
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tab === "ALL" && `All Requests (${orders.length})`}
            {tab === "ACTIVE" &&
              `Active In-Progress (${orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length})`}
            {tab === "COMPLETED" &&
              `Fulfilled (${orders.filter((o) => o.status === "COMPLETED").length})`}
          </button>
        ))}
      </div>

      {/* Order Cards Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 space-y-3">
          <Fuel className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="font-bold text-zinc-800 text-base">No Requests Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You don’t have any rescue requests matching this filter. If you’re currently stranded, click below.
          </p>
          <Link
            href="/request"
            className="inline-flex items-center gap-2 bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Request Rescue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusDetails(order.status);
            const isActive = !["COMPLETED", "CANCELLED"].includes(order.status);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-6 border transition hover:shadow-md relative overflow-hidden ${
                  isActive ? "border-emerald-300 ring-2 ring-emerald-50" : "border-zinc-200"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-emerald-800 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Rescue
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono font-bold text-zinc-500">
                        #{order.order_number}
                      </div>
                      <h3 className="font-extrabold text-zinc-950 text-base">
                        {order.fuel_type} • {order.quantity_litres} Litres
                      </h3>
                      <div className="text-[11px] text-zinc-400">
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Destination info */}
                  <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100 text-xs space-y-1">
                    <div className="flex items-start gap-1.5 text-zinc-700">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>
                    {order.vehicle_model && (
                      <div className="text-[11px] text-zinc-500 pl-5">
                        {order.vehicle_model} • {order.vehicle_plate}
                      </div>
                    )}
                  </div>

                  {/* Price breakdown pill */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                    <div>
                      <span className="text-zinc-500">Total Paid:</span>{" "}
                      <span className="font-extrabold text-emerald-900 text-sm">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400">
                      Delivery: {formatCurrency(order.delivery_fee)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isActive ? "Track Live Rescue" : "View Receipt"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
