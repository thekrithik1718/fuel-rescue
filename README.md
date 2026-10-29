# ⛽ Fuel Rescue — Emergency Doorstep Fuel Delivery Platform

> **World-Class, Production-Quality On-Demand Roadside Assistance MVP**  
> Combines the instant convenience of quick-commerce platforms (*Blinkit, Zepto*) with the real-time dispatch and GPS tracking experience of ride-hailing networks (*Uber, Rapido*).

---

## 🌟 Product Overview

**Fuel Rescue** is an emergency fuel assistance platform built to rescue stranded motorists who run out of fuel on the road. Rather than abandoning vehicles or walking kilometres with unsafe containers, motorists pin their location, select required fuel, receive transparent server-calculated pricing, and track verified delivery partners in real time.

### Core Delivery Fee Policy
* **₹30 fixed delivery fee for deliveries up to and including 4.0 km.**
* Beyond 4.0 km: `delivery_fee = ₹30 + max(0, distance_km - 4.0) × per_km_rate` (configurable by administrators).
* Fuel subtotal, delivery fee, and safety canister fees are disclosed upfront with zero hidden charges.

---

## 🏗️ Architecture & Technology Stack

* **Frontend**: Next.js 16 (App Router), React 19, JavaScript throughout (`.js`, `.jsx`).
* **Styling**: Tailwind CSS v4 with bespoke venture-backed design system (Deep Forest Green `#08281a`, Near-Black `#04140c`, Warm White `#FBFBF9`, Restrained Amber accents `#f59e0b`).
* **Icons & Animation**: Lucide React, Canvas Confetti.
* **Mapping & Routing**:
  - Leaflet & OpenStreetMap tiles (CartoDB Positron / OSM Voyager) — **Requires NO API Key** (100% free and open-source).
  - OSRM Road Network API with built-in urban road circuity fallback calculation.
  - Turn-by-Turn GPS navigation link direct to Google Maps (`destination=lat,lng`) with 6-decimal-place precision.
* **Database & Security**:
  - PostgreSQL schema with 17 relational tables, indexes, constraints, and Row Level Security (RLS) policies (`supabase/migrations/`).
  - Database-enforced atomic order acceptance (`accept_order_atomic` function with row-level locking `FOR UPDATE`).
  - Supabase Auth and Realtime pub/sub adapter.
  - Zero-friction in-memory/localStorage reactive mock engine (`src/lib/mock-store.js`) with atomic Compare-And-Swap (CAS) locks for instant local testing without requiring external credentials.
* **Automated Testing**: Vitest test suite with 23 unit tests covering pricing boundaries (0 km, 4 km, 5 km), state machine transitions, dispatch filtering, atomic concurrency guards, and security tamper protection.

---

## 🗺️ Maps & Geolocation API Key Requirements

A key feature of Fuel Rescue is zero-setup geospatial visualization and turn-by-turn navigation:

### Current Default Setup: **NO API Key Required**
* **Interactive Map**: Built using Leaflet with CartoDB Positron and OpenStreetMap vector tiles.
* **Reverse Geocoding**: Powered by `/api/geocode` utilizing OpenStreetMap Nominatim reverse geocoding. When the customer drags the pin or taps "Use Current GPS", the street address updates automatically.
* **Turn-by-Turn Navigation**: The delivery partner's console renders a direct link to `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, passing the customer's exact 6-decimal-place coordinates to native Google Maps or Apple Maps without requiring any server-side Google API key.

### Optional: Migrating to Google Maps Platform
If your organization requires Google Maps JavaScript SDK instead of Leaflet:
1. Obtain an API key from [Google Cloud Console](https://console.cloud.google.com/).
2. Enable:
   - **Maps JavaScript API**
   - **Places API (New)**
   - **Geocoding API**
   - **Directions API**
3. Configure your API key in `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js `v20+` or `v24+` (tested on `v24.12.0`)
- npm `v10+` or `v11+`

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Automated Tests
```bash
npm test
```
All 23 unit tests in `tests/` will execute and validate pricing math, state transitions, dispatch logic, and role guards.

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 👥 Role-Based Experience & Demo Mode

Fuel Rescue includes a top **Evaluation Simulation Bar** allowing one-click role switching between:

1. **👤 Customer (Priya Sharma)**:
   - Route: `/` (Landing Page with interactive pricing calculator)
   - Route: `/request` (Pin location with draggable marker, tap "Use Current GPS" for auto-geocoded address, review ₹30 delivery fee, and checkout)
   - Route: `/orders` (Order list and invoices)
   - Route: `/orders/[id]` (Live tracking radar, rescuer beacon, 4-digit handover OTP `4829`, and simulated progress)

2. **🛵 Delivery Partner (Rajesh Kumar)**:
   - Route: `/partner` (Duty toggle, today's earnings, incoming broadcasts with exact customer coordinates `lat, lng`, and atomic accept button)
   - Route: `/partner/orders/[id]` (Step-by-step console: Accept → Turn-by-Turn Google Maps launch → Arrived → Enter OTP Handshake)

3. **🛡️ Administrator (Super Admin)**:
   - Route: `/admin` (Real-time command center KPIs, GMV, and live dispatch feed)
   - Route: `/admin/orders` (Lifecycle audit, pricing breakdowns, cancellation controls)
   - Route: `/admin/partners` (Rescuer fleet verification and suspension controls)
   - Route: `/admin/pricing` (Live formula parameters: ₹30 base fee, 4.0 km threshold, per-km rate editor)

---

## 🗄️ Database Schema & Supabase Setup

All migrations and seed scripts are located in `supabase/`:
- `supabase/migrations/20261029000001_fuel_rescue_schema.sql` (Creates all 17 tables, foreign keys, indexes, RLS policies, and the `accept_order_atomic` function with row-level locking)
- `supabase/seed.sql` (Inserts realistic demo profiles, verified OMC depots, zones, and sample orders)

### Connecting to Live Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/migrations/` and `supabase/seed.sql` in the Supabase SQL Editor.
3. Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Verified Demo Mode (Zero Credentials Required):
When Supabase environment variables are omitted or placeholders, Fuel Rescue automatically boots into **Verified Demo Mode** using `src/lib/mock-store.js`. In this mode:
- All 18 Next.js pages and API routes function seamlessly in memory.
- Order creation, atomic dispatch, OTP verification, and status updates persist to `localStorage`.
- Simulated features are clearly distinguished from production database calls via the top demo banner and live badges.

---

## ⚖️ Safety & Regulatory Architecture Notice

This codebase is an **architectural demonstration and engineering prototype**. Readers and operators must note the actual legal landscape:

* **Petroleum Act (1934) & Petroleum Rules (2002)**: In India, doorstep delivery of **Diesel** has been piloted and regulated under PESO (Petroleum and Explosives Safety Organization) for stationary generators and heavy commercial equipment via authorized start-ups (e.g. FuelEnt).
* **Motor Spirit (Petrol) Restrictions**: Doorstep retail delivery of **Petrol (Motor Spirit)** is strictly restricted due to Class A flammability (flash point below 0°C). Any roadside petrol delivery in a commercial setting would require formal PESO deregulation or special experimental exemption.
* **Canister & Sourcing Models**: The 2L–20L composite canister specs, anti-static bonding protocols, and OMC depot agreements described in this MVP represent proposed safety standards and simulated workflows, **not confirmed regulatory approvals or certified permits**.

---

## 🧪 Automated Test Coverage Summary

```bash
✓ tests/state-machine.test.js (6 tests)
✓ tests/dispatch.test.js (5 tests)
✓ tests/pricing.test.js (9 tests)
✓ tests/security.test.js (3 tests)

Test Files  4 passed (4)
     Tests  23 passed (23)
```

1. **Pricing Engine Tests**:
   - Exact ₹30 delivery fee for 0 km, 4.0 km (inclusive boundary)
   - Exact ₹44 delivery fee for 5.0 km (₹30 + 1 km × ₹14/km)
   - Custom rate overrides and invalid distance rejection
   - 2L–20L emergency canister compliance enforcement
2. **State Machine Tests**:
   - Full linear progression (`CREATED` → `EN_ROUTE` → `COMPLETED`)
   - Rejection of invalid backwards or skipped states
   - Role authorization enforcement
3. **Dispatch & Concurrency Tests**:
   - Discovery of only verified partners with certified safety kits
   - Exclusion of busy or unverified partners
   - Simultaneous acceptance race condition test (`Promise.all`) ensuring exactly 1 winner and 1 conflict error
4. **Security & Price Integrity Tests**:
   - Server-side authoritative pricing that discards client-spoofed amounts
   - Role spoofing rejection (customers cannot complete orders, partners cannot skip states)
