import { NextResponse } from "next/server";
import { calculateOrderPrice } from "@/lib/pricing";
import { mockStore, INITIAL_SUPPLIERS } from "@/lib/mock-store";
import { ORDER_STATUS } from "@/lib/state-machine";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      fuelType,
      quantityLitres,
      distanceKm,
      customerLat,
      customerLng,
      deliveryAddress,
      deliveryLandmark,
      vehicleModel,
      vehiclePlate,
      paymentMethod,
    } = body;

    if (!customerLat || !customerLng) {
      return NextResponse.json(
        { success: false, error: "Customer GPS coordinates (latitude, longitude) are required." },
        { status: 400 }
      );
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { success: false, error: "Delivery address is required." },
        { status: 400 }
      );
    }

    // SERVER-AUTHORITATIVE PRICE CALCULATION
    // Any client-submitted total or fee is explicitly discarded!
    const quote = calculateOrderPrice({
      fuelType,
      quantityLitres: Number(quantityLitres),
      distanceKm: Number(distanceKm || 1.0),
    });

    const newOrder = mockStore.createOrder({
      customer_id: customerId || "44444444-4444-4444-4444-444444444444",
      customer_name: customerName || "Customer",
      customer_phone: customerPhone || "+91 98765 11111",
      supplier_id: INITIAL_SUPPLIERS[0].id,
      fuel_type: quote.fuelType,
      quantity_litres: quote.quantityLitres,
      fuel_price_per_litre: quote.pricePerLitre,
      fuel_subtotal: quote.fuelSubtotal,
      delivery_fee: quote.deliveryFee,
      emergency_fee: quote.emergencyFee,
      total_amount: quote.totalAmount,
      total_paise: quote.totalPaise,
      status: ORDER_STATUS.SEARCHING_FOR_PARTNER,
      payment_status: "PAID",
      payment_method: paymentMethod || "SIMULATED_UPI",
      customer_lat: Number(customerLat),
      customer_lng: Number(customerLng),
      delivery_address: deliveryAddress,
      delivery_landmark: deliveryLandmark || "",
      vehicle_model: vehicleModel || "Unspecified Vehicle",
      vehicle_plate: vehiclePlate || "MH-01-XX-0000",
      estimated_distance_km: quote.billableDistanceKm,
      estimated_duration_mins: Math.max(8, Math.round(quote.billableDistanceKm * 3.5)),
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const role = searchParams.get("role");

    let orders = mockStore.getOrders();
    if (customerId && role === "CUSTOMER") {
      orders = orders.filter((o) => o.customer_id === customerId);
    }

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
