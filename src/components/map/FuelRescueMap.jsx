"use client";

import React, { useEffect, useRef, useState } from "react";
import { isValidCoordinate } from "@/lib/geo-utils";
import { Compass, Navigation, RefreshCw, AlertCircle, Loader2 } from "lucide-react";

/**
 * FuelRescueMap - Uber/Rapido style Interactive Map Component
 *
 * Built on Leaflet & OpenStreetMap / CartoDB tiles.
 * Supports:
 * - Customer destination beacon
 * - Delivery partner vehicle marker
 * - Driving route polyline with live distance/ETA overlay
 * - Fit bounds and floating recenter control
 * - Draggable pin for customer location selection
 * - Non-blocking routing loading and error states
 * - 100% Free & Open Source (No API key required)
 */
export default function FuelRescueMap({
  customerLocation = null, // { lat, lng, address } or [lat, lng]
  partnerLocation = null, // { lat, lng, name } or [lat, lng]
  bunkLocation = null, // Optional { lat, lng, name, brand }
  routeGeometry = null, // Array of [lat, lng]
  onLocationSelect = null, // callback(lat, lng) for draggable pin
  isDraggable = false,
  isLoadingRoute = false,
  routeError = null,
  estimatedDistanceKm = null,
  estimatedDurationMins = null,
  isRouteEstimated = false,
  height = "380px",
  interactive = true,
  showRecenter = true,
  showRouteSummaryBadge = true,
  className = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const partnerMarkerRef = useRef(null);
  const bunkMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Normalize customer coordinates [lat, lng]
  const customerCoords = React.useMemo(() => {
    if (!customerLocation) return null;
    if (Array.isArray(customerLocation) && customerLocation.length >= 2) {
      return isValidCoordinate(customerLocation[0], customerLocation[1])
        ? [Number(customerLocation[0]), Number(customerLocation[1])]
        : null;
    }
    if (typeof customerLocation === "object" && customerLocation.lat && customerLocation.lng) {
      return isValidCoordinate(customerLocation.lat, customerLocation.lng)
        ? [Number(customerLocation.lat), Number(customerLocation.lng)]
        : null;
    }
    return null;
  }, [customerLocation]);

  // Normalize partner coordinates [lat, lng]
  const partnerCoords = React.useMemo(() => {
    if (!partnerLocation) return null;
    if (Array.isArray(partnerLocation) && partnerLocation.length >= 2) {
      return isValidCoordinate(partnerLocation[0], partnerLocation[1])
        ? [Number(partnerLocation[0]), Number(partnerLocation[1])]
        : null;
    }
    if (typeof partnerLocation === "object" && partnerLocation.lat && partnerLocation.lng) {
      return isValidCoordinate(partnerLocation.lat, partnerLocation.lng)
        ? [Number(partnerLocation.lat), Number(partnerLocation.lng)]
        : null;
    }
    return null;
  }, [partnerLocation]);

  // Recenter / Fit Bounds handler
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current && routeGeometry && routeGeometry.length > 1) {
      try {
        map.fitBounds(routePolylineRef.current.getBounds(), {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
        });
        return;
      } catch (e) {}
    }

    if (customerCoords && partnerCoords) {
      try {
        const bounds = [customerCoords, partnerCoords];
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
        return;
      } catch (e) {}
    }

    if (customerCoords) {
      map.setView(customerCoords, 15, { animate: true });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L;
    let isSubscribed = true;

    import("leaflet").then((leafletModule) => {
      if (!isSubscribed) return;
      L = leafletModule.default || leafletModule;

      // Ensure container doesn't have stale Leaflet ID on remount
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id && !mapInstanceRef.current) {
        mapContainerRef.current._leaflet_id = null;
      }

      // Initialize map instance once
      if (!mapInstanceRef.current && mapContainerRef.current) {
        const defaultCenter = customerCoords || partnerCoords || [12.9716, 77.5946];
        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          zoomControl: interactive,
          dragging: interactive,
          scrollWheelZoom: interactive ? "center" : false,
          touchZoom: interactive,
          doubleClickZoom: interactive,
        });

        // CartoDB Positron / OSM Voyager tiles (High contrast, clean urban roads)
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://carto.com/" target="_blank" rel="noreferrer">CARTO</a> & OpenStreetMap',
            maxZoom: 19,
            subdomains: "abcd",
          }
        ).addTo(map);

        mapInstanceRef.current = map;
        setMapReady(true);
      }

      const map = mapInstanceRef.current;
      if (!map) return;

      // 1. CUSTOMER DESTINATION MARKER (Red Pulsing Pin)
      if (customerCoords) {
        const customerIcon = L.divIcon({
          className: "fuel-rescue-customer-marker",
          html: `
            <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; width:32px; height:32px; border-radius:50%; background:rgba(239,68,68,0.25); animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="position:relative; width:22px; height:22px; border-radius:50%; background:#DC2626; border:3px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center;">
                <div style="width:6px; height:6px; border-radius:50%; background:#ffffff;"></div>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        if (!customerMarkerRef.current) {
          const marker = L.marker(customerCoords, {
            icon: customerIcon,
            draggable: interactive && isDraggable,
            title: "Stranded Vehicle Location",
          }).addTo(map);

          if (isDraggable && onLocationSelect) {
            marker.on("dragend", (e) => {
              const { lat, lng } = e.target.getLatLng();
              onLocationSelect(
                Math.round(lat * 1000000) / 1000000,
                Math.round(lng * 1000000) / 1000000
              );
            });
          }

          customerMarkerRef.current = marker;
        } else {
          customerMarkerRef.current.setLatLng(customerCoords);
        }
      } else if (customerMarkerRef.current) {
        map.removeLayer(customerMarkerRef.current);
        customerMarkerRef.current = null;
      }

      // 2. DELIVERY PARTNER MARKER (Emerald Vehicle Beacon)
      if (partnerCoords) {
        const partnerIcon = L.divIcon({
          className: "fuel-rescue-partner-marker",
          html: `
            <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(5,150,105,0.3); animation:pulse 2s infinite;"></div>
              <div style="position:relative; width:28px; height:28px; border-radius:50%; background:#047857; border:3px solid #ffffff; box-shadow:0 3px 12px rgba(4,120,87,0.5); display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:13px; font-weight:bold;">
                🛵
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        if (!partnerMarkerRef.current) {
          partnerMarkerRef.current = L.marker(partnerCoords, {
            icon: partnerIcon,
            title: "Assigned Delivery Rescuer",
          }).addTo(map);
        } else {
          partnerMarkerRef.current.setLatLng(partnerCoords);
        }
      } else if (partnerMarkerRef.current) {
        map.removeLayer(partnerMarkerRef.current);
        partnerMarkerRef.current = null;
      }

      // 3. ROUTE POLYLINE
      if (routeGeometry && routeGeometry.length > 1) {
        if (!routePolylineRef.current) {
          routePolylineRef.current = L.polyline(routeGeometry, {
            color: "#064E3B", // Forest green
            weight: 5,
            opacity: 0.9,
            lineJoin: "round",
            lineCap: "round",
          }).addTo(map);
        } else {
          routePolylineRef.current.setLatLngs(routeGeometry);
        }

        // Auto fit bounds
        try {
          map.fitBounds(routePolylineRef.current.getBounds(), {
            padding: [45, 45],
            maxZoom: 16,
            animate: true,
          });
        } catch (e) {}
      } else if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      } else if (customerCoords && !partnerCoords) {
        map.setView(customerCoords, map.getZoom() || 14);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [customerCoords, partnerCoords, routeGeometry, isDraggable, interactive, onLocationSelect]);

  // Clean map destruction on complete component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-sm bg-zinc-100 ${className}`}
      style={{ height }}
    >
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Floating Route Summary / Distance & ETA Overlay */}
      {showRouteSummaryBadge && (estimatedDistanceKm !== null || isLoadingRoute) && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-200 shadow-md text-xs flex items-center gap-2">
          {isLoadingRoute ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
              <span className="font-semibold text-zinc-600">Calculating driving route...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <span>{estimatedDistanceKm} km</span>
                <span className="text-zinc-300">•</span>
                <span className="text-emerald-800">
                  {estimatedDurationMins ? `~${estimatedDurationMins} mins` : "In Transit"}
                </span>
              </div>
              {isRouteEstimated && (
                <span className="text-[10px] bg-zinc-100 text-zinc-500 font-medium px-1.5 py-0.5 rounded">
                  Road model
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Non-blocking Route Error Pill */}
      {routeError && (
        <div className="absolute top-3 right-3 z-[1000] bg-amber-50/95 backdrop-blur-md border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>{routeError}</span>
        </div>
      )}

      {/* Floating Recenter Map Button */}
      {showRecenter && interactive && mapReady && (
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter Map View"
          title="Recenter Map View"
          className="absolute bottom-3 right-3 z-[1000] bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 font-bold p-2.5 rounded-xl border border-zinc-200 shadow-md transition duration-150 flex items-center gap-1.5 text-xs"
        >
          <Compass className="w-4 h-4 text-emerald-800" />
          <span className="hidden sm:inline">Recenter</span>
        </button>
      )}

      {/* Draggable Pin Helper Tooltip */}
      {isDraggable && onLocationSelect && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          Drag pin to adjust vehicle location
        </div>
      )}
    </div>
  );
}
