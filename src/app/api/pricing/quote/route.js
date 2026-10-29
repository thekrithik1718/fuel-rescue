import { NextResponse } from "next/server";
import { calculateOrderPrice } from "@/lib/pricing";
import { findNearestPetrolBunk } from "@/lib/petrol-bunks";

export async function POST(request) {
  try {
    const body = await request.json();
    const { fuelType, quantityLitres, distanceKm, customFuelRate, customerLat, customerLng } = body;

    let appliedRate = customFuelRate ? Number(customFuelRate) : undefined;
    let appliedDistance = Number(distanceKm);
    let nearestBunkInfo = null;

    if (customerLat && customerLng) {
      const nearest = findNearestPetrolBunk(Number(customerLat), Number(customerLng), fuelType);
      nearestBunkInfo = nearest.nearestBunk;
      if (appliedRate === undefined) {
        appliedRate = nearest.fuelPricePerLitre;
      }
      if (isNaN(appliedDistance) || appliedDistance <= 0) {
        appliedDistance = nearest.distanceKm;
      }
    }

    // Server-authoritative calculation
    const quote = calculateOrderPrice({
      fuelType,
      quantityLitres: Number(quantityLitres),
      distanceKm: appliedDistance || 1.0,
      customFuelRate: appliedRate,
    });

    return NextResponse.json({
      success: true,
      quote,
      nearestBunk: nearestBunkInfo,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
