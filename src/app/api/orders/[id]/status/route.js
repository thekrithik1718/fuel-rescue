import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock-store";
import { validateStateTransition } from "@/lib/state-machine";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nextStatus, role, metadata } = body;

    const order = mockStore.getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    // SERVER-AUTHORITATIVE STATE MACHINE VALIDATION
    validateStateTransition(order.status, nextStatus, role || "SYSTEM");

    const updated = mockStore.updateOrderStatus(id, nextStatus, metadata || {});
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
