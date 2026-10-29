"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import { calculateOrderPrice, DEFAULT_PRICING_CONFIG, DEFAULT_FUEL_RATES } from "@/lib/pricing";
import { getRouteDetails, calculateHaversineDistanceKm } from "@/lib/routing";
import { mockStore, INITIAL_SUPPLIERS, INITIAL_SERVICE_ZONES } from "@/lib/mock-store";
import { ORDER_STATUS } from "@/lib/state-machine";
import { formatCurrency } from "@/lib/utils";
import { findNearestPetrolBunk, VERIFIED_PETROL_BUNKS } from "@/lib/petrol-bunks";
import {
  MapPin,
  Fuel,
  Navigation,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Car,
  Clock,
  ArrowRight,
  Info,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

// Dynamically import Leaflet Map to ensure zero SSR errors
const DynamicMap = dynamic(() => import("@/components/map/DynamicMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin" />
        Loading Live Leaflet Map...
      </div>
    </div>
  ),
});

function RequestFuelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Active Zone
  const activeZone = INITIAL_SERVICE_ZONES[0];

  // Form States
  const [currentStep, setCurrentStep] = useState(1);
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.6412 }); // Default Indiranagar, Bangalore
  const [address, setAddress] = useState("12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru");
  const [landmark, setLandmark] = useState("Opposite Toit Brewpub, near road signal");
  const [fuelType, setFuelType] = useState("PETROL");
  const [quantity, setQuantity] = useState(1); // Selectable from 1 Litre itself
  const [vehicleModel, setVehicleModel] = useState("Hyundai i20 White");
  const [vehiclePlate, setVehiclePlate] = useState("KA-05-MN-2810");
  const [paymentMethod, setPaymentMethod] = useState("SIMULATED_UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Dynamic Nearest Petrol Bunk Detection
  const [nearestBunkData, setNearestBunkData] = useState(() =>
    findNearestPetrolBunk(12.9716, 77.6412, "PETROL")
  );

  // Recalculate nearest bunk whenever customer coordinates or fuel type changes
  useEffect(() => {
    try {
      const result = findNearestPetrolBunk(coords.lat, coords.lng, fuelType);
      setNearestBunkData(result);
    } catch (e) {
      console.error("Failed to find nearest bunk:", e);
    }
  }, [coords.lat, coords.lng, fuelType]);

  const connectedBunk = nearestBunkData?.nearestBunk;
  const currentBunkRate =
    fuelType === "DIESEL" ? connectedBunk?.diesel_price : connectedBunk?.petrol_price;

  // Route & Pricing Details
  const [routeInfo, setRouteInfo] = useState({
    distanceKm: 1.2,
    durationMinutes: 9,
    geometry: null,
  });

  // Read URL query params if user clicked from homepage calculator
  useEffect(() => {
    const qFuel = searchParams.get("fuel");
    const qQty = searchParams.get("qty");
    if (qFuel === "PETROL" || qFuel === "DIESEL") setFuelType(qFuel);
    if (qQty && Number(qQty) >= 1 && Number(qQty) <= 20) setQuantity(Number(qQty));
  }, [searchParams]);

  // Recalculate route whenever customer coordinates or connected nearest bunk changes
  useEffect(() => {
    let isCancelled = false;
    async function updateRoute() {
      if (!connectedBunk) return;
      try {
        const bunkCoords = { lat: connectedBunk.lat, lng: connectedBunk.lng };
        const details = await getRouteDetails(bunkCoords, coords);
        if (!isCancelled) {
          setRouteInfo(details);
        }
      } catch (e) {
        // fallback haversine
        const dist = calculateHaversineDistanceKm(
          connectedBunk.lat,
          connectedBunk.lng,
          coords.lat,
          coords.lng
        );
        if (!isCancelled) {
          setRouteInfo({
            distanceKm: Math.max(0.5, Math.round(dist * 1.28 * 10) / 10),
            durationMinutes: Math.max(8, Math.round(dist * 3.5)),
            geometry: null,
          });
        }
      }
    }
    updateRoute();
    return () => {
      isCancelled = true;
    };
  }, [coords, connectedBunk?.id]);

  // Compute price quote strictly according to ₹30 rule using nearest bunk's live fuel rate
  const quote = calculateOrderPrice({
    fuelType,
    quantityLitres: quantity,
    distanceKm: routeInfo.distanceKm,
    customFuelRate: currentBunkRate,
  });

  // Handle GPS location request and reverse geocode
  const handleGetLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newCoords = {
          lat: Math.round(pos.coords.latitude * 1000000) / 1000000,
          lng: Math.round(pos.coords.longitude * 1000000) / 1000000,
        };
        setCoords(newCoords);
        try {
          const res = await fetch(`/api/geocode?lat=${newCoords.lat}&lng=${newCoords.lng}`);
          if (res.ok) {
            const data = await res.json();
            if (data.address) {
              setAddress(data.address);
              return;
            }
          }
        } catch (e) {}
        setAddress(`GPS Location Pin: ${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}`);
      },
      (err) => {
        setGpsError(
          "Location permission was denied or unavailable. You can drag the map pin manually."
        );
      },
      { timeout: 7000 }
    );
  };

  const handlePinMoved = async (newLat, newLng) => {
    setCoords({ lat: newLat, lng: newLng });
    try {
      const res = await fetch(`/api/geocode?lat=${newLat}&lng=${newLng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          setAddress(data.address);
          return;
        }
      }
    } catch (e) {}
    setAddress(`Road Pin (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`);
  };

  // Submit Order via Server API (Server-Authoritative Price Validation)
  const handleSubmitOrder = async () => {
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user?.id,
          customerName: user?.full_name,
          customerPhone: user?.phone,
          fuelType,
          quantityLitres: quantity,
          distanceKm: routeInfo.distanceKm,
          customerLat: coords.lat,
          customerLng: coords.lng,
          deliveryAddress: address,
          deliveryLandmark: landmark,
          vehicleModel,
          vehiclePlate,
          paymentMethod,
          supplierId: connectedBunk?.id,
          supplierName: connectedBunk?.trade_name,
          supplierAddress: connectedBunk?.address,
          supplierLat: connectedBunk?.lat,
          supplierLng: connectedBunk?.lng,
          customFuelRate: currentBunkRate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Order creation failed.");
      }

      const createdOrder = data.order;

      // Save order into client-side mockStore so live tracking page has instant access
      mockStore.upsertOrder(createdOrder);

      // Auto-assign available delivery partner in client store for seamless demo experience
      const availablePartner = mockStore.getPartners().find((p) => p.is_available && p.safety_kit_verified);
      if (availablePartner) {
        try {
          mockStore.assignPartnerToOrder(createdOrder.id, availablePartner.id);
        } catch (e) {
          console.warn("Auto-assignment deferred:", e);
        }
      }

      // Redirect immediately to live tracking
      router.push(`/orders/${createdOrder.id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Heading & Stepper */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          Emergency Fuel Dispatch
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
          Request Roadside Fuel Delivery
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Authorized OMC petrol and diesel delivered in certified explosion-proof canisters.
        </p>

        {/* Stepper progress */}
        <div className="flex items-center gap-3 mt-6">
          <div
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
              currentStep === 1
                ? "bg-emerald-800 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            <span>1. Stranded Location</span>
          </div>
          <span className="text-zinc-300">→</span>
          <div
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
              currentStep === 2
                ? "bg-emerald-800 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            <span>2. Fuel & Vehicle</span>
          </div>
          <span className="text-zinc-300">→</span>
          <div
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
              currentStep === 3
                ? "bg-emerald-800 text-white"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            <span>3. Review & Checkout</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Steps */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: LOCATION PIN */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 text-base">
                    Step 1: Set Vehicle Location
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Drag the red marker directly onto your car/bike location.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-2 rounded-xl border border-emerald-200 transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                  Use Current GPS
                </button>
              </div>

              {gpsError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Leaflet Map with Draggable Pin */}
              <DynamicMap
                customerPin={[coords.lat, coords.lng]}
                center={[coords.lat, coords.lng]}
                onPinChange={handlePinMoved}
                height="320px"
              />

              {/* Exact GPS Coordinates Indicator & Map API Note */}
              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-semibold text-zinc-700">Target Coordinates:</span>
                  <span className="font-mono font-bold text-zinc-950">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 bg-white px-2 py-0.5 rounded border border-zinc-200">
                  OpenStreetMap (Zero API Key Required)
                </span>
              </div>

              {/* Nearest Connected Petrol Bunk Card */}
              {connectedBunk && (
                <div className="bg-gradient-to-br from-emerald-50/80 via-white to-zinc-50 border border-emerald-300/80 rounded-2xl p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                        Nearest Connected Fuel Bunk
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-900 text-amber-300">
                      {connectedBunk.brand} Authorized
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-100">
                    <div>
                      <div className="font-extrabold text-zinc-950 text-sm">
                        {connectedBunk.name}
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {connectedBunk.address}
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="text-xs font-bold text-emerald-800">
                        ~{routeInfo.distanceKm} km from your GPS
                      </div>
                      <div className="text-[10px] font-semibold text-zinc-500">
                        {routeInfo.distanceKm <= 4.0 ? (
                          <span className="text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                            ₹30 Flat Delivery Zone (≤ 4km)
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                            ₹30 + ₹14/km beyond 4km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] bg-white p-2.5 rounded-xl border border-emerald-100 gap-2">
                    <span className="text-zinc-600 font-medium">Bunk Real-Time Sourcing Rates:</span>
                    <span className="font-bold text-zinc-900">
                      Petrol: <span className="text-emerald-800 font-extrabold">₹{connectedBunk.petrol_price}/L</span> • Diesel: <span className="text-emerald-800 font-extrabold">₹{connectedBunk.diesel_price}/L</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Street Address / Highway Kilometer Stone
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g. 100 Feet Road, near Indiranagar Metro Station"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Nearby Landmark / Vehicle Spotting Notes
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="e.g. Hazard lights flashing on left shoulder next to HP petrol pump"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm"
              >
                <span>Confirm Location & Select Fuel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: FUEL & VEHICLE DETAILS */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 text-base">
                    Step 2: Select Fuel Type & Quantity
                  </h3>
                  <p className="text-xs text-zinc-500">
                    PESO safety certified containers: 2L to 20L limit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* Fuel Type Selector */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setFuelType("PETROL")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    fuelType === "PETROL"
                      ? "border-emerald-700 bg-emerald-50/50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-900 text-sm">Petrol (91 Octane)</span>
                    <Fuel className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-base font-extrabold text-emerald-900">
                    ₹{connectedBunk ? connectedBunk.petrol_price : DEFAULT_FUEL_RATES.PETROL}/L
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {connectedBunk ? `${connectedBunk.brand} Live Bunk Rate` : "Cars, motorcycles, scooters"}
                  </div>
                </div>

                <div
                  onClick={() => setFuelType("DIESEL")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    fuelType === "DIESEL"
                      ? "border-emerald-700 bg-emerald-50/50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-900 text-sm">Diesel (BS-VI)</span>
                    <Fuel className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-base font-extrabold text-emerald-900">
                    ₹{connectedBunk ? connectedBunk.diesel_price : DEFAULT_FUEL_RATES.DIESEL}/L
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {connectedBunk ? `${connectedBunk.brand} Live Bunk Rate` : "SUVs, transport, cabs"}
                  </div>
                </div>
              </div>

              {/* Quantity Options - Selectable from 1 Litre itself */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
                  <span>Emergency Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold flex items-center justify-center transition active:scale-95"
                    >
                      -
                    </button>
                    <span className="text-emerald-900 text-sm font-extrabold min-w-[65px] text-center">
                      {quantity} Litre{quantity > 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                      className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold flex items-center justify-center transition active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {[1, 2, 3, 5, 10, 15, 20].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setQuantity(amt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        quantity === amt
                          ? "bg-emerald-800 text-white border-emerald-900 shadow-sm"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {amt}L
                    </button>
                  ))}
                </div>

                {quantity === 1 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold">1 Litre Quick Restart:</span> Ultra-light sealed container sufficient to safely restart a stalled engine and cruise to the nearest fuel station.
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle Info */}
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <h4 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-zinc-500" />
                  Vehicle Identification
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">
                      Vehicle Make & Model
                    </label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="e.g. Hyundai i20 White"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1">
                      Registration Plate Number
                    </label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 uppercase"
                      placeholder="e.g. KA-05-MN-2810"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm"
              >
                <span>Review Pricing & Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: CHECKOUT & PAYMENT */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-900 text-base">
                    Step 3: Payment & Dispatch Trigger
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Transparent checkout with simulated payment gateway.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 font-semibold flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Select Payment Method (Simulation)
                </label>

                <div className="space-y-2">
                  <div
                    onClick={() => setPaymentMethod("SIMULATED_UPI")}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      paymentMethod === "SIMULATED_UPI"
                        ? "border-emerald-700 bg-emerald-50/50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                        UPI
                      </div>
                      <div>
                        <div className="font-bold text-xs text-zinc-900">
                          Instant UPI (GPay / PhonePe / Paytm)
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Simulated zero-wait payment gateway
                        </div>
                      </div>
                    </div>
                    {paymentMethod === "SIMULATED_UPI" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    )}
                  </div>

                  <div
                    onClick={() => setPaymentMethod("SIMULATED_CARD")}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      paymentMethod === "SIMULATED_CARD"
                        ? "border-emerald-700 bg-emerald-50/50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-zinc-700" />
                      <div>
                        <div className="font-bold text-xs text-zinc-900">
                          Credit / Debit Card
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Visa, Mastercard, RuPay
                        </div>
                      </div>
                    </div>
                    {paymentMethod === "SIMULATED_CARD" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    )}
                  </div>

                  <div
                    onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      paymentMethod === "CASH_ON_DELIVERY"
                        ? "border-emerald-700 bg-emerald-50/50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 text-white font-bold text-xs flex items-center justify-center">
                        COD
                      </div>
                      <div>
                        <div className="font-bold text-xs text-zinc-900">
                          Pay Rescuer on Delivery
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Cash or UPI QR upon fuel dispensing
                        </div>
                      </div>
                    </div>
                    {paymentMethod === "CASH_ON_DELIVERY" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    )}
                  </div>
                </div>
              </div>

              {/* Security & OTP Disclaimer */}
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs space-y-1.5 text-zinc-600">
                <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Secure Handshake Protocol</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Upon arrival, your rescuer will dispense the exact requested quantity directly into your tank. A 4-digit verification OTP will appear on your tracking screen to complete the handover.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-900 hover:to-black text-white font-bold text-base py-3.5 rounded-xl transition shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Broadcasting to Nearest Rescuer...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Request Rescuer ({formatCurrency(quote.totalAmount)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Price & Order Summary Sidebar */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="font-bold text-zinc-900 text-sm">Order Summary</span>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                ETA: ~{routeInfo.durationMinutes} mins
              </span>
            </div>

            {/* Selected item overview */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Connected Bunk:</span>
                <span className="font-bold text-emerald-900 text-right">
                  {connectedBunk ? `${connectedBunk.name}` : "BPCL Auto Care Indiranagar"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Fuel Selected:</span>
                <span className="font-bold text-zinc-900">
                  {fuelType === "PETROL" ? "Petrol (Speed 91)" : "Diesel (BS-VI)"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Requested Volume:</span>
                <span className="font-bold text-zinc-900">{quantity} Litre{quantity > 1 ? "s" : ""}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Vehicle:</span>
                <span className="font-bold text-zinc-900">
                  {vehicleModel} ({vehiclePlate})
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-500">Estimated Road Distance:</span>
                <span className="font-bold text-zinc-900">
                  {routeInfo.distanceKm} km (from connected bunk)
                </span>
              </div>
            </div>

            {/* Transparent ₹30 Breakdown */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Fuel ({quantity}L @ ₹{quote.pricePerLitre}/L bunk rate):</span>
                <span className="font-semibold text-zinc-900">
                  {formatCurrency(quote.fuelSubtotal)}
                </span>
              </div>

              <div className="flex justify-between text-zinc-600">
                <span className="flex items-center gap-1">
                  Delivery Fee ({routeInfo.distanceKm} km):
                  {quote.isWithinFreeDistance && (
                    <span className="bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.2 rounded text-[10px]">
                      ₹30 Flat
                    </span>
                  )}
                </span>
                <span className="font-bold text-emerald-800">
                  {formatCurrency(quote.deliveryFee)}
                </span>
              </div>

              <div className="flex justify-between text-zinc-600">
                <span>Safety Canister & Handling:</span>
                <span className="font-semibold text-zinc-900">
                  {formatCurrency(quote.emergencyFee)}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-zinc-950">Total Payable:</span>
                  <div className="text-[10px] text-zinc-400">Fixed upfront price</div>
                </div>
                <span className="text-xl font-extrabold text-emerald-900">
                  {formatCurrency(quote.totalAmount)}
                </span>
              </div>
            </div>

            {/* Depots & Safety Notice */}
            <div className="space-y-1.5 text-[11px] text-zinc-500">
              <div className="flex items-center gap-1.5 text-zinc-800 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Authorized OMC Depot Dispensing</span>
              </div>
              <p>
                Sourced from {INITIAL_SUPPLIERS[0].trade_name} (PESO License #{INITIAL_SUPPLIERS[0].license_number}).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RequestFuelPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-zinc-500">
          Loading Fuel Rescue Request...
        </div>
      }
    >
      <RequestFuelContent />
    </Suspense>
  );
}

