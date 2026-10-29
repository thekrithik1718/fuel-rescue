-- ====================================================================
-- FUEL RESCUE - SEED SCRIPT (DEMO & EVALUATION DATA)
-- ====================================================================

-- 1. PROFILES
INSERT INTO public.profiles (id, role, full_name, email, phone, avatar_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'ADMIN', 'Super Administrator', 'admin@fuelrescue.in', '+919876543210', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
  ('22222222-2222-2222-2222-222222222222', 'PARTNER', 'Rajesh Kumar', 'rajesh.partner@fuelrescue.in', '+919876500001', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'),
  ('33333333-3333-3333-3333-333333333333', 'PARTNER', 'Vikram Singh', 'vikram.partner@fuelrescue.in', '+919876500002', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
  ('44444444-4444-4444-4444-444444444444', 'CUSTOMER', 'Priya Sharma', 'priya.customer@example.com', '+919876511111', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
  ('55555555-5555-5555-5555-555555555555', 'CUSTOMER', 'Arjun Nair', 'arjun.customer@example.com', '+919876522222', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150')
ON CONFLICT (id) DO NOTHING;

-- 2. AUTHORIZED SUPPLIERS (OMC Depots)
INSERT INTO public.suppliers (id, name, trade_name, license_number, omc_brand, depot_code, address, city, pincode, contact_phone, contact_email, status, verified_at)
VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'Bharat Petroleum Retail Outlet #402', 'BPCL Auto Care Indiranagar', 'PESO/KA/2024/0984-BP', 'BPCL', 'BLR-IND-402', '100 Feet Rd, HAL 2nd Stage, Indiranagar', 'Bengaluru', '560038', '+918025251100', 'indiranagar@dealers.bpcl.in', 'VERIFIED', NOW()),
  ('bbbb2222-2222-2222-2222-222222222222', 'Indian Oil Corporation Franchise Hub', 'IOCL Swastik Auto Point', 'PESO/KA/2023/1842-IO', 'IOCL', 'BLR-KOR-108', '80 Feet Rd, 4th Block, Koramangala', 'Bengaluru', '560034', '+918025539988', 'swastik.koramangala@dealers.iocl.in', 'VERIFIED', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. SERVICE ZONES
INSERT INTO public.service_zones (id, name, city, state, center_lat, center_lng, radius_km, is_active, base_delivery_fee, included_distance_km, per_km_fee)
VALUES
  ('zzzz1111-1111-1111-1111-111111111111', 'Bengaluru Central & East Zone', 'Bengaluru', 'Karnataka', 12.9716, 77.5946, 14.0, true, 30.00, 4.00, 14.00)
ON CONFLICT (id) DO NOTHING;

-- 4. PRICING RULES (Enforces ₹30 for <=4km)
INSERT INTO public.pricing_rules (id, service_zone_id, base_delivery_fee, included_distance_km, per_km_rate, emergency_handling_fee, is_active)
VALUES
  ('pppp1111-1111-1111-1111-111111111111', 'zzzz1111-1111-1111-1111-111111111111', 30.00, 4.00, 14.00, 15.00, true)
ON CONFLICT (id) DO NOTHING;

-- 5. FUEL PRODUCTS
INSERT INTO public.fuel_products (id, supplier_id, fuel_type, octane_or_grade, price_per_litre, min_litres, max_litres, is_available)
VALUES
  ('ff011111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', 'PETROL', 'Speed 91 Octane', 102.50, 2.0, 20.0, true),
  ('ff022222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'DIESEL', 'Ultra-Low Sulphur Diesel (BS-VI)', 88.80, 2.0, 20.0, true)
ON CONFLICT (id) DO NOTHING;

-- 6. DELIVERY PARTNERS
INSERT INTO public.delivery_partners (id, profile_id, supplier_id, vehicle_type, vehicle_plate, driving_license_number, safety_kit_verified, is_available, current_lat, current_lng, rating, total_deliveries, status)
VALUES
  ('dddd1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'MOTORCYCLE', 'KA-01-EQ-9412', 'DL-04201800912', true, true, 12.9752, 77.5990, 4.92, 142, 'VERIFIED'),
  ('dddd2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'bbbb2222-2222-2222-2222-222222222222', 'MOTORCYCLE', 'KA-03-MK-4291', 'DL-03201900481', true, true, 12.9352, 77.6245, 4.88, 98, 'VERIFIED')
ON CONFLICT (id) DO NOTHING;

-- 7. SAMPLE ORDERS
INSERT INTO public.orders (
  id, order_number, customer_id, supplier_id, partner_id, service_zone_id,
  fuel_type, quantity_litres, fuel_price_per_litre, fuel_subtotal, delivery_fee, emergency_fee,
  total_amount, total_paise, status, payment_status, payment_method,
  customer_lat, customer_lng, delivery_address, delivery_landmark, vehicle_model, vehicle_plate,
  estimated_distance_km, estimated_duration_mins, delivery_otp
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001', 'FR-8921',
    '44444444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', 'zzzz1111-1111-1111-1111-111111111111',
    'PETROL', 5.0, 102.50, 512.50, 30.00, 15.00,
    557.50, 55750, 'EN_ROUTE', 'PAID', 'SIMULATED_UPI',
    12.9716, 77.6412, '12th Main Road, HAL 2nd Stage, Indiranagar', 'Opposite Toit Brewpub, near signal', 'Hyundai i20 White', 'KA-05-MN-2810',
    3.8, 14, '4829'
  ),
  (
    '00000000-0000-0000-0000-000000000002', 'FR-7814',
    '55555555-5555-5555-5555-555555555555', 'bbbb2222-2222-2222-2222-222222222222', 'dddd2222-2222-2222-2222-222222222222', 'zzzz1111-1111-1111-1111-111111111111',
    'DIESEL', 8.0, 88.80, 710.40, 44.00, 15.00,
    769.40, 76940, 'COMPLETED', 'PAID', 'SIMULATED_CARD',
    12.9345, 77.6101, 'Hosur Main Road, near Forum Mall Koramangala', 'St. John Hospital Junction', 'Tata Nexon Dark Edition', 'KA-51-AB-1904',
    5.0, 18, '9102'
  )
ON CONFLICT (id) DO NOTHING;
