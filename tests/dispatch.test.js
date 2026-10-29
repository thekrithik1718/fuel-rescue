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
});
