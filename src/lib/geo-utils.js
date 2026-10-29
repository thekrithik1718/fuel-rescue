/**
 * Fuel Rescue - Geospatial & External Navigation Utilities
 *
 * Implements strict coordinate validation and external Google Maps navigation URL
 * generation without requiring any Google Maps API key or paid services.
 */

/**
 * Validates whether latitude and longitude are valid finite geographic coordinates.
 * Explicitly guards against JavaScript Number(null) -> 0 coercion.
 *
 * @param {number|string} latitude - Latitude in degrees (-90 to +90)
 * @param {number|string} longitude - Longitude in degrees (-180 to +180)
 * @returns {boolean} True if coordinates are valid and within legal ranges
 */
export function isValidCoordinate(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return false;
  }

  if (typeof latitude === "string" && latitude.trim() === "") return false;
  if (typeof longitude === "string" && longitude.trim() === "") return false;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  if (lat < -90 || lat > 90) {
    return false;
  }

  if (lng < -180 || lng > 180) {
    return false;
  }

  return true;
}

/**
 * Generates an external Google Maps navigation URL for driving directions.
 *
 * Conforms to Google Maps URLs Universal API:
 * https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=driving
 *
 * Deep links into the user's native Google Maps app (Android/iOS) or
 * web browser without requiring a Google Maps API key.
 *
 * @param {number|string} latitude - Destination latitude
 * @param {number|string} longitude - Destination longitude
 * @returns {string|null} Formatted Google Maps URL, or null if coordinates are invalid
 */
export function getGoogleMapsNavigationUrl(latitude, longitude) {
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  const destination = `${lat},${lng}`;

  return (
    "https://www.google.com/maps/dir/" +
    `?api=1&destination=${encodeURIComponent(destination)}` +
    "&travelmode=driving"
  );
}

/**
 * Formats coordinates for clean, accessible display.
 *
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @param {number} [precision=6]
 * @returns {string} Formatted coordinate string, or "Coordinates unavailable"
 */
export function formatCoordinates(latitude, longitude, precision = 6) {
  if (!isValidCoordinate(latitude, longitude)) {
    return "Coordinates unavailable";
  }
  const lat = Number(latitude).toFixed(precision);
  const lng = Number(longitude).toFixed(precision);
  return `${lat}, ${lng}`;
}
