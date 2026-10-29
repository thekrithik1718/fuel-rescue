"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { mockStore } from "@/lib/mock-store";
import { ORDER_STATUS, getStatusDetails, validateStateTransition, ROLES } from "@/lib/state-machine";
import { formatCurrency } from "@/lib/utils";
import {
  ChevronLeft,
  Navigation,
  Fuel,
  CheckCircle2,
  Clock,
  Phone,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Truck,
  ArrowRight,
} from "lucide-react";

// Dynamically import Leaflet Map
const DynamicMap = dynamic(() => import("@/components/map/DynamicMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] bg-zinc-100 rounded-3xl flex items-center justify-center text-zinc-400 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
        Loading Live Navigation Map...
      </div>
    </div>
  ),
});

function PartnerOrderConsoleContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    function load() {
      const found = mockStore.getOrderById(orderId);
      if (found) setOrder({ ...found });
    }
    load();
    const unsub = mockStore.subscribe(load);
    return () => unsub();
  }, [orderId]);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-800 border-t-transparent animate-spin mx-auto mb-3" />
        <h2 className="text-lg font-bold">Loading Order Console...</h2>
      </div>
    );
  }

  const handleAdvanceState = (nextStatus) => {
    setErrorMsg(null);
    try {
      validateStateTransition(order.status, nextStatus, ROLES.PARTNER);
      mockStore.updateOrderStatus(order.id, nextStatus);
      setSuccessMsg(`Status updated to ${nextStatus}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleVerifyOtpAndComplete = () => {
    setErrorMsg(null);
    if (!otpInput || otpInput.trim() !== String(order.delivery_otp).trim()) {
      setErrorMsg("Incorrect verification OTP! Please ask the customer for the code displayed on their screen.");
      return;
    }

    try {
      mockStore.updateOrderStatus(order.id, ORDER_STATUS.COMPLETED);
      setSuccessMsg("Fuel delivered and handover verified successfully!");
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const statusInfo = getStatusDetails(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/partner"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 mb-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Partner Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-zinc-950">
              Fulfillment Console #{order.order_number}
            </h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">{statusInfo.description}</p>
        </div>

        <a
          href={`tel:${order.customer_phone || "+919876511111"}`}
          className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call Customer</span>
        </a>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Workflow Transition Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Action Progression Box */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-5">
            <h3 className="font-bold text-zinc-900 text-base">Fulfillment Steps</h3>

            {/* STEP 1: PREPARING AT DEPOT */}
            {order.status === ORDER_STATUS.ACCEPTED && (
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="font-bold text-zinc-900 text-sm">Step 1: Depot Dispensing</div>
                <p className="text-xs text-zinc-500">
                  Head to {order.supplier_name || "BPCL Auto Care Indiranagar"} depot to dispense {order.quantity_litres}L of {order.fuel_type} into your certified explosion-proof container.
                </p>
                <button
                  onClick={() => handleAdvanceState(ORDER_STATUS.PREPARING)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm"
                >
                  <Fuel className="w-4 h-4" />
                  <span>Start Fuel Dispensing at Depot</span>
                </button>
              </div>
            )}

            {/* STEP 2: DEPART ON ROUTE */}
            {order.status === ORDER_STATUS.PREPARING && (
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="font-bold text-zinc-900 text-sm">Step 2: Safety Check & Departure</div>
                <p className="text-xs text-zinc-500">
                  Ensure dual canister safety valves are sealed and anti-static clip is attached to your motorcycle chassis.
                </p>
                <button
                  onClick={() => handleAdvanceState(ORDER_STATUS.EN_ROUTE)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Canister Sealed - Start Driving to Customer</span>
                </button>
              </div>
            )}

            {/* STEP 3: MARK AS ARRIVED */}
            {order.status === ORDER_STATUS.EN_ROUTE && (
              <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div className="font-bold text-zinc-900 text-sm">Step 3: Arriving at Vehicle</div>
                <p className="text-xs text-zinc-500">
                  You are approaching {order.delivery_address}. Spot {order.vehicle_model} ({order.vehicle_plate}).
                </p>
                <button
                  onClick={() => handleAdvanceState(ORDER_STATUS.ARRIVED)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Have Arrived at the Stranded Vehicle</span>
                </button>
              </div>
            )}

            {/* STEP 4: OTP VERIFICATION & HANDOVER */}
            {order.status === ORDER_STATUS.ARRIVED && (
              <div className="space-y-4 bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <span>Step 4: Verify Handshake OTP & Dispense Fuel</span>
                </div>
                <p className="text-xs text-zinc-600">
                  Ask customer for the 4-digit verification OTP shown on their Fuel Rescue screen.
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 4-Digit OTP"
                    className="w-full text-center font-mono text-xl font-bold tracking-widest px-4 py-2.5 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  />
                  <button
                    onClick={handleVerifyOtpAndComplete}
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl transition shadow-md"
                  >
                    <span>Verify Handshake & Complete Refueling</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* COMPLETED OR CANCELLED STATE */}
            {order.status === ORDER_STATUS.COMPLETED && (
              <div className="text-center py-6 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-zinc-900 text-base">Delivery Successfully Fulfilled</h4>
                <p className="text-xs text-zinc-500">
                  Payout credited to your partner wallet: {formatCurrency(order.delivery_fee)}.
                </p>
                <Link
                  href="/partner"
                  className="inline-block mt-2 text-xs font-bold text-emerald-800 hover:underline"
                >
                  Return to Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Road Navigation Map */}
          <div className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-sm space-y-2">
            <div className="font-bold text-zinc-900 text-xs px-2 pt-1 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-700" />
              <span>Customer Destination Map</span>
            </div>
            <DynamicMap
              center={[order.customer_lat, order.customer_lng]}
              customerPin={[order.customer_lat, order.customer_lng]}
              partnerPin={order.partner_lat ? [order.partner_lat, order.partner_lng] : null}
              height="300px"
              interactive={false}
            />
          </div>
        </div>

        {/* Right Column: Order Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-2">
              Dispatch Specifications
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Customer Name:</span>
                <span className="font-bold text-zinc-900">{order.customer_name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Vehicle:</span>
                <span className="font-bold text-zinc-900">
                  {order.vehicle_model} ({order.vehicle_plate})
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Fuel & Quantity:</span>
                <span className="font-bold text-zinc-900">
                  {order.fuel_type} • {order.quantity_litres} Litres
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Delivery Address:</span>
                <span className="font-semibold text-zinc-900 text-right max-w-[200px] truncate">
                  {order.delivery_address}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Landmark:</span>
                <span className="font-semibold text-amber-700 text-right">
                  {order.delivery_landmark || "Near signal"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Payment Status:</span>
                <span className="font-bold text-emerald-800">
                  {order.payment_status} ({order.payment_method})
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Your Delivery Payout:</span>
                <span className="font-extrabold text-emerald-900 text-sm">
                  {formatCurrency(order.delivery_fee)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerOrderConsolePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-zinc-500">
          Loading Partner Console...
        </div>
      }
    >
      <PartnerOrderConsoleContent />
    </Suspense>
  );
}

