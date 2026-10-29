"use client";

import React from "react";
import { Navigation, ExternalLink, AlertTriangle } from "lucide-react";
import { getGoogleMapsNavigationUrl, isValidCoordinate } from "@/lib/geo-utils";

/**
 * GoogleMapsNavButton - External Driving Navigation Button
 *
 * Securely launches native Google Maps or device navigation app using validated coordinates.
 * Operates without requiring any Google Maps API keys or third-party paid accounts.
 */
export default function GoogleMapsNavButton({
  latitude,
  longitude,
  destinationName = "Customer Destination",
  label = "Navigate to Customer",
  className = "",
  size = "md", // "sm" | "md" | "lg"
  showSubtext = true,
  disabled = false,
}) {
  const hasValidCoords = isValidCoordinate(latitude, longitude);
  const navUrl = hasValidCoords ? getGoogleMapsNavigationUrl(latitude, longitude) : null;
  const isButtonDisabled = disabled || !hasValidCoords;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2.5 text-xs font-bold rounded-xl gap-2",
    lg: "px-5 py-3 text-sm font-extrabold rounded-2xl gap-2.5",
  }[size] || "px-4 py-2.5 text-xs font-bold rounded-xl gap-2";

  if (!hasValidCoords) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className={`w-full inline-flex items-center justify-center bg-zinc-100 text-zinc-400 font-bold border border-zinc-200 cursor-not-allowed opacity-60 ${sizeClasses} ${className}`}
          title="Customer GPS coordinates are unavailable or invalid."
        >
          <AlertTriangle className="w-4 h-4 text-zinc-400" />
          <span>Coordinates Unavailable for Navigation</span>
        </button>
        {showSubtext && (
          <p className="text-[10px] text-zinc-400 text-center">
            GPS destination has not been set yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <a
        href={navUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} in Google Maps`}
        className={`w-full inline-flex items-center justify-center bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-900 hover:to-black active:scale-[0.99] text-white shadow-md hover:shadow-lg transition-all duration-150 ${sizeClasses} ${className} ${
          isButtonDisabled ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
        }`}
      >
        <Navigation className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
        <span>{label}</span>
        <ExternalLink className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0 opacity-80" />
      </a>
      {showSubtext && (
        <p className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1">
          <span>Launches Google Maps external voice navigation</span>
          <span className="font-semibold text-emerald-700">• No API key needed</span>
        </p>
      )}
    </div>
  );
}
