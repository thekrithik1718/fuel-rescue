/**
 * Fuel Rescue - Routing & Road Distance Engine
 *
 * Provides real road-distance and journey time estimates via OSRM with
 * a transparent fallback estimation model if the external public API is
 * rate-limited or unreachable.
 */

// Approximate road winding factor for Indian urban corridors (driving vs straight-line)
const ROAD_CIRCUITY_FACTOR = 1.28;
const AVERAGE_URBAN_SPEED_KMH = 26; // Realistic metro response speed with safety canister

/**
 * Calculates straight-line distance using the Haversine formula
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
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
 * Estimates road distance and ETA based on coordinates
 * Tries OSRM public API with timeout, falls back safely to circuity model if network fails.
 */
export async function getRouteDetails(origin, destination) {
  const { lat: lat1, lng: lon1 } = origin;
  const { lat: lat2, lng: lon2 } = destination;

  const straightDist = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);

  // If origin and destination are virtually identical (< 50m)
  if (straightDist < 0.05) {
    return {
      distanceKm: 0.1,
      durationMinutes: 3,
      geometry: [[lat1, lon1], [lat2, lon2]],
      isEstimated: true,
      source: "direct",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800); // 2.8s fast timeout

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.max(3, Math.round(route.duration / 60));
        
        // GeoJSON coordinates are [lon, lat], Leaflet wants [lat, lon]
        const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        return {
          distanceKm: Math.max(0.2, distanceKm),
          durationMinutes,
          geometry,
          isEstimated: false,
          source: "osrm_real_road",
        };
      }
    }
  } catch (err) {
    // Graceful fallback to urban road network model
  }

  // Fallback: Estimated road distance with road curvature factor
  const roadDist = Math.round(straightDist * ROAD_CIRCUITY_FACTOR * 10) / 10;
  const etaMinutes = Math.max(
    5,
    Math.round((roadDist / AVERAGE_URBAN_SPEED_KMH) * 60) + 4 // +4 mins prep
  );

  // Interpolate intermediate points for smooth demo path visualization
  const steps = 8;
  const geometry = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    // Add slight natural curve offset
    const curveOffset = Math.sin(ratio * Math.PI) * 0.0025;
    geometry.push([
      lat1 + (lat2 - lat1) * ratio + curveOffset,
      lon1 + (lon2 - lon1) * ratio - curveOffset,
    ]);
  }

  return {
    distanceKm: Math.max(0.5, roadDist),
    durationMinutes: etaMinutes,
    geometry,
    isEstimated: true,
    source: "urban_network_model_fallback",
  };
}
