"use client";

import React from "react";
import FuelRescueMap from "./FuelRescueMap";

/**
 * DynamicMap - Compatibility wrapper over FuelRescueMap
 *
 * Keeps all existing imports in the codebase working while providing
 * the upgraded interactive map features.
 */
export default function DynamicMap({
  center = [12.9716, 77.5946],
  zoom = 14,
  customerPin = null, // [lat, lng]
  partnerPin = null, // [lat, lng]
  routeGeometry = null, // Array of [lat, lng]
  onPinChange = null, // callback(lat, lng)
  serviceRadiusKm = null,
  height = "380px",
  interactive = true,
  isLoadingRoute = false,
  routeError = null,
  estimatedDistanceKm = null,
  estimatedDurationMins = null,
  isRouteEstimated = false,
  showRecenter = true,
  className = "",
}) {
  return (
    <FuelRescueMap
      customerLocation={customerPin || center}
      partnerLocation={partnerPin}
      routeGeometry={routeGeometry}
      onLocationSelect={onPinChange}
      isDraggable={Boolean(onPinChange)}
      height={height}
      interactive={interactive}
      isLoadingRoute={isLoadingRoute}
      routeError={routeError}
      estimatedDistanceKm={estimatedDistanceKm}
      estimatedDurationMins={estimatedDurationMins}
      isRouteEstimated={isRouteEstimated}
      showRecenter={showRecenter}
      className={className}
    />
  );
}
