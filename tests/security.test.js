import { describe, it, expect } from "vitest";
import { calculateOrderPrice } from "../src/lib/pricing";
import { isRoleAuthorizedForTransition, ORDER_STATUS, ROLES } from "../src/lib/state-machine";

describe("Security & Price Integrity Guards", () => {
  it("should calculate authoritative price on server and ignore spoofed client price", () => {
    // Malicious customer submits total: ₹1 instead of real price
    const maliciousPayload = {
      fuelType: "PETROL",
      quantityLitres: 5,
      distanceKm: 3.0,
      clientSpoofedTotal: 1.0, // Client trying to tamper
    };

    const serverQuote = calculateOrderPrice({
      fuelType: maliciousPayload.fuelType,
      quantityLitres: maliciousPayload.quantityLitres,
      distanceKm: maliciousPayload.distanceKm,
    });

    // Server price must be 5 * 102.50 (512.50) + 30 + 15 = 557.50, ignoring spoofed value
    expect(serverQuote.totalAmount).toBe(557.5);
    expect(serverQuote.totalAmount).not.toBe(maliciousPayload.clientSpoofedTotal);
  });

  it("should forbid customer from marking order as COMPLETED", () => {
    const isAuthorized = isRoleAuthorizedForTransition(
      ROLES.CUSTOMER,
      ORDER_STATUS.ARRIVED,
      ORDER_STATUS.COMPLETED
    );
    expect(isAuthorized).toBe(false);
  });

  it("should forbid partner from jumping directly from PARTNER_ASSIGNED to COMPLETED", () => {
    const isAuthorized = isRoleAuthorizedForTransition(
      ROLES.PARTNER,
      ORDER_STATUS.PARTNER_ASSIGNED,
      ORDER_STATUS.COMPLETED
    );
    expect(isAuthorized).toBe(false);
  });
});
