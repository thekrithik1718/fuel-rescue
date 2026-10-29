/**
 * Fuel Rescue - Universal State Store & Realtime Simulation Bus
 *
 * Provides reactive persistence, seed initialization, atomic dispatches,
 * GPS movement simulation along road geometries, and pub/sub event channels.
 */

import { ORDER_STATUS } from "./state-machine";

// Seed data definitions matching supabase/seed.sql
export const INITIAL_PROFILES = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    role: "ADMIN",
    full_name: "Super Administrator",
    email: "admin@fuelrescue.in",
    phone: "+91 98765 43210",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    role: "PARTNER",
    full_name: "Rajesh Kumar",
    email: "rajesh.partner@fuelrescue.in",
    phone: "+91 98765 00001",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    role: "PARTNER",
    full_name: "Vikram Singh",
    email: "vikram.partner@fuelrescue.in",
    phone: "+91 98765 00002",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    role: "CUSTOMER",
    full_name: "Priya Sharma",
    email: "priya.customer@example.com",
    phone: "+91 98765 11111",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    role: "CUSTOMER",
    full_name: "Arjun Nair",
    email: "arjun.customer@example.com",
    phone: "+91 98765 22222",
    avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
  },
];

export const INITIAL_SUPPLIERS = [
  {
    id: "aaaa1111-1111-1111-1111-111111111111",
    name: "Bharat Petroleum Retail Outlet #402",
    trade_name: "BPCL Auto Care Indiranagar",
    license_number: "PESO/KA/2024/0984-BP",
    omc_brand: "BPCL",
    depot_code: "BLR-IND-402",
    address: "100 Feet Rd, HAL 2nd Stage, Indiranagar",
    city: "Bengaluru",
    pincode: "560038",
    contact_phone: "+91 80 2525 1100",
    status: "VERIFIED",
    verified_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "bbbb2222-2222-2222-2222-222222222222",
    name: "Indian Oil Corporation Franchise Hub",
    trade_name: "IOCL Swastik Auto Point",
    license_number: "PESO/KA/2023/1842-IO",
    omc_brand: "IOCL",
    depot_code: "BLR-KOR-108",
    address: "80 Feet Rd, 4th Block, Koramangala",
    city: "Bengaluru",
    pincode: "560034",
    contact_phone: "+91 80 2553 9988",
    status: "VERIFIED",
    verified_at: "2023-11-20T14:30:00Z",
  },
];

export const INITIAL_SERVICE_ZONES = [
  {
    id: "zzzz1111-1111-1111-1111-111111111111",
    name: "Bengaluru Central & East Zone",
    city: "Bengaluru",
    center_lat: 12.9716,
    center_lng: 77.5946,
    radius_km: 14.0,
    is_active: true,
    base_delivery_fee: 30.0,
    included_distance_km: 4.0,
    per_km_fee: 14.0,
  },
];

export const INITIAL_PRICING_RULES = [
  {
    id: "pppp1111-1111-1111-1111-111111111111",
    service_zone_id: "zzzz1111-1111-1111-1111-111111111111",
    base_delivery_fee: 30.0, // ₹30 up to 4km
    included_distance_km: 4.0,
    per_km_rate: 14.0,
    emergency_handling_fee: 15.0,
    is_active: true,
  },
];

export const INITIAL_DELIVERY_PARTNERS = [
  {
    id: "dddd1111-1111-1111-1111-111111111111",
    profile_id: "22222222-2222-2222-2222-222222222222",
    supplier_id: "aaaa1111-1111-1111-1111-111111111111",
    name: "Rajesh Kumar",
    phone: "+91 98765 00001",
    vehicle_type: "MOTORCYCLE",
    vehicle_plate: "KA-01-EQ-9412",
    driving_license_number: "DL-04201800912",
    safety_kit_verified: true,
    is_available: true,
    current_lat: 12.9752,
    current_lng: 77.5990,
    rating: 4.92,
    total_deliveries: 142,
    status: "VERIFIED",
  },
  {
    id: "dddd2222-2222-2222-2222-222222222222",
    profile_id: "33333333-3333-3333-3333-333333333333",
    supplier_id: "bbbb2222-2222-2222-2222-222222222222",
    name: "Vikram Singh",
    phone: "+91 98765 00002",
    vehicle_type: "MOTORCYCLE",
    vehicle_plate: "KA-03-MK-4291",
    driving_license_number: "DL-03201900481",
    safety_kit_verified: true,
    is_available: true,
    current_lat: 12.9352,
    current_lng: 77.6245,
    rating: 4.88,
    total_deliveries: 98,
    status: "VERIFIED",
  },
];

export const INITIAL_ORDERS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    order_number: "FR-8921",
    customer_id: "44444444-4444-4444-4444-444444444444",
    customer_name: "Priya Sharma",
    customer_phone: "+91 98765 11111",
    supplier_id: "aaaa1111-1111-1111-1111-111111111111",
    partner_id: "dddd1111-1111-1111-1111-111111111111",
    partner_name: "Rajesh Kumar",
    partner_phone: "+91 98765 00001",
    partner_plate: "KA-01-EQ-9412",
    fuel_type: "PETROL",
    quantity_litres: 5.0,
    fuel_price_per_litre: 102.50,
    fuel_subtotal: 512.50,
    delivery_fee: 30.00,
    emergency_fee: 15.00,
    total_amount: 557.50,
    status: ORDER_STATUS.EN_ROUTE,
    payment_status: "PAID",
    payment_method: "SIMULATED_UPI",
    customer_lat: 12.9716,
    customer_lng: 77.6412,
    delivery_address: "12th Main Road, HAL 2nd Stage, Indiranagar",
    delivery_landmark: "Opposite Toit Brewpub, near signal",
    vehicle_model: "Hyundai i20 White",
    vehicle_plate: "KA-05-MN-2810",
    estimated_distance_km: 3.8,
    estimated_duration_mins: 14,
    delivery_otp: "4829",
    partner_lat: 12.9734,
    partner_lng: 77.6180,
    created_at: "2026-10-29T10:45:00.000Z",
    status_history: [
      { status: ORDER_STATUS.CREATED, timestamp: "2026-10-29T10:45:00.000Z" },
      { status: ORDER_STATUS.PAYMENT_PENDING, timestamp: "2026-10-29T10:46:00.000Z" },
      { status: ORDER_STATUS.SEARCHING_FOR_PARTNER, timestamp: "2026-10-29T10:47:00.000Z" },
      { status: ORDER_STATUS.PARTNER_ASSIGNED, timestamp: "2026-10-29T10:48:00.000Z" },
      { status: ORDER_STATUS.ACCEPTED, timestamp: "2026-10-29T10:49:00.000Z" },
      { status: ORDER_STATUS.PREPARING, timestamp: "2026-10-29T10:52:00.000Z" },
      { status: ORDER_STATUS.EN_ROUTE, timestamp: "2026-10-29T10:56:00.000Z" },
    ],
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    order_number: "FR-7814",
    customer_id: "55555555-5555-5555-5555-555555555555",
    customer_name: "Arjun Nair",
    customer_phone: "+91 98765 22222",
    supplier_id: "bbbb2222-2222-2222-2222-222222222222",
    partner_id: "dddd2222-2222-2222-2222-222222222222",
    partner_name: "Vikram Singh",
    partner_phone: "+91 98765 00002",
    partner_plate: "KA-03-MK-4291",
    fuel_type: "DIESEL",
    quantity_litres: 8.0,
    fuel_price_per_litre: 88.80,
    fuel_subtotal: 710.40,
    delivery_fee: 44.00, // 5 km = 30 + 1 * 14
    emergency_fee: 15.00,
    total_amount: 769.40,
    status: ORDER_STATUS.COMPLETED,
    payment_status: "PAID",
    payment_method: "SIMULATED_CARD",
    customer_lat: 12.9345,
    customer_lng: 77.6101,
    delivery_address: "Hosur Main Road, near Forum Mall Koramangala",
    delivery_landmark: "St. John Hospital Junction",
    vehicle_model: "Tata Nexon Dark Edition",
    vehicle_plate: "KA-51-AB-1904",
    estimated_distance_km: 5.0,
    estimated_duration_mins: 18,
    delivery_otp: "9102",
    partner_lat: 12.9345,
    partner_lng: 77.6101,
    created_at: "2026-10-29T09:30:00.000Z",
    completed_at: "2026-10-29T09:55:00.000Z",
    status_history: [
      { status: ORDER_STATUS.CREATED, timestamp: "2026-10-29T09:30:00.000Z" },
      { status: ORDER_STATUS.SEARCHING_FOR_PARTNER, timestamp: "2026-10-29T09:32:00.000Z" },
      { status: ORDER_STATUS.ACCEPTED, timestamp: "2026-10-29T09:35:00.000Z" },
      { status: ORDER_STATUS.EN_ROUTE, timestamp: "2026-10-29T09:45:00.000Z" },
      { status: ORDER_STATUS.ARRIVED, timestamp: "2026-10-29T09:52:00.000Z" },
      { status: ORDER_STATUS.COMPLETED, timestamp: "2026-10-29T09:55:00.000Z" },
    ],
  },
];

const STORAGE_KEY = "fuel_rescue_store_v1";

class MockStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
  }

  loadState() {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed;
        }
      } catch (err) {
        console.warn("Could not load from localStorage:", err);
      }
    }
    return {
      profiles: INITIAL_PROFILES,
      suppliers: INITIAL_SUPPLIERS,
      serviceZones: INITIAL_SERVICE_ZONES,
      pricingRules: INITIAL_PRICING_RULES,
      partners: INITIAL_DELIVERY_PARTNERS,
      orders: INITIAL_ORDERS,
      isDemoMode: true,
      lastUpdated: "2026-10-29T10:00:00.000Z",
    };
  }

  saveState() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.warn("Could not save to localStorage:", err);
      }
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  resetToDefaults() {
    this.state = {
      profiles: INITIAL_PROFILES,
      suppliers: INITIAL_SUPPLIERS,
      serviceZones: INITIAL_SERVICE_ZONES,
      pricingRules: INITIAL_PRICING_RULES,
      partners: INITIAL_DELIVERY_PARTNERS,
      orders: INITIAL_ORDERS,
      isDemoMode: true,
      lastUpdated: new Date().toISOString(),
    };
    this.saveState();
  }

  // --- ORDER OPERATIONS ---

  getOrders() {
    return this.state.orders;
  }

  getOrderById(id) {
    return this.state.orders.find((o) => o.id === id || o.order_number === id);
  }

  createOrder(orderData) {
    const orderNumber = `FR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ord-${Date.now()}`,
      order_number: orderNumber,
      status: ORDER_STATUS.CREATED,
      payment_status: "PENDING",
      delivery_otp: String(Math.floor(1000 + Math.random() * 9000)),
      created_at: new Date().toISOString(),
      status_history: [
        { status: ORDER_STATUS.CREATED, timestamp: new Date().toISOString() },
      ],
      ...orderData,
    };

    this.state.orders = [newOrder, ...this.state.orders];
    this.saveState();
    return newOrder;
  }

  updateOrderStatus(orderId, nextStatus, metadata = {}) {
    const orderIndex = this.state.orders.findIndex(
      (o) => o.id === orderId || o.order_number === orderId
    );
    if (orderIndex === -1) throw new Error("Order not found");

    const order = this.state.orders[orderIndex];
    const historyItem = {
      status: nextStatus,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    const updated = {
      ...order,
      status: nextStatus,
      ...metadata,
      status_history: [...(order.status_history || []), historyItem],
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === ORDER_STATUS.COMPLETED) {
      updated.completed_at = new Date().toISOString();
    }

    this.state.orders[orderIndex] = updated;
    this.saveState();
    return updated;
  }

  assignPartnerToOrder(orderId, partnerId) {
    const partner = this.state.partners.find((p) => p.id === partnerId);
    if (!partner) throw new Error("Partner not found");

    return this.updateOrderStatus(orderId, ORDER_STATUS.PARTNER_ASSIGNED, {
      partner_id: partner.id,
      partner_name: partner.name,
      partner_phone: partner.phone,
      partner_plate: partner.vehicle_plate,
      partner_lat: partner.current_lat,
      partner_lng: partner.current_lng,
    });
  }

  updatePartnerLocation(orderId, lat, lng) {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (order) {
      order.partner_lat = lat;
      order.partner_lng = lng;
      this.saveState();
    }
  }

  // --- PARTNER OPERATIONS ---

  getPartners() {
    return this.state.partners;
  }

  getPartnerById(id) {
    return this.state.partners.find((p) => p.id === id);
  }

  togglePartnerAvailability(partnerId, isAvailable) {
    const p = this.state.partners.find((item) => item.id === partnerId);
    if (p) {
      p.is_available = isAvailable;
      this.saveState();
    }
    return p;
  }

  // --- ADMIN OPERATIONS ---

  updatePricingRule(ruleId, updates) {
    const index = this.state.pricingRules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.state.pricingRules[index] = { ...this.state.pricingRules[index], ...updates };
      this.saveState();
    }
  }

  togglePartnerVerification(partnerId, status) {
    const p = this.state.partners.find((item) => item.id === partnerId);
    if (p) {
      p.status = status;
      this.saveState();
    }
  }
}

// Singleton global mock store
export const mockStore = new MockStore();
