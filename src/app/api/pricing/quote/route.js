import { NextResponse } from "next/server";
import { calculateOrderPrice } from "@/lib/pricing";

export async function POST(request) {
  try {
    const body = await request.json();
    const { fuelType, quantityLitres, distanceKm } = body;

    // Server-authoritative calculation
    const quote = calculateOrderPrice({
      fuelType,
      quantityLitres: Number(quantityLitres),
      distanceKm: Number(distanceKm),
    });

    return NextResponse.json({ success: true, quote });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
