"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import confetti from "canvas-confetti";
import { mockStore } from "@/lib/mock-store";
import { ORDER_STATUS, getStatusDetails, validateStateTransition, ROLES } from "@/lib/state-machine";
import { getRouteDetails } from "@/lib/routing";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Flame,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Navigation,
  Car,
  AlertTriangle,
  Play,
  RotateCcw,
  KeyRound,
  ChevronLeft,
  XCircle,
  Truck,
} from "lucide-react";

// Dynamically import Leaflet Map
const DynamicMap = dynamic(() => import("@/components/map/DynamicMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-zinc-100 rounded-3xl flex items-center justify-center text-zinc-400 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
        Loading Live Leaflet Satellite Radar...
      </div>
    </div>
  ),
});

function OrderTrackingContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [partnerCoords, setPartnerCoords] = useState(null);
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const simulationIntervalRef = useRef(null);

  // Load and subscribe to order updates from mockStore
  useEffect(() => {
    function refresh() {
      const found = mockStore.getOrderById(orderId);
      if (found) {
        setOrder({ ...found });
        if (found.partner_lat && found.partner_lng) {
          setPartnerCoords([found.partner_lat, found.partner_lng]);
        }
      }
    }

    refresh();
    const unsubscribe = mockStore.subscribe(refresh);
    return () => unsubscribe();
  }, [orderId]);

  // Compute road route geometry between partner and customer
  useEffect(() => {
    if (!order || !order.customer_lat || !order.customer_lng) return;

    const origin = partnerCoords
      ? { lat: partnerCoords[0], lng: partnerCoords[1] }
      : { lat: 12.9752, lng: 77.5990 }; // default depot
    const destination = { lat: order.customer_lat, lng: order.customer_lng };

    getRouteDetails(origin, destination).then((details) => {
      if (details.geometry) {
        setRouteGeometry(details.geometry);
      }
    });
  }, [order?.customer_lat, order?.customer_lng, order?.partner_id]);

  // Trigger celebration confetti when order reaches COMPLETED
  useEffect(() => {
    if (order?.status === ORDER_STATUS.COMPLETED) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [order?.status]);

  // Simulated GPS Movement along the road route
  const handleSimulateMovement = () => {
    if (!routeGeometry || routeGeometry.length < 2) return;
    setIsSimulatingGps(true);

    // If order is not en route, update to EN_ROUTE
    if (order.status !== ORDER_STATUS.EN_ROUTE && order.status !== ORDER_STATUS.ARRIVED) {
      mockStore.updateOrderStatus(order.id, ORDER_STATUS.EN_ROUTE);
    }

    let currentIndex = 0;
    const totalSteps = routeGeometry.length;

    clearInterval(simulationIntervalRef.current);
    simulationIntervalRef.current = setInterval(() => {
      if (currentIndex < totalSteps) {
        const point = routeGeometry[currentIndex];
        setPartnerCoords(point);
        mockStore.updatePartnerLocation(order.id, point[0], point[1]);
        currentIndex++;
      } else {
        clearInterval(simulationIntervalRef.current);
        setIsSimulatingGps(false);
        // Rescuer arrived
        mockStore.updateOrderStatus(order.id, ORDER_STATUS.ARRIVED);
      }
    }, 1200); // Step every 1.2s for smooth visible demo
  };

  const handleStopSimulation = () => {
    clearInterval(simulationIntervalRef.current);
    setIsSimulatingGps(false);
  };

  const handleCancelOrder = () => {
    try {
      mockStore.updateOrderStatus(order.id, ORDER_STATUS.CANCELLED, {
        cancelled_reason: cancelReason || "Customer cancelled before arrival.",
      });
      setCancelModalOpen(false);
    } catch (e) {
      alert(e.message);
    }
  };

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-800 border-t-transparent animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-zinc-900">Locating Rescue Request...</h2>
        <p className="text-xs text-zinc-500 mt-1">Fetching order reference #{orderId}</p>
      </div>
    );
  }

  const statusInfo = getStatusDetails(order.status);
  const isCancellable = [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.SEARCHING_FOR_PARTNER,
    ORDER_STATUS.PARTNER_ASSIGNED,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.NO_PARTNER_AVAILABLE,
  ].includes(order.status);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 mb-2"
          >
            <ChevronLeft className="w-4 h-4" /> Back to My Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
              Rescue Request #{order.order_number}
            </h1>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">{statusInfo.description}</p>
        </div>

        {/* Demo Simulation Action Buttons */}
        <div className="flex items-center gap-2">
          {order.status !== ORDER_STATUS.COMPLETED && order.status !== ORDER_STATUS.CANCELLED && (
            <>
              {isSimulatingGps ? (
                <button
                  onClick={handleStopSimulation}
                  className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition"
                >
                  <span>Pause GPS Simulation</span>
                </button>
              ) : (
                <button
                  onClick={handleSimulateMovement}
                  className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Simulate Rescuer GPS</span>
                </button>
              )}
            </>
          )}

          {isCancellable && (
            <button
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-zinc-200 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Request</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Map & Partner Beacon */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                <Navigation className="w-4 h-4 text-emerald-700" />
                <span>Live Rescuer Radar Tracking</span>
              </div>
              <div className="text-[11px] font-semibold text-zinc-500">
                {order.status === ORDER_STATUS.EN_ROUTE ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                    Vehicle in motion • ~{order.estimated_duration_mins} mins away
                  </span>
                ) : order.status === ORDER_STATUS.COMPLETED ? (
                  <span className="text-zinc-600 font-semibold">Delivery Complete</span>
                ) : (
                  <span>Dispatched from {order.supplier_name || "Nearest OMC Partner Bunk"}</span>
                )}
              </div>
            </div>

            {/* Live Leaflet Map */}
            <DynamicMap
              center={[order.customer_lat, order.customer_lng]}
              customerPin={[order.customer_lat, order.customer_lng]}
              partnerPin={partnerCoords}
              routeGeometry={routeGeometry}
              estimatedDistanceKm={order.estimated_distance_km}
              estimatedDurationMins={order.estimated_duration_mins}
              height="400px"
              interactive={true}
              showRecenter={true}
            />

            {/* Verification OTP Handshake Banner */}
            {order.status !== ORDER_STATUS.COMPLETED && order.status !== ORDER_STATUS.CANCELLED && (
              <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                      Refuel Handover OTP
                    </div>
                    <div className="text-[11px] text-zinc-300">
                      Share this 4-digit code with your rescuer when they arrive
                    </div>
                  </div>
                </div>
                <div className="bg-white text-emerald-950 font-mono font-extrabold text-2xl px-4 py-1.5 rounded-xl tracking-widest shadow-inner">
                  {order.delivery_otp}
                </div>
              </div>
            )}
          </div>

          {/* Lifecycle Status Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm">Rescue Progress Timeline</h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
              {[
                { status: ORDER_STATUS.CREATED, label: "Emergency Request Placed" },
                { status: ORDER_STATUS.SEARCHING_FOR_PARTNER, label: "Broadcasting to Nearest Certified Rescuer" },
                { status: ORDER_STATUS.PARTNER_ASSIGNED, label: "Rescuer Rajesh Kumar Allocated" },
                { status: ORDER_STATUS.ACCEPTED, label: "Rescuer Accepted & Heading to Depot" },
                { status: ORDER_STATUS.PREPARING, label: "Dispensing Fuel into PESO Certified Canister" },
                { status: ORDER_STATUS.EN_ROUTE, label: "Rescuer En Route to Your Stranded Vehicle" },
                { status: ORDER_STATUS.ARRIVED, label: "Rescuer Arrived at Your Location" },
                { status: ORDER_STATUS.COMPLETED, label: "Fuel Dispensed & Vehicle Refueled" },
              ].map((step, idx) => {
                const isPassed = (order.status_history || []).some((h) => h.status === step.status);
                const isCurrent = order.status === step.status;

                return (
                  <div key={step.status} className="relative flex items-start gap-3 text-xs">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                        isCurrent
                          ? "bg-emerald-800 border-white text-white shadow-sm ring-4 ring-emerald-100"
                          : isPassed
                          ? "bg-emerald-600 border-white text-white"
                          : "bg-zinc-100 border-zinc-300 text-zinc-400"
                      }`}
                    >
                      {isPassed || isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    </div>

                    <div className="flex-1">
                      <div
                        className={`font-bold ${
                          isCurrent
                            ? "text-emerald-900 text-sm"
                            : isPassed
                            ? "text-zinc-900"
                            : "text-zinc-400"
                        }`}
                      >
                        {step.label}
                      </div>
                      {isCurrent && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {statusInfo.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Partner & Order Details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Partner Card */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="font-bold text-zinc-900 text-sm">Assigned Rescuer</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                PESO Certified
              </span>
            </div>

            {order.partner_name ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                      alt={order.partner_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">{order.partner_name}</h4>
                    <div className="text-[11px] text-zinc-500">
                      ★ 4.92 Rating • 142 Safe Deliveries
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Rescue Vehicle:</span>
                    <span className="font-bold text-zinc-900">Bajaj Pulsar 150</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">License Plate:</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {order.partner_plate || "KA-01-EQ-9412"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Equipment:</span>
                    <span className="font-semibold text-emerald-800">
                      Dual Canister + Anti-Static Kit
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${order.partner_phone || "+919876500001"}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-black text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rescuer ({order.partner_phone || "+91 98765 00001"})</span>
                </a>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500 space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-800 border-t-transparent animate-spin mx-auto" />
                <p>Matching with closest available rescuer in your service zone...</p>
              </div>
            )}
          </div>

          {/* Delivery & Billing Summary */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-zinc-900 text-sm border-b border-zinc-100 pb-2">
              Order Receipt
            </h4>

            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">Fuel:</span>
              <span className="font-bold text-zinc-900">
                {order.fuel_type} ({order.quantity_litres} Litres)
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">Vehicle:</span>
              <span className="font-bold text-zinc-900">
                {order.vehicle_model} ({order.vehicle_plate})
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-zinc-50">
              <span className="text-zinc-500">Destination:</span>
              <span className="font-semibold text-zinc-900 text-right max-w-[200px] truncate">
                {order.delivery_address}
              </span>
            </div>

            <div className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200 space-y-1.5">
              <div className="flex justify-between text-zinc-600">
                <span>Fuel Subtotal:</span>
                <span className="font-semibold text-zinc-900">
                  {formatCurrency(order.fuel_subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Delivery Fee (₹30 Policy):</span>
                <span className="font-bold text-emerald-800">
                  {formatCurrency(order.delivery_fee)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Emergency Safety Fee:</span>
                <span className="font-semibold text-zinc-900">
                  {formatCurrency(order.emergency_fee)}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-950">
                <span>Total Paid:</span>
                <span className="text-emerald-900 text-sm">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 text-center">
              Paid via {order.payment_method} • Sourced from {order.supplier_name || "Authorized OMC Bunk"}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-zinc-900 text-base">Cancel Assistance Request?</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              If another motorist has already helped you or your vehicle restarted, you can safely cancel this request with full simulated refund.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (e.g. Passerby provided fuel, car started)"
              className="w-full text-xs p-3 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-600 h-20"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-zinc-500">
          Loading Order Tracking...
        </div>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}

