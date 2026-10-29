"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { mockStore } from "@/lib/mock-store";
import {
  ChevronLeft,
  Truck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    function load() {
      setPartners([...mockStore.getPartners()]);
    }
    load();
    const unsub = mockStore.subscribe(load);
    return () => unsub();
  }, []);

  const handleToggleVerification = (partnerId, currentStatus) => {
    const newStatus = currentStatus === "VERIFIED" ? "SUSPENDED" : "VERIFIED";
    mockStore.togglePartnerVerification(partnerId, newStatus);
    setPartners([...mockStore.getPartners()]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 mb-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Admin Overview
          </Link>
          <h1 className="text-2xl font-extrabold text-zinc-950">
            Rescuer Fleet Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Audit partner credentials, PESO canister approvals, and operational duty statuses.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Rescuer Details</th>
                <th className="py-3.5 px-4">Vehicle & Kit</th>
                <th className="py-3.5 px-4">Safety Verification</th>
                <th className="py-3.5 px-4">Duty Status</th>
                <th className="py-3.5 px-4">Rating & Trips</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/80 transition">
                  <td className="py-4 px-4">
                    <div className="font-bold text-zinc-900 text-sm">{p.name}</div>
                    <div className="text-[11px] text-zinc-500">{p.phone}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      DL: {p.driving_license_number}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-semibold text-zinc-900">{p.vehicle_type}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{p.vehicle_plate}</div>
                  </td>

                  <td className="py-4 px-4">
                    {p.safety_kit_verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        PESO Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Kit Pending
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        p.is_available
                          ? "bg-green-100 text-green-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {p.is_available ? "● On Duty" : "○ Offline"}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-bold text-amber-600">★ {p.rating}</div>
                    <div className="text-[11px] text-zinc-500">{p.total_deliveries} deliveries</div>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleToggleVerification(p.id, p.status)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                        p.status === "VERIFIED"
                          ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {p.status === "VERIFIED" ? "Suspend Rescuer" : "Approve Rescuer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
