import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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
    const result = mockStore.atomicAcceptOrder(id, partnerId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, order: result.order });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
