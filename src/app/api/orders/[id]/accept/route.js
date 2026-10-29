import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { ORDER_STATUS } from "@/lib/state-machine";
import { VERIFIED_PETROL_BUNKS } from "@/lib/petrol-bunks";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: "partnerId is required." },
        { status: 400 }
      );
    }

    // 1. If Supabase is configured, use atomic database RPC function
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc("accept_order_atomic", {
        p_order_id: id,
        p_partner_id: partnerId,
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
      }

      if (data && !data.success) {
        return NextResponse.json({ success: false, error: data.error }, { status: 409 });
      }

      return NextResponse.json({ success: true, order: data.order });
    }

    // 2. In Demo / Local Mode: Use atomic CAS in mockStore
    // If order was lost from server memory due to serverless cold-start, reconstruct it
    let order = mockStore.getOrderById(id);
    if (!order) {
      const defaultBunk = VERIFIED_PETROL_BUNKS[0];
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
    }

    const result = mockStore.atomicAcceptOrder(id, partnerId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, order: result.order });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
