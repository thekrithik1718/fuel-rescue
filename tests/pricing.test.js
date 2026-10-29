import { describe, it, expect } from "vitest";
import { calculateDeliveryFee, calculateOrderPrice, DEFAULT_PRICING_CONFIG } from "../src/lib/pricing";

describe("Pricing Engine - Core ₹30 up to 4km Delivery Fee Policy", () => {
  it("should charge exactly ₹30 for distances under 4.0 km", () => {
    expect(calculateDeliveryFee(0.5)).toBe(30);
    expect(calculateDeliveryFee(2.3)).toBe(30);
    expect(calculateDeliveryFee(3.99)).toBe(30);
  });

  it("should charge exactly ₹30 for distance equal to 4.0 km", () => {
    expect(calculateDeliveryFee(4.0)).toBe(30);
  });

  it("should calculate additional per-km charge for distances greater than 4.0 km", () => {
    // 5 km: 30 + (5 - 4) * 14 = ₹44
    expect(calculateDeliveryFee(5.0)).toBe(44);

    // 6.5 km: 30 + (6.5 - 4) * 14 = 30 + 35 = ₹65
    expect(calculateDeliveryFee(6.5)).toBe(65);

    // 10 km: 30 + (10 - 4) * 14 = 30 + 84 = ₹114
    expect(calculateDeliveryFee(10.0)).toBe(114);
  });

  it("should support custom per-km rate configuration overrides", () => {
    const customConfig = {
      baseDeliveryFee: 30,
      includedDistanceKm: 4.0,
      additionalPerKmRate: 10,
    };
    // 7 km: 30 + 3 * 10 = ₹60
    expect(calculateDeliveryFee(7.0, customConfig)).toBe(60);
  });

  it("should throw error for negative or invalid distance", () => {
    expect(() => calculateDeliveryFee(-1)).toThrow("Invalid distance");
    expect(() => calculateDeliveryFee("abc")).toThrow("Invalid distance");
  });
});

describe("Order Price Calculation - Subtotal and Safety Compliance", () => {
  it("should compute accurate fuel subtotal, delivery fee, and emergency fee", () => {
    // 5 Litres Petrol @ ₹102.50 = ₹512.50
    // Distance 3.5 km <= 4km -> Delivery fee = ₹30
    // Emergency handling fee = ₹15
    // Total = 512.50 + 30 + 15 = ₹557.50
    const quote = calculateOrderPrice({
      fuelType: "PETROL",
      quantityLitres: 5,
      distanceKm: 3.5,
      customFuelRate: 102.50,
    });

    expect(quote.fuelSubtotal).toBe(512.5);
    expect(quote.deliveryFee).toBe(30);
    expect(quote.emergencyFee).toBe(15);
    expect(quote.totalAmount).toBe(557.5);
    expect(quote.totalPaise).toBe(55750);
    expect(quote.isWithinFreeDistance).toBe(true);
  });

  it("should reject quantities outside the 2L - 20L emergency canister compliance limit", () => {
    expect(() =>
      calculateOrderPrice({
        fuelType: "PETROL",
        quantityLitres: 1, // too small
        distanceKm: 2,
      })
    ).toThrow(/between 2L and 20L/);

    expect(() =>
      calculateOrderPrice({
        fuelType: "DIESEL",
        quantityLitres: 25, // too large for mobile canister safety
        distanceKm: 2,
      })
    ).toThrow(/between 2L and 20L/);
  });

  it("should reject invalid fuel types", () => {
    expect(() =>
      calculateOrderPrice({
        fuelType: "KEROSENE",
        quantityLitres: 5,
        distanceKm: 2,
      })
    ).toThrow("Invalid fuel type");
  });
});
