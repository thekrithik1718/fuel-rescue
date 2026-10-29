"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { mockStore } from "@/lib/mock-store";
import { ORDER_STATUS, getStatusDetails } from "@/lib/state-machine";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ChevronLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    function load() {
      setOrders([...mockStore.getOrders()]);
    }
    load();
    const unsub = mockStore.subscribe(load);
    return () => unsub();
  }, []);

  const filtered = orders.filter((o) => {
    if (filter !== "ALL" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.delivery_address?.toLowerCase().includes(q) ||
        o.vehicle_plate?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 mb-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Admin Overview
          </Link>
          <h1 className="text-2xl font-extrabold text-zinc-950">
            Emergency Dispatch Audit & Orders
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Authoritative order lifecycle inspection, pricing breakdown, and fulfillment audits.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="font-bold text-zinc-700">Filter Status:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1.5 font-semibold text-zinc-800"
          >
            <option value="ALL">All Statuses ({orders.length})</option>
            <option value={ORDER_STATUS.SEARCHING_FOR_PARTNER}>Searching for Partner</option>
            <option value={ORDER_STATUS.PARTNER_ASSIGNED}>Partner Assigned</option>
            <option value={ORDER_STATUS.ACCEPTED}>Accepted</option>
            <option value={ORDER_STATUS.PREPARING}>Preparing</option>
            <option value={ORDER_STATUS.EN_ROUTE}>En Route</option>
            <option value={ORDER_STATUS.ARRIVED}>Arrived</option>
            <option value={ORDER_STATUS.COMPLETED}>Completed</option>
            <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, or vehicle..."
            className="w-64 pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 text-xs"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Order Reference</th>
                <th className="py-3.5 px-4">Customer & Vehicle</th>
                <th className="py-3.5 px-4">Fuel & Quantity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Partner</th>
                <th className="py-3.5 px-4">Price Breakdown</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filtered.map((order) => {
                const statusInfo = getStatusDetails(order.status);

                return (
                  <tr key={order.id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-4 px-4 font-mono font-bold text-zinc-900">
                      <div>#{order.order_number}</div>
                      <div className="text-[10px] text-zinc-400 font-sans">
                        {formatDate(order.created_at)}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-900">{order.customer_name}</div>
                      <div className="text-[11px] text-zinc-500">
                        {order.vehicle_model} ({order.vehicle_plate})
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                        {order.delivery_address}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-900">{order.fuel_type}</div>
                      <div className="text-[11px] text-zinc-500">{order.quantity_litres} Litres</div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {order.partner_name ? (
                        <div>
                          <div className="font-bold text-zinc-900">{order.partner_name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {order.partner_plate}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-extrabold text-emerald-900 text-sm">
                        {formatCurrency(order.total_amount)}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Delivery: {formatCurrency(order.delivery_fee)}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-3 py-1.5 rounded-lg font-bold text-xs transition"
                      >
                        <span>Live View</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
