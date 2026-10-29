"use client";

import React, { useEffect, useRef } from "react";

export default function DynamicMap({
  center = [12.9716, 77.5946],
  zoom = 14,
  customerPin = null, // [lat, lng]
  partnerPin = null, // [lat, lng]
  routeGeometry = null, // Array of [lat, lng]
  onPinChange = null, // callback(lat, lng) when draggable customer pin moves
  serviceRadiusKm = null,
  height = "380px",
  interactive = true,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const partnerMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const radiusCircleRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L;
    import("leaflet").then((leafletModule) => {
      L = leafletModule.default || leafletModule;

      // Fix default Leaflet asset paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: customerPin || center,
          zoom: zoom,
          zoomControl: interactive,
          dragging: interactive,
          scrollWheelZoom: interactive ? "center" : false,
        });

        // Use high-contrast, beautiful CartoDB Positron / OSM tiles
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> & OpenStreetMap',
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // 1. Customer Location Marker (Red Emergency Beacon)
      if (customerPin) {
        const customerIcon = L.divIcon({
          className: "custom-pulsing-marker",
          html: `<div style="background-color:#EF4444; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
                  <div style="background:white; width:6px; height:6px; border-radius:50%;"></div>
                 </div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        if (!customerMarkerRef.current) {
          const marker = L.marker(customerPin, {
            icon: customerIcon,
            draggable: interactive && Boolean(onPinChange),
          }).addTo(map);

          if (onPinChange) {
            marker.on("dragend", (e) => {
              const { lat, lng } = e.target.getLatLng();
              onPinChange(Math.round(lat * 1000000) / 1000000, Math.round(lng * 1000000) / 1000000);
            });
          }

          customerMarkerRef.current = marker;
        } else {
          customerMarkerRef.current.setLatLng(customerPin);
        }
      }

      // 2. Partner Rescuer Marker (Green Bike Beacon)
      if (partnerPin) {
        const partnerIcon = L.divIcon({
          className: "custom-partner-marker",
          html: `<div style="background-color:#059669; width:26px; height:26px; border-radius:50%; border:3px solid white; box-shadow:0 3px 10px rgba(5,150,105,0.4); display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:bold;">
                  ⛽
                 </div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        if (!partnerMarkerRef.current) {
          partnerMarkerRef.current = L.marker(partnerPin, { icon: partnerIcon }).addTo(map);
        } else {
          partnerMarkerRef.current.setLatLng(partnerPin);
        }
      }

      // 3. Service Zone Radius Circle
      if (serviceRadiusKm && !radiusCircleRef.current) {
        radiusCircleRef.current = L.circle(center, {
          color: "#165B3E",
          fillColor: "#165B3E",
          fillOpacity: 0.04,
          radius: serviceRadiusKm * 1000,
          weight: 1.5,
          dashArray: "4, 6",
        }).addTo(map);
      }

      // 4. Route Polyline
      if (routeGeometry && routeGeometry.length > 1) {
        if (!routePolylineRef.current) {
          routePolylineRef.current = L.polyline(routeGeometry, {
            color: "#0F3F2B",
            weight: 5,
            opacity: 0.85,
            lineJoin: "round",
          }).addTo(map);
        } else {
          routePolylineRef.current.setLatLngs(routeGeometry);
        }

        // Fit bounds to display both points
        try {
          map.fitBounds(routePolylineRef.current.getBounds(), { padding: [40, 40] });
        } catch (e) {}
      }
    });

    return () => {
      // Cleanup on unmount if needed
    };
  }, [customerPin, partnerPin, routeGeometry, serviceRadiusKm, interactive]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      {onPinChange && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          Drag pin to pinpoint vehicle location
        </div>
      )}
    </div>
  );
}
