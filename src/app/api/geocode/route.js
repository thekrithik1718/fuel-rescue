import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: "lat and lng query parameters are required" },
        { status: 400 }
      );
    }

    const nLat = Number(lat);
    const nLng = Number(lng);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${nLat}&lon=${nLng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "FuelRescue-EmergencyPlatform/1.0",
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || "";
          const city = data.address?.city || data.address?.state_district || "Bengaluru";
          const formatted = road ? `${road}, ${city}` : data.display_name;
          return NextResponse.json({
            success: true,
            address: formatted,
            fullAddress: data.display_name,
            coordinates: { lat: nLat, lng: nLng },
            source: "nominatim",
          });
        }
      }
    } catch (err) {
      // Graceful fallback if network timeout or rate-limited
    }

    // Default clean coordinate label
    return NextResponse.json({
      success: true,
      address: `Road Pin (${nLat.toFixed(4)}, ${nLng.toFixed(4)})`,
      coordinates: { lat: nLat, lng: nLng },
      source: "coordinate_fallback",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
