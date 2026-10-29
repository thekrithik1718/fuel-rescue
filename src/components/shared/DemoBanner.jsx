"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { mockStore } from "@/lib/mock-store";
import { ROLES } from "@/lib/state-machine";
import { ShieldAlert, Users, RotateCcw, Check, Sparkles } from "lucide-react";

export default function DemoBanner() {
  const { role, switchUser, availableProfiles, user } = useAuth();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    mockStore.resetToDefaults();
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      window.location.reload();
    }, 800);
  };

  return (
    <div className="bg-zinc-950 text-white text-xs py-2 px-4 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Demo badge & PESO Notice */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-wider text-[10px]">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            Evaluation Simulation Mode
          </span>
          <span className="text-zinc-400 hidden sm:inline">
            Simulated Doorstep Fuel Delivery Demonstration • Testing ₹30/4km dispatch engine (Not a live commercial service)
          </span>
        </div>

        {/* Right: Quick Role Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 font-medium">Active Role:</span>
            <select
              value={user?.id || ""}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
            >
              {availableProfiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                  {p.role === ROLES.CUSTOMER && "👤 Customer: "}
                  {p.role === ROLES.PARTNER && "🛵 Rescuer: "}
                  {p.role === ROLES.ADMIN && "🛡️ Admin: "}
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded-lg border border-zinc-700 transition"
            title="Reset seed data to initial state"
          >
            {resetSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Reset!</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
