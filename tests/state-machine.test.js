import { describe, it, expect } from "vitest";
import {
  ORDER_STATUS,
  ROLES,
  isValidTransition,
  isRoleAuthorizedForTransition,
  validateStateTransition,
} from "../src/lib/state-machine";

describe("Order State Machine - Transition Validity", () => {
  it("should permit normal progressive transitions", () => {
    expect(isValidTransition(ORDER_STATUS.CREATED, ORDER_STATUS.SEARCHING_FOR_PARTNER)).toBe(true);
    expect(isValidTransition(ORDER_STATUS.SEARCHING_FOR_PARTNER, ORDER_STATUS.PARTNER_ASSIGNED)).toBe(true);
    expect(isValidTransition(ORDER_STATUS.PARTNER_ASSIGNED, ORDER_STATUS.ACCEPTED)).toBe(true);
    expect(isValidTransition(ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING)).toBe(true);
    expect(isValidTransition(ORDER_STATUS.PREPARING, ORDER_STATUS.EN_ROUTE)).toBe(true);
    expect(isValidTransition(ORDER_STATUS.EN_ROUTE, ORDER_STATUS.ARRIVED)).toBe(true);
    expect(isValidTransition(ORDER_STATUS.ARRIVED, ORDER_STATUS.COMPLETED)).toBe(true);
  });

  it("should reject illegal skipped or backwards transitions", () => {
    // Cannot skip from CREATED directly to COMPLETED
    expect(isValidTransition(ORDER_STATUS.CREATED, ORDER_STATUS.COMPLETED)).toBe(false);

    // Cannot regress from ARRIVED back to PREPARING
    expect(isValidTransition(ORDER_STATUS.ARRIVED, ORDER_STATUS.PREPARING)).toBe(false);

    // Terminal states cannot transition out
    expect(isValidTransition(ORDER_STATUS.COMPLETED, ORDER_STATUS.EN_ROUTE)).toBe(false);
    expect(isValidTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.SEARCHING_FOR_PARTNER)).toBe(false);
  });
});

describe("Order State Machine - Role Authorizations", () => {
  it("should allow customer to cancel order during early stages", () => {
    expect(isRoleAuthorizedForTransition(ROLES.CUSTOMER, ORDER_STATUS.SEARCHING_FOR_PARTNER, ORDER_STATUS.CANCELLED)).toBe(true);
    expect(isRoleAuthorizedForTransition(ROLES.CUSTOMER, ORDER_STATUS.PARTNER_ASSIGNED, ORDER_STATUS.CANCELLED)).toBe(true);
  });

  it("should forbid customer from cancelling once partner is EN_ROUTE or ARRIVED", () => {
    expect(isRoleAuthorizedForTransition(ROLES.CUSTOMER, ORDER_STATUS.EN_ROUTE, ORDER_STATUS.CANCELLED)).toBe(false);
    expect(isRoleAuthorizedForTransition(ROLES.CUSTOMER, ORDER_STATUS.ARRIVED, ORDER_STATUS.CANCELLED)).toBe(false);
  });

  it("should allow delivery partner to step through fulfillment stages", () => {
    expect(isRoleAuthorizedForTransition(ROLES.PARTNER, ORDER_STATUS.PARTNER_ASSIGNED, ORDER_STATUS.ACCEPTED)).toBe(true);
    expect(isRoleAuthorizedForTransition(ROLES.PARTNER, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING)).toBe(true);
    expect(isRoleAuthorizedForTransition(ROLES.PARTNER, ORDER_STATUS.PREPARING, ORDER_STATUS.EN_ROUTE)).toBe(true);
    expect(isRoleAuthorizedForTransition(ROLES.PARTNER, ORDER_STATUS.EN_ROUTE, ORDER_STATUS.ARRIVED)).toBe(true);
    expect(isRoleAuthorizedForTransition(ROLES.PARTNER, ORDER_STATUS.ARRIVED, ORDER_STATUS.COMPLETED)).toBe(true);
  });

  it("should throw descriptive error on invalid transition attempt", () => {
    expect(() =>
      validateStateTransition(ORDER_STATUS.CREATED, ORDER_STATUS.COMPLETED, ROLES.CUSTOMER)
    ).toThrow(/Invalid order state transition/);
  });
});
