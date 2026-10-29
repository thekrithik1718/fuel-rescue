/**
 * Fuel Rescue - Routing & Road Distance Engine
 *
 * Provides real road-distance and journey time estimates via OSRM with
 * strict coordinate validation, request caching, timeout guards, and
 * a transparent fallback estimation model if the external public API is
 * rate-limited or unreachable.
 */

import { isValidCoordinate } from "./geo-utils";

// Approximate road winding factor for Indian urban corridors (driving vs straight-line)
const ROAD_CIRCUITY_FACTOR = 1.28;
const AVERAGE_URBAN_SPEED_KMH = 26; // Realistic metro response speed with safety canister

// In-memory cache to prevent repeated route requests for identical coordinates
const routeCache = new Map();
const MAX_CACHE_SIZE = 100;

function getCacheKey(origin, destination) {
  const oLat = Number(origin.lat).toFixed(4);
  const oLng = Number(origin.lng).toFixed(4);
  const dLat = Number(destination.lat).toFixed(4);
  const dLng = Number(destination.lng).toFixed(4);
  return `${oLat},${oLng}->${dLat},${dLng}`;
}

/**
 * Calculates straight-line distance using the Haversine formula.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Straight-line distance in kilometers
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Estimates road distance, driving route geometry, and travel time based on coordinates.
 * Tries OSRM public API with timeout, falls back safely to circuity model if network fails.
 *
 * @param {object} origin - { lat, lng }
 * @param {object} destination - { lat, lng }
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - Optional external abort signal
 * @returns {Promise<object>} Route details with geometry and estimates
 */
export async function getRouteDetails(origin, destination, options = {}) {
  if (!origin || !destination) {
    return {
      success: false,
      error: "Origin and destination coordinates are required.",
      distanceKm: null,
      durationMinutes: null,
      etaText: "ETA unavailable",
      geometry: null,
      isEstimated: false,
      source: "invalid_input",
    };
  }

  const lat1 = Number(origin.lat);
  const lon1 = Number(origin.lng);
  const lat2 = Number(destination.lat);
  const lon2 = Number(destination.lng);

  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return {
      success: false,
      error: "Invalid geographic coordinates provided for route calculation.",
      distanceKm: null,
      durationMinutes: null,
      etaText: "ETA unavailable",
      geometry: null,
      isEstimated: false,
      source: "invalid_coordinates",
    };
  }

  // Check in-memory cache
  const cacheKey = getCacheKey({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  const straightDist = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);

  // If origin and destination are virtually identical (< 50m)
  if (straightDist < 0.05) {
    const directResult = {
      success: true,
      distanceKm: 0.1,
      durationMinutes: 2,
      etaText: "~2 mins (at location)",
      geometry: [[lat1, lon1], [lat2, lon2]],
      isEstimated: true,
      source: "direct_arrival",
    };
    routeCache.set(cacheKey, directResult);
    return directResult;
  }

  // Attempt real road routing via OSRM
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3200); // 3.2s timeout

    // Link external abort signal if provided
    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distanceKm = Math.max(0.2, Math.round((route.distance / 1000) * 10) / 10);
        const durationMinutes = Math.max(3, Math.round(route.duration / 60));
        
        // GeoJSON coordinates are [lon, lat], Leaflet wants [lat, lon]
        const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        const result = {
          success: true,
          distanceKm,
          durationMinutes,
          etaText: `~${durationMinutes} mins driving`,
          geometry,
          isEstimated: false,
          source: "osrm_real_road",
        };

        if (routeCache.size >= MAX_CACHE_SIZE) {
          const firstKey = routeCache.keys().next().value;
          routeCache.delete(firstKey);
        }
        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    // Graceful fallback to urban road circuity model if network fails or times out
  }

  // Fallback: Estimated road distance with urban road curvature factor (1.28x)
  const roadDist = Math.max(0.5, Math.round(straightDist * ROAD_CIRCUITY_FACTOR * 10) / 10);
  const etaMinutes = Math.max(
    5,
    Math.round((roadDist / AVERAGE_URBAN_SPEED_KMH) * 60) + 3 // +3 mins dispatch prep
  );

  // Generate intermediate points along path for smooth polyline display
  const steps = 10;
  const geometry = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const curveOffset = Math.sin(ratio * Math.PI) * 0.0022;
    geometry.push([
      lat1 + (lat2 - lat1) * ratio + curveOffset,
      lon1 + (lon2 - lon1) * ratio - curveOffset,
    ]);
  }

  const fallbackResult = {
    success: true,
    distanceKm: roadDist,
    durationMinutes: etaMinutes,
    etaText: `~${etaMinutes} mins (est. road route)`,
    geometry,
    isEstimated: true,
    source: "urban_circuity_fallback",
  };

  if (routeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = routeCache.keys().next().value;
    routeCache.delete(firstKey);
  }
  routeCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}
