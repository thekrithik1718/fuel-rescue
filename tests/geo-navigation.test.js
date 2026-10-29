import { describe, it, expect } from "vitest";
import { isValidCoordinate, getGoogleMapsNavigationUrl, formatCoordinates } from "../src/lib/geo-utils";
import { calculateHaversineDistanceKm, getRouteDetails } from "../src/lib/routing";

describe("Geospatial Utilities - Coordinate Validation", () => {
  it("should validate standard geographic coordinates", () => {
    // Bangalore MG Road
    expect(isValidCoordinate(12.9716, 77.5946)).toBe(true);

    // Boundary limits
    expect(isValidCoordinate(90, 180)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
    expect(isValidCoordinate(0, 0)).toBe(true);
  });

  it("should reject out-of-bounds latitude or longitude", () => {
    expect(isValidCoordinate(90.0001, 77.5946)).toBe(false); // Latitude > 90
    expect(isValidCoordinate(-90.0001, 77.5946)).toBe(false); // Latitude < -90
    expect(isValidCoordinate(12.9716, 180.0001)).toBe(false); // Longitude > 180
    expect(isValidCoordinate(12.9716, -180.0001)).toBe(false); // Longitude < -180
  });

  it("should reject non-numeric, null, undefined, or NaN coordinates", () => {
    expect(isValidCoordinate(NaN, 77.5946)).toBe(false);
    expect(isValidCoordinate(12.9716, NaN)).toBe(false);
    expect(isValidCoordinate(null, 77.5946)).toBe(false);
    expect(isValidCoordinate(12.9716, undefined)).toBe(false);
    expect(isValidCoordinate("abc", "def")).toBe(false);
    expect(isValidCoordinate(Infinity, 77.5946)).toBe(false);
  });
});

describe("External Google Maps Navigation URL Construction", () => {
  it("should construct valid Universal Google Maps Navigation URL", () => {
    const lat = 12.971598;
    const lng = 77.594562;

    const url = getGoogleMapsNavigationUrl(lat, lng);
    expect(url).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=12.971598%2C77.594562&travelmode=driving"
    );
  });

  it("should return null for invalid or missing coordinates instead of creating broken links", () => {
    expect(getGoogleMapsNavigationUrl(null, 77.5946)).toBeNull();
    expect(getGoogleMapsNavigationUrl(undefined, undefined)).toBeNull();
    expect(getGoogleMapsNavigationUrl(120, 77.5946)).toBeNull();
    expect(getGoogleMapsNavigationUrl(12.9716, 200)).toBeNull();
    expect(getGoogleMapsNavigationUrl(NaN, 77.5946)).toBeNull();
  });
});

describe("Coordinate Formatting", () => {
  it("should format coordinates cleanly to standard 6 decimal places", () => {
    expect(formatCoordinates(12.97159812, 77.59456289)).toBe("12.971598, 77.594563");
  });

  it("should return fallback text for invalid coordinates", () => {
    expect(formatCoordinates(null, null)).toBe("Coordinates unavailable");
  });
});

describe("Routing Engine - Safe Execution & Caching", () => {
  it("should reject route requests with missing or invalid coordinates gracefully", async () => {
    const res1 = await getRouteDetails(null, { lat: 12.9716, lng: 77.5946 });
    expect(res1.success).toBe(false);
    expect(res1.etaText).toBe("ETA unavailable");
    expect(res1.geometry).toBeNull();

    const res2 = await getRouteDetails({ lat: "invalid", lng: 77.5946 }, { lat: 12.9716, lng: 77.5946 });
    expect(res2.success).toBe(false);
    expect(res2.etaText).toBe("ETA unavailable");
  });

  it("should compute distance and ETA for identical or near-identical coordinates (<50m)", async () => {
    const origin = { lat: 12.9716, lng: 77.5946 };
    const destination = { lat: 12.97161, lng: 77.59461 };

    const res = await getRouteDetails(origin, destination);
    expect(res.success).toBe(true);
    expect(res.distanceKm).toBeLessThanOrEqual(0.1);
    expect(res.durationMinutes).toBeLessThanOrEqual(3);
    expect(res.geometry.length).toBe(2);
  });

  it("should return route geometry, distance, and duration for valid coordinates", async () => {
    // Indiranagar to Koramangala (~5 km)
    const origin = { lat: 12.9752, lng: 77.6412 };
    const destination = { lat: 12.9352, lng: 77.6245 };

    const res = await getRouteDetails(origin, destination);
    expect(res.success).toBe(true);
    expect(res.distanceKm).toBeGreaterThan(0);
    expect(res.durationMinutes).toBeGreaterThan(0);
    expect(Array.isArray(res.geometry)).toBe(true);
    expect(res.geometry.length).toBeGreaterThan(1);
    expect(["osrm_real_road", "urban_circuity_fallback"]).toContain(res.source);
  });

  it("should leverage in-memory cache for repeated coordinate pairs to avoid duplicate network calls", async () => {
    const origin = { lat: 12.9752, lng: 77.6412 };
    const destination = { lat: 12.9352, lng: 77.6245 };

    const start = performance.now();
    const res1 = await getRouteDetails(origin, destination);
    const time1 = performance.now() - start;

    const startCache = performance.now();
    const res2 = await getRouteDetails(origin, destination);
    const timeCache = performance.now() - startCache;

    expect(res1.distanceKm).toBe(res2.distanceKm);
    expect(res1.durationMinutes).toBe(res2.durationMinutes);
    expect(timeCache).toBeLessThan(time1 + 10); // Instant retrieval from cache
  });
});
