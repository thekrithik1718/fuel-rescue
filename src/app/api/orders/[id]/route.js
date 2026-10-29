import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";
import { ORDER_STATUS } from "@/lib/state-machine";
import { VERIFIED_PETROL_BUNKS } from "@/lib/petrol-bunks";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    let order = mockStore.getOrderById(id);

    // If order is not in server memory (e.g. serverless cold-start or direct URL visit),
    // synthesize a realistic active demonstration order so the tracking page never spins forever.
    if (!order) {
      const defaultBunk = VERIFIED_PETROL_BUNKS[0]; // BPCL Auto Care Indiranagar
      const orderNumber = `FR-${(id || "9999").slice(0, 4).toUpperCase()}`;

      order = mockStore.createOrder({
        id: id,
        order_number: orderNumber,
        customer_id: "44444444-4444-4444-4444-444444444444",
        customer_name: "Priya Sharma",
        customer_phone: "+91 98765 11111",
        supplier_id: defaultBunk.id,
        supplier_name: defaultBunk.trade_name,
        supplier_brand: defaultBunk.brand,
        supplier_address: defaultBunk.address,
        supplier_lat: defaultBunk.lat,
        supplier_lng: defaultBunk.lng,
        fuel_type: "PETROL",
        quantity_litres: 5.0,
        fuel_price_per_litre: defaultBunk.petrol_price,
        fuel_subtotal: +(5.0 * defaultBunk.petrol_price).toFixed(2),
        delivery_fee: 30.00,
        emergency_fee: 15.00,
        total_amount: +(5.0 * defaultBunk.petrol_price + 45.00).toFixed(2),
        total_paise: Math.round((5.0 * defaultBunk.petrol_price + 45.00) * 100),
        status: ORDER_STATUS.SEARCHING_FOR_PARTNER,
        payment_status: "PAID",
        payment_method: "SIMULATED_UPI",
        customer_lat: 12.9716,
        customer_lng: 77.5946,
        delivery_address: "Cubbon Park / MG Road Junction, Bengaluru",
        delivery_landmark: "Opposite Metro Gate 2",
        vehicle_model: "Hyundai i20 White",
        vehicle_plate: "KA-05-MN-2810",
        estimated_distance_km: 2.8,
        estimated_duration_mins: 14,
        delivery_otp: "4829",
      });

      // Auto-assign available partner
      const partner = mockStore.getPartners().find((p) => p.is_available);
      if (partner) {
        try {
          order = mockStore.assignPartnerToOrder(order.id, partner.id);
        } catch (e) {
          console.warn("Could not assign partner to synthesized order:", e);
        }
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
