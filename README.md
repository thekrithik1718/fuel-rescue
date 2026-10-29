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
  - Leaflet & OpenStreetMap tiles (CartoDB Positron / OSM Voyager).
  - OSRM Road Network API with built-in urban road circuity fallback calculation.
  - Real-time animated GPS breadcrumbs along road routes.
* **Database & Security**:
  - PostgreSQL schema with 17 relational tables, indexes, constraints, and Row Level Security (RLS) policies (`supabase/migrations/`).
  - Supabase Auth and Realtime pub/sub adapter.
  - Zero-friction in-memory/localStorage reactive mock engine (`src/lib/mock-store.js`) for instant local testing without requiring external credentials.
* **Automated Testing**: Vitest test suite with 21 unit tests covering pricing, state machine transitions, dispatch filtering, atomic concurrency guards, and security tamper protection.

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
All 21 unit tests in `tests/` will execute and validate pricing math, state transitions, dispatch logic, and role guards.

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
   - Route: `/request` (Pin location with draggable marker, select Petrol/Diesel, review ₹30 breakdown, and checkout)
   - Route: `/orders` (Order list and invoices)
   - Route: `/orders/00000000-0000-0000-0000-000000000001` (Live tracking radar, rescuer beacon, 4-digit handover OTP `4829`, and "Simulate Rescuer GPS" button)

2. **🛵 Delivery Partner (Rajesh Kumar)**:
   - Route: `/partner` (Duty toggle, today's earnings ₹1,840, incoming broadcasts, and active assignment card)
   - Route: `/partner/orders/[id]` (Step-by-step console: Accept → Dispense at Depot → En Route → Arrived → Enter OTP Handshake)

3. **🛡️ Administrator (Super Admin)**:
   - Route: `/admin` (Real-time command center KPIs, GMV, and live dispatch feed)
   - Route: `/admin/orders` (Lifecycle audit, pricing breakdowns, cancellation controls)
   - Route: `/admin/partners` (Rescuer fleet verification and suspension controls)
   - Route: `/admin/pricing` (Live formula parameters: ₹30 base fee, 4.0 km threshold, per-km rate editor)

---

## 🗄️ Database Schema & Supabase Setup

All migrations and seed scripts are located in `supabase/`:
- `supabase/migrations/20261029000001_fuel_rescue_schema.sql` (Creates all 17 tables, foreign keys, indexes, and RLS policies)
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

---

## ⚖️ Safety, Regulatory & Statutory Notice

Fuel delivery is a regulated, safety-critical domain:
* **Petroleum Act & Explosives Rules**: Doorstep fuel delivery requires authorized OMC retail depot sourcing (IOCL, BPCL, HPCL) and PESO-certified explosion-proof composite canisters.
* **Dual-Point Grounding**: Rescuers carry anti-static grounding wires and portable fire extinguishers.
* In simulation/demo mode, all payments, dispatches, and GPS paths are explicitly labelled as mock demonstrations.

---

## 🧪 Automated Test Coverage Summary

```bash
✓ tests/state-machine.test.js (6 tests)
✓ tests/dispatch.test.js (4 tests)
✓ tests/pricing.test.js (8 tests)
✓ tests/security.test.js (3 tests)

Test Files  4 passed (4)
     Tests  21 passed (21)
```

1. **Pricing Engine Tests**:
   - Exact ₹30 delivery fee for <= 4.0 km
   - Additional per-km charge for > 4.0 km
   - Validation against negative inputs or quantities outside 2L - 20L
2. **State Machine Tests**:
   - Full linear progression (`CREATED` → `EN_ROUTE` → `COMPLETED`)
   - Rejection of invalid backwards or skipped states
   - Role authorization enforcement
3. **Dispatch Tests**:
   - Discovery of only verified partners with certified safety kits
   - Exclusion of busy or unverified partners
   - Concurrency protection preventing duplicate assignment
4. **Security Tests**:
   - Prevention of client-side price tampering
   - Role spoofing rejection
