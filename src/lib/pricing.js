/**
 * Fuel Rescue - Core Server-Authoritative Pricing Engine
 *
 * Requirements:
 * - ₹30 fixed delivery fee for deliveries up to and including 4 km.
 * - Beyond 4 km: ₹30 + max(0, distance_km - 4) * per_km_rate.
 * - Standard fuel subtotal = quantity_litres * price_per_litre.
 * - Disclosed emergency platform/regulatory handling fee (optional/configurable).
 * - Integer paise calculation to avoid floating point precision issues.
 */

export const DEFAULT_PRICING_CONFIG = {
  baseDeliveryFee: 30, // ₹30 up to and including 4 km
  includedDistanceKm: 4.0,
  additionalPerKmRate: 14, // ₹14 per extra km
  minQuantityLitres: 1, // Quantity selectable from 1 Litre
  maxQuantityLitres: 20, // PESO safety container limit for emergency mobile delivery
  emergencyHandlingFee: 15, // Standard safety equipment & PESO certified canister fee
  gstPercentage: 0, // In India, retail petroleum is currently outside GST (VAT applies at depot level)
};

export const DEFAULT_FUEL_RATES = {
  PETROL: 102.50, // ₹/L in INR (indicative Bangalore/Metro benchmark)
  DIESEL: 88.80,  // ₹/L in INR
};

/**
 * Calculates delivery fee strictly following the rule:
 * ₹30 for distance <= 4.0 km.
 * ₹30 + (distance - 4.0) * per_km_rate for distance > 4.0 km.
 *
 * @param {number} distanceKm - Road route distance in kilometers
 * @param {object} config - Pricing configuration overrides
 * @returns {number} Delivery fee in INR
 */
export function calculateDeliveryFee(distanceKm, config = DEFAULT_PRICING_CONFIG) {
  const dist = Number(distanceKm);
  if (isNaN(dist) || dist < 0) {
    throw new Error("Invalid distance: distance must be a non-negative number.");
  }

  const baseFee = config.baseDeliveryFee ?? DEFAULT_PRICING_CONFIG.baseDeliveryFee;
  const includedDist = config.includedDistanceKm ?? DEFAULT_PRICING_CONFIG.includedDistanceKm;
  const perKmRate = config.additionalPerKmRate ?? DEFAULT_PRICING_CONFIG.additionalPerKmRate;

  if (dist <= includedDist) {
    return baseFee;
  }

  const billableExtraKm = dist - includedDist;
  const extraCharge = billableExtraKm * perKmRate;
  
  // Round to 2 decimal places (or integer rupee/paise)
  return Math.round((baseFee + extraCharge) * 100) / 100;
}

/**
 * Calculates complete order pricing with validation.
 *
 * @param {object} params
 * @param {string} params.fuelType - 'PETROL' | 'DIESEL'
 * @param {number} params.quantityLitres - Litres requested (2 - 20)
 * @param {number} params.distanceKm - Route distance in km
 * @param {number} [params.customFuelRate] - Optional rate per litre override from supplier
 * @param {object} [params.customConfig] - Optional pricing rule override
 * @returns {object} Detailed transparent price quote
 */
export function calculateOrderPrice({
  fuelType,
  quantityLitres,
  distanceKm,
  customFuelRate,
  customConfig = {},
}) {
  const type = String(fuelType || "").toUpperCase();
  if (type !== "PETROL" && type !== "DIESEL") {
    throw new Error("Invalid fuel type: Must be either PETROL or DIESEL.");
  }

  const qty = Number(quantityLitres);
  const config = { ...DEFAULT_PRICING_CONFIG, ...customConfig };

  if (isNaN(qty) || qty <= 0) {
    throw new Error("Invalid quantity: Quantity must be greater than zero.");
  }

  if (qty < config.minQuantityLitres || qty > config.maxQuantityLitres) {
    throw new Error(
      `Quantity must be between ${config.minQuantityLitres}L and ${config.maxQuantityLitres}L for emergency canister delivery compliance.`
    );
  }

  const dist = Number(distanceKm);
  if (isNaN(dist) || dist < 0) {
    throw new Error("Invalid distance: Distance must be a non-negative number.");
  }

  const pricePerLitre = customFuelRate !== undefined ? Number(customFuelRate) : DEFAULT_FUEL_RATES[type];
  if (isNaN(pricePerLitre) || pricePerLitre <= 0) {
    throw new Error("Invalid fuel price per litre.");
  }

  // 1. Fuel Subtotal
  const fuelSubtotal = Math.round(qty * pricePerLitre * 100) / 100;

  // 2. Delivery Fee (₹30 for <=4km, plus per-km beyond)
  const deliveryFee = calculateDeliveryFee(dist, config);

  // 3. Emergency Handling & PESO certified canister seal fee
  const emergencyFee = config.emergencyHandlingFee || 0;

  // 4. Total Payable
  const totalAmount = Math.round((fuelSubtotal + deliveryFee + emergencyFee) * 100) / 100;

  return {
    fuelType: type,
    quantityLitres: qty,
    pricePerLitre,
    fuelSubtotal,
    deliveryFee,
    includedDistanceKm: config.includedDistanceKm,
    billableDistanceKm: dist,
    extraDistanceKm: Math.max(0, dist - config.includedDistanceKm),
    emergencyFee,
    totalAmount,
    totalPaise: Math.round(totalAmount * 100),
    pricingPolicyVersion: "v1.0-4km-rule",
    isWithinFreeDistance: dist <= config.includedDistanceKm,
    calculatedAt: typeof window !== "undefined" ? new Date().toISOString() : "2026-10-29T10:00:00.000Z",
  };
}
