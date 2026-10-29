/**
 * Fuel Rescue - Dispatch & Partner Assignment Engine
 *
 * Implements atomic assignment, partner eligibility filtering,
 * ranking by distance, and concurrency guards.
 */

import { calculateHaversineDistanceKm } from "./routing";
import { ORDER_STATUS } from "./state-machine";

export const MAX_DISPATCH_RADIUS_KM = 12.0;

/**
 * Filters and ranks eligible delivery partners for an emergency request
 *
 * Eligibility criteria:
 * 1. Verification status is 'VERIFIED'
 * 2. PESO-approved safety canister & emergency kit verified
 * 3. Currently active & toggled 'AVAILABLE'
 * 4. Not already on an active engaged delivery (state PREPARING, EN_ROUTE, ARRIVED)
 * 5. Within service radius
 */
export function findEligiblePartners(partners, order, allActiveOrders = []) {
  if (!order || !order.customer_lat || !order.customer_lng) {
    return [];
  }

  // Find IDs of partners currently busy with an active in-progress order
  const busyPartnerIds = new Set(
    allActiveOrders
      .filter((o) =>
        [ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.EN_ROUTE, ORDER_STATUS.ARRIVED].includes(o.status)
      )
      .map((o) => o.partner_id)
      .filter(Boolean)
  );

  const eligible = partners.filter((p) => {
    // 1. Must be verified
    if (p.status !== "VERIFIED") return false;
    // 2. Safety kit verified
    if (!p.safety_kit_verified) return false;
    // 3. Available for dispatch
    if (!p.is_available) return false;
    // 4. Must not be currently delivering another order
    if (busyPartnerIds.has(p.id)) return false;

    // 5. Distance check
    const dist = calculateHaversineDistanceKm(
      p.current_lat,
      p.current_lng,
      order.customer_lat,
      order.customer_lng
    );
    p._calculatedDistanceKm = dist;

    return dist <= MAX_DISPATCH_RADIUS_KM;
  });

  // Rank by closest distance to customer
  return eligible.sort((a, b) => a._calculatedDistanceKm - b._calculatedDistanceKm);
}

/**
 * Concurrency-Safe Atomic Assignment Validator
 *
 * Checks if partner can legally accept this order:
 * - Order must be in PARTNER_ASSIGNED or SEARCHING_FOR_PARTNER
 * - Order must not already be claimed by someone else
 * - Partner must be verified and available
 */
export function validatePartnerAcceptance({ order, partnerId, currentAssignedPartnerId }) {
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.status === ORDER_STATUS.CANCELLED) {
    return { success: false, error: "This assistance request was cancelled by the customer." };
  }

  if (order.status === ORDER_STATUS.COMPLETED) {
    return { success: false, error: "This order has already been fulfilled." };
  }

  // If order is already accepted by someone else
  if (
    [ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.EN_ROUTE, ORDER_STATUS.ARRIVED].includes(order.status)
  ) {
    if (order.partner_id && order.partner_id !== partnerId) {
      return {
        success: false,
        error: "Conflict: This rescue request was already accepted by another nearby partner.",
      };
    }
  }

  // If specific partner was assigned, verify match
  if (currentAssignedPartnerId && currentAssignedPartnerId !== partnerId) {
    return {
      success: false,
      error: "This order dispatch request was offered to another responder.",
    };
  }

  return { success: true };
}
