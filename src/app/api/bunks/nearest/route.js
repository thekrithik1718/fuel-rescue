import { NextResponse } from "next/server";
import { findNearestPetrolBunk, VERIFIED_PETROL_BUNKS } from "@/lib/petrol-bunks";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const fuelType = searchParams.get("fuelType") || "PETROL";

    if (!lat || !lng) {
      return NextResponse.json(
        {
          success: false,
          error: "Latitude and longitude query parameters are required.",
        },
        { status: 400 }
      );
    }

    const result = findNearestPetrolBunk(Number(lat), Number(lng), fuelType);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to locate nearest petrol bunk.",
      },
      { status: 500 }
    );
  }
}
