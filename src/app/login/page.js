"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ROLES } from "@/lib/state-machine";
import { Flame, Shield, Truck, User, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { switchUser, availableProfiles } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleQuickLogin = (profileId, targetRoute) => {
    switchUser(profileId);
    router.push(targetRoute);
  };

  const handleManualLogin = (e) => {
    e.preventDefault();
    // Default to customer
    switchUser(availableProfiles[3].id);
    router.push("/orders");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center mx-auto shadow-md">
          <Flame className="w-6 h-6 text-amber-400 fill-amber-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-950">Fuel Rescue Portal</h1>
        <p className="text-xs text-zinc-500">
          Sign in or select a pre-authenticated role for immediate testing.
        </p>
      </div>

      {/* Quick 1-Click Role Login for Evaluators */}
      <div className="bg-emerald-50/70 rounded-3xl p-5 border border-emerald-200 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-emerald-700" />
          <span>Evaluation Fast-Login</span>
        </div>
        <p className="text-[11px] text-zinc-600">
          Click any role below to instantly load that role’s dashboard and active data:
        </p>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => handleQuickLogin("44444444-4444-4444-4444-444444444444", "/orders")}
            className="w-full p-3 bg-white hover:bg-emerald-100/50 rounded-xl border border-emerald-200 text-left transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-emerald-700" />
              <div>
                <div className="font-bold text-xs text-zinc-900">Customer: Priya Sharma</div>
                <div className="text-[10px] text-zinc-500">Track active order #FR-8921</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </button>

          <button
            onClick={() => handleQuickLogin("22222222-2222-2222-2222-222222222222", "/partner")}
            className="w-full p-3 bg-white hover:bg-emerald-100/50 rounded-xl border border-emerald-200 text-left transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-emerald-700" />
              <div>
                <div className="font-bold text-xs text-zinc-900">Rescuer: Rajesh Kumar</div>
                <div className="text-[10px] text-zinc-500">Bajaj Pulsar • Dispatch radar</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </button>

          <button
            onClick={() => handleQuickLogin("11111111-1111-1111-1111-111111111111", "/admin")}
            className="w-full p-3 bg-white hover:bg-emerald-100/50 rounded-xl border border-emerald-200 text-left transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-zinc-800" />
              <div>
                <div className="font-bold text-xs text-zinc-900">Administrator: Super Admin</div>
                <div className="text-[10px] text-zinc-500">Full operations command & pricing</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleManualLogin} className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4 text-xs">
        <div>
          <label className="block font-bold text-zinc-700 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. driver@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label className="block font-bold text-zinc-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-zinc-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
