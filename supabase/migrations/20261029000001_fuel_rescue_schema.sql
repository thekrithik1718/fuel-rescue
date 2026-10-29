-- ====================================================================
-- FUEL RESCUE - PRODUCTION POSTGRESQL SCHEMA WITH SUPABASE RLS
-- Migration: 20261029000001_fuel_rescue_schema.sql
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (Linked with auth.users if Supabase Auth is enabled)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE, -- Supabase auth.users.id
  role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'PARTNER', 'ADMIN')),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SUPPLIERS TABLE (Authorized Oil Marketing Companies & Franchised Outlets)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trade_name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  omc_brand TEXT NOT NULL, -- e.g. IOCL, BPCL, HPCL
  depot_code TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'SUSPENDED')),
  peso_license_expiry DATE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SUPPLIER VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.supplier_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- e.g. PESO_STORAGE_LICENSE, EXPLOSIVES_PERMIT, GSTIN
  document_url TEXT NOT NULL,
  verified_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  notes TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SERVICE ZONES TABLE
CREATE TABLE IF NOT EXISTS public.service_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Karnataka',
  center_lat NUMERIC(10, 7) NOT NULL,
  center_lng NUMERIC(10, 7) NOT NULL,
  radius_km NUMERIC(5, 2) NOT NULL DEFAULT 12.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  base_delivery_fee NUMERIC(8, 2) NOT NULL DEFAULT 30.00, -- ₹30 up to 4km
  included_distance_km NUMERIC(5, 2) NOT NULL DEFAULT 4.0,
  per_km_fee NUMERIC(8, 2) NOT NULL DEFAULT 14.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DELIVERY PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  vehicle_type TEXT NOT NULL DEFAULT 'MOTORCYCLE' CHECK (vehicle_type IN ('MOTORCYCLE', 'SCOOTER', 'UTILITY_EV', 'TRUCK')),
  vehicle_plate TEXT NOT NULL,
  driving_license_number TEXT NOT NULL,
  safety_kit_verified BOOLEAN NOT NULL DEFAULT FALSE, -- PESO approved canister, static ground, extinguisher
  safety_kit_expiry DATE,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat NUMERIC(10, 7) NOT NULL,
  current_lng NUMERIC(10, 7) NOT NULL,
  last_location_time TIMESTAMPTZ DEFAULT NOW(),
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (status IN ('PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FUEL PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.fuel_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('PETROL', 'DIESEL')),
  octane_or_grade TEXT NOT NULL DEFAULT 'Regular 91',
  price_per_litre NUMERIC(8, 2) NOT NULL,
  min_litres NUMERIC(4, 1) NOT NULL DEFAULT 2.0,
  max_litres NUMERIC(4, 1) NOT NULL DEFAULT 20.0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PRICING RULES TABLE
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_zone_id UUID REFERENCES public.service_zones(id) ON DELETE CASCADE,
  base_delivery_fee NUMERIC(8, 2) NOT NULL DEFAULT 30.00, -- ₹30 policy
  included_distance_km NUMERIC(5, 2) NOT NULL DEFAULT 4.00,
  per_km_rate NUMERIC(8, 2) NOT NULL DEFAULT 14.00,
  emergency_handling_fee NUMERIC(8, 2) NOT NULL DEFAULT 15.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  partner_id UUID REFERENCES public.delivery_partners(id),
  service_zone_id UUID REFERENCES public.service_zones(id),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('PETROL', 'DIESEL')),
  quantity_litres NUMERIC(4, 1) NOT NULL CHECK (quantity_litres >= 2.0 AND quantity_litres <= 20.0),
  fuel_price_per_litre NUMERIC(8, 2) NOT NULL,
  fuel_subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(8, 2) NOT NULL,
  emergency_fee NUMERIC(8, 2) NOT NULL DEFAULT 15.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  total_paise INTEGER NOT NULL,
  pricing_version TEXT NOT NULL DEFAULT 'v1.0-4km-rule',
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (
    status IN (
      'CREATED',
      'PAYMENT_PENDING',
      'SEARCHING_FOR_PARTNER',
      'PARTNER_ASSIGNED',
      'ACCEPTED',
      'PREPARING',
      'EN_ROUTE',
      'ARRIVED',
      'COMPLETED',
      'CANCELLED',
      'NO_PARTNER_AVAILABLE',
      'PAYMENT_FAILED'
    )
  ),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  payment_method TEXT NOT NULL DEFAULT 'SIMULATED_UPI' CHECK (payment_method IN ('SIMULATED_UPI', 'SIMULATED_CARD', 'CASH_ON_DELIVERY')),
  payment_transaction_id TEXT,
  customer_lat NUMERIC(10, 7) NOT NULL,
  customer_lng NUMERIC(10, 7) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_landmark TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  estimated_distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  estimated_duration_mins INTEGER NOT NULL DEFAULT 15,
  delivery_otp TEXT NOT NULL DEFAULT '4829', -- 4-digit refuel completion OTP
  notes TEXT,
  cancelled_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by_role TEXT NOT NULL,
  changed_by_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. DISPATCH ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.dispatch_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.delivery_partners(id),
  status TEXT NOT NULL DEFAULT 'OFFERED' CHECK (status IN ('OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- 12. PARTNER ASSIGNMENTS TABLE (Guarantees only 1 active assignment per order)
CREATE TABLE IF NOT EXISTS public.partner_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.delivery_partners(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'RELEASED')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Unique index to prevent duplicate active partner assignment on the same order!
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_partner_per_order
ON public.partner_assignments (order_id)
WHERE status = 'ACTIVE';

-- 13. PARTNER LOCATION UPDATES (Breadcrumbs during active EN_ROUTE)
CREATE TABLE IF NOT EXISTS public.partner_location_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES public.delivery_partners(id),
  order_id UUID REFERENCES public.orders(id),
  lat NUMERIC(10, 7) NOT NULL,
  lng NUMERIC(10, 7) NOT NULL,
  heading NUMERIC(5, 2),
  speed_kmh NUMERIC(5, 2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL DEFAULT 'SIMULATED_GATEWAY',
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  gateway_payment_id TEXT NOT NULL,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. REFUNDS TABLE
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  partner_id UUID REFERENCES public.delivery_partners(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id),
  customer_id UUID NOT NULL REFERENCES public.profiles(id),
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED')),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  actor_id UUID REFERENCES public.profiles(id),
  actor_role TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON public.orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_available ON public.delivery_partners(is_available, status);
CREATE INDEX IF NOT EXISTS idx_location_updates_order ON public.partner_location_updates(order_id);

-- ====================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current authenticated user profile role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- PROFILES RLS
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR get_auth_role() = 'ADMIN');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ORDERS RLS
CREATE POLICY "Customers view own orders"
  ON public.orders FOR SELECT
  USING (
    customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR partner_id IN (SELECT id FROM public.delivery_partners WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    OR get_auth_role() = 'ADMIN'
  );

CREATE POLICY "Customers create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    customer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Partners update assigned orders"
  ON public.orders FOR UPDATE
  USING (
    partner_id IN (SELECT id FROM public.delivery_partners WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    OR get_auth_role() = 'ADMIN'
  );

-- PUBLIC READ ACCESS FOR STATIC CATALOG (Zones, Pricing, Products)
CREATE POLICY "Public read zones" ON public.service_zones FOR SELECT USING (true);
CREATE POLICY "Public read pricing" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.fuel_products FOR SELECT USING (true);
CREATE POLICY "Public read verified suppliers" ON public.suppliers FOR SELECT USING (status = 'VERIFIED');
