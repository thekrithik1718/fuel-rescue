import { describe, it, expect } from "vitest";
import { findEligiblePartners, validatePartnerAcceptance } from "../src/lib/dispatch";
import { ORDER_STATUS } from "../src/lib/state-machine";

describe("Dispatch Engine - Partner Filtering & Ranking", () => {
  const sampleOrder = {
    id: "ord-1",
    customer_lat: 12.9716, // Bangalore MG Road
    customer_lng: 77.5946,
  };

  const samplePartners = [
    {
      id: "partner-near-verified",
      name: "Rajesh Kumar",
      status: "VERIFIED",
      safety_kit_verified: true,
      is_available: true,
      current_lat: 12.9750, // ~0.5 km away
      current_lng: 77.5980,
    },
    {
      id: "partner-unverified-kit",
      name: "Suresh P",
      status: "VERIFIED",
      safety_kit_verified: false, // NO safety kit!
      is_available: true,
      current_lat: 12.9720,
      current_lng: 77.5950,
    },
    {
      id: "partner-offline",
      name: "Vikram S",
      status: "VERIFIED",
      safety_kit_verified: true,
      is_available: false, // Offline
      current_lat: 12.9730,
      current_lng: 77.5960,
    },
    {
      id: "partner-far",
      name: "Anand M",
      status: "VERIFIED",
      safety_kit_verified: true,
      is_available: true,
      current_lat: 13.3000, // >35 km away outside dispatch radius
      current_lng: 77.5900,
    },
  ];

  it("should only match verified partners with verified safety canisters within radius", () => {
    const candidates = findEligiblePartners(samplePartners, sampleOrder);
    expect(candidates.length).toBe(1);
    expect(candidates[0].id).toBe("partner-near-verified");
  });

  it("should exclude partner currently busy delivering another order", () => {
    const activeOrders = [
      {
        id: "active-ord-99",
        partner_id: "partner-near-verified",
        status: ORDER_STATUS.EN_ROUTE,
      },
    ];

    const candidates = findEligiblePartners(samplePartners, sampleOrder, activeOrders);
    expect(candidates.length).toBe(0); // Busy partner excluded
  });
});

describe("Dispatch Engine - Atomic Concurrency Guard", () => {
  it("should prevent duplicate partner acceptance if order is already taken", () => {
    const order = {
      id: "ord-123",
      status: ORDER_STATUS.ACCEPTED,
      partner_id: "partner-first-accepted",
    };

    // Another partner tries to accept
    const result = validatePartnerAcceptance({
      order,
      partnerId: "partner-second-late",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("already accepted by another nearby partner");
  });

  it("should reject acceptance if order was cancelled", () => {
    const order = {
      id: "ord-124",
      status: ORDER_STATUS.CANCELLED,
    };

    const result = validatePartnerAcceptance({
      order,
      partnerId: "partner-1",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("cancelled");
  });

  it("should ensure simultaneous acceptance attempts result in exactly ONE winner and ONE conflict error", async () => {
    // Import mockStore
    const { mockStore } = await import("../src/lib/mock-store");

    // Create a fresh test order in SEARCHING_FOR_PARTNER status
    const testOrder = mockStore.createOrder({
      fuel_type: "PETROL",
      quantity_litres: 5,
      delivery_address: "Koramangala, Bengaluru",
      status: ORDER_STATUS.SEARCHING_FOR_PARTNER,
      customer_lat: 12.9352,
      customer_lng: 77.6245,
    });

    const partner1Id = "dddd1111-1111-1111-1111-111111111111"; // Rajesh Kumar
    const partner2Id = "dddd2222-2222-2222-2222-222222222222"; // Vikram Singh

    // Simulate simultaneous acceptance calls using Promise.all
    const [res1, res2] = await Promise.all([
      Promise.resolve(mockStore.atomicAcceptOrder(testOrder.id, partner1Id)),
      Promise.resolve(mockStore.atomicAcceptOrder(testOrder.id, partner2Id)),
    ]);

    // Exactly one must succeed and one must fail with conflict
    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].error).toContain("Conflict");

    // Verify resulting order status is ACCEPTED with the winning partner assigned
    const finalOrder = mockStore.getOrderById(testOrder.id);
    expect(finalOrder.status).toBe(ORDER_STATUS.ACCEPTED);
    expect([partner1Id, partner2Id]).toContain(finalOrder.partner_id);
  });
});
