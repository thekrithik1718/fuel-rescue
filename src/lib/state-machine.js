/**
 * Fuel Rescue - Server-Enforced Order State Machine
 *
 * Enforces valid transition paths, role authorization, and audit logs.
 */

export const ORDER_STATUS = {
  CREATED: "CREATED",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  SEARCHING_FOR_PARTNER: "SEARCHING_FOR_PARTNER",
  PARTNER_ASSIGNED: "PARTNER_ASSIGNED",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  EN_ROUTE: "EN_ROUTE",
  ARRIVED: "ARRIVED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_PARTNER_AVAILABLE: "NO_PARTNER_AVAILABLE",
  PAYMENT_FAILED: "PAYMENT_FAILED",
};

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

export const ROLES = {
  CUSTOMER: "CUSTOMER",
  PARTNER: "PARTNER",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
};

/**
 * Transition validation graph: Map of currentState -> Array of allowed nextStates
 */
const TRANSITION_MAP = {
  [ORDER_STATUS.CREATED]: [
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.SEARCHING_FOR_PARTNER,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.PAYMENT_PENDING]: [
    ORDER_STATUS.SEARCHING_FOR_PARTNER,
    ORDER_STATUS.PAYMENT_FAILED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.PAYMENT_FAILED]: [
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.SEARCHING_FOR_PARTNER]: [
    ORDER_STATUS.PARTNER_ASSIGNED,
    ORDER_STATUS.NO_PARTNER_AVAILABLE,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.NO_PARTNER_AVAILABLE]: [
    ORDER_STATUS.SEARCHING_FOR_PARTNER, // Retry
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.PARTNER_ASSIGNED]: [
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.SEARCHING_FOR_PARTNER, // Rejected by partner, re-broadcast
    ORDER_STATUS.NO_PARTNER_AVAILABLE,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.ACCEPTED]: [
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.PREPARING]: [
    ORDER_STATUS.EN_ROUTE,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.EN_ROUTE]: [
    ORDER_STATUS.ARRIVED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.ARRIVED]: [
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.COMPLETED]: [], // Terminal state
  [ORDER_STATUS.CANCELLED]: [], // Terminal state
};

/**
 * Checks whether a transition from fromStatus to toStatus is valid
 */
export function isValidTransition(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true; // Idempotent no-op
  const allowed = TRANSITION_MAP[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
}

/**
 * Validates whether the role is permitted to perform the state transition
 */
export function isRoleAuthorizedForTransition(role, fromStatus, toStatus) {
  const normalizedRole = String(role || "").toUpperCase();

  // Admin and System can execute any structurally valid transition or emergency cancellation
  if (normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.SYSTEM) {
    return isValidTransition(fromStatus, toStatus);
  }

  if (normalizedRole === ROLES.CUSTOMER) {
    // Customer can cancel before partner is en route
    if (toStatus === ORDER_STATUS.CANCELLED) {
      const cancellableStatuses = [
        ORDER_STATUS.CREATED,
        ORDER_STATUS.PAYMENT_PENDING,
        ORDER_STATUS.SEARCHING_FOR_PARTNER,
        ORDER_STATUS.PARTNER_ASSIGNED,
        ORDER_STATUS.ACCEPTED,
        ORDER_STATUS.NO_PARTNER_AVAILABLE,
      ];
      return cancellableStatuses.includes(fromStatus);
    }
    // Customer advances payment to searching
    if (
      (fromStatus === ORDER_STATUS.CREATED && toStatus === ORDER_STATUS.PAYMENT_PENDING) ||
      (fromStatus === ORDER_STATUS.PAYMENT_PENDING && toStatus === ORDER_STATUS.SEARCHING_FOR_PARTNER) ||
      (fromStatus === ORDER_STATUS.CREATED && toStatus === ORDER_STATUS.SEARCHING_FOR_PARTNER)
    ) {
      return true;
    }
    return false;
  }

  if (normalizedRole === ROLES.PARTNER) {
    // Delivery partner transitions through fulfilment stages
    if (fromStatus === ORDER_STATUS.PARTNER_ASSIGNED && toStatus === ORDER_STATUS.ACCEPTED) return true;
    if (fromStatus === ORDER_STATUS.PARTNER_ASSIGNED && toStatus === ORDER_STATUS.SEARCHING_FOR_PARTNER) return true; // Partner rejected
    if (fromStatus === ORDER_STATUS.ACCEPTED && toStatus === ORDER_STATUS.PREPARING) return true;
    if (fromStatus === ORDER_STATUS.PREPARING && toStatus === ORDER_STATUS.EN_ROUTE) return true;
    if (fromStatus === ORDER_STATUS.EN_ROUTE && toStatus === ORDER_STATUS.ARRIVED) return true;
    if (fromStatus === ORDER_STATUS.ARRIVED && toStatus === ORDER_STATUS.COMPLETED) return true;
    return false;
  }

  return false;
}

/**
 * Validates and executes state transition rule
 */
export function validateStateTransition(currentStatus, nextStatus, role) {
  if (!isValidTransition(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid order state transition from '${currentStatus}' to '${nextStatus}'.`
    );
  }

  if (!isRoleAuthorizedForTransition(role, currentStatus, nextStatus)) {
    throw new Error(
      `Role '${role}' is not authorized to transition order from '${currentStatus}' to '${nextStatus}'.`
    );
  }

  return true;
}

/**
 * Human-readable friendly status display
 */
export function getStatusDetails(status) {
  switch (status) {
    case ORDER_STATUS.CREATED:
      return { label: "Drafted", description: "Order created, ready for checkout.", color: "text-zinc-600 bg-zinc-100", step: 1 };
    case ORDER_STATUS.PAYMENT_PENDING:
      return { label: "Awaiting Payment", description: "Completing secure payment processing.", color: "text-amber-700 bg-amber-50", step: 2 };
    case ORDER_STATUS.SEARCHING_FOR_PARTNER:
      return { label: "Locating Rescuer", description: "Broadcasting to nearest certified fuel delivery partners.", color: "text-emerald-700 bg-emerald-50 animate-pulse", step: 3 };
    case ORDER_STATUS.PARTNER_ASSIGNED:
      return { label: "Partner Allocated", description: "Dispatch request sent to nearby rescuer.", color: "text-blue-700 bg-blue-50", step: 4 };
    case ORDER_STATUS.ACCEPTED:
      return { label: "Request Accepted", description: "Rescuer confirmed and heading to depot.", color: "text-teal-700 bg-teal-50", step: 5 };
    case ORDER_STATUS.PREPARING:
      return { label: "Dispensing Fuel", description: "Filling PESO certified explosion-proof canister at authorized pump.", color: "text-indigo-700 bg-indigo-50", step: 6 };
    case ORDER_STATUS.EN_ROUTE:
      return { label: "Rescuer En Route", description: "Delivery partner is navigating to your stranded vehicle location.", color: "text-amber-800 bg-amber-100", step: 7 };
    case ORDER_STATUS.ARRIVED:
      return { label: "Rescuer Arrived", description: "Partner has arrived at your vehicle. Ready to refuel.", color: "text-emerald-800 bg-emerald-100", step: 8 };
    case ORDER_STATUS.COMPLETED:
      return { label: "Refuelled & Safe", description: "Emergency fuel delivered successfully. Safe travels!", color: "text-green-800 bg-green-100", step: 9 };
    case ORDER_STATUS.CANCELLED:
      return { label: "Cancelled", description: "This assistance request was cancelled.", color: "text-red-700 bg-red-50", step: 0 };
    case ORDER_STATUS.NO_PARTNER_AVAILABLE:
      return { label: "All Rescuers Busy", description: "No delivery partner available nearby. Please retry or contact helpline.", color: "text-orange-700 bg-orange-50", step: 0 };
    default:
      return { label: status, description: "", color: "text-zinc-700 bg-zinc-100", step: 0 };
  }
}
