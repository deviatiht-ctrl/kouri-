# KOURI — Taxi & Ride-Hailing Web Platform (Uber-like)

**KOURI** is a modern, high-performance, mobile-first ride-hailing and taxi web platform built for Haiti (Port-au-Prince and nationwide). It is built with zero monthly API costs using MapLibre GL JS, OpenFreeMap, Esri World Imagery, OSRM, and Supabase.

---

## 🌟 Key Architecture & Highlights

1. **Global Design Rules**:
   - Background is **always** `#FFFFFF` (no colored page backgrounds).
   - **Zero emoji anywhere** — Lucide Icons only with automatic re-hydration via `lucide.createIcons()`.
   - Editorial, left-aligned typography combining **Syne** (headings) + **DM Sans** (body text).
   - Themeable CSS tokens located exclusively in [`assets/css/variables.css`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/assets/css/variables.css).
   - Desktop Navbar: Fixed glassmorphic pill (`backdrop-filter: blur(20px) saturate(180%)`).
   - Mobile Navbar: Fixed bottom bar (`border-radius: 24px 24px 0 0`, safe-area-inset padding).
   - Mobile-First Full-Screen Map with draggable bottom sheets (peek / half / full snap points).
   - On desktop, the sheet fluidly transforms into a 420px left panel while the map fills the remaining viewport.
   - Public pages footer: **"Designed by Cvisual"**.

2. **100% Free Map Engine**:
   - **MapLibre GL JS** (Free, open-source WebGL).
   - **Base Layers**:
     1. *Plan* (Default minimal vector from OpenFreeMap, free, no API key).
     2. *Satellite* (Esri World Imagery raster tiles + road overlay).
     3. *3D* (Pitch 60°, OSM 3D building fill-extrusion, free Terrarium elevation DEM terrain with hillshading, compass/reset-north, and 2D/3D toggle).
   - **Routing Engine**: OSRM abstraction behind [`assets/js/map/routing.js`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/assets/js/map/routing.js) with alternative routes and offline dead-reckoning fallback.
   - **Geocoding & Autocomplete**: Nominatim / Photon backend behind [`assets/js/map/geocoding.js`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/assets/js/map/geocoding.js) with Haiti bias (`countrycodes=ht`, Port-au-Prince bounding box), IndexedDB caching, and reverse geocoding on fixed map center pin drag.

3. **Critical Offline Mode (PWA)**:
   - Service Worker (`sw.js`) with cache-first app shell, network-first API, and map tile corridor caching.
   - On ride acceptance/pickup, corridor tiles (zoom 12-17) are automatically prefetched into cache.
   - Active trip state machine persisted in IndexedDB (`requested > accepted > arrived > in_progress > completed > paid`).
   - Local Outbox queue with unique `idempotency_key` and GPS coordinates.
   - 6-digit PIN code and QR code offline confirmation for mutual pickup validation.
   - Driver records compressed GPS breadcrumbs every 5 seconds locally.
   - Deterministic offline fare calculation derived from immutable `pricing_snapshot`.
   - Automatic background flush to Supabase when connectivity returns.

4. **Multi-Language & Currency**:
   - Default: **Haitian Creole (`ht`)**, **French (`fr`)**, **English (`en`)**.
   - Currency: **HTG (primary)** with instant toggle for **USD** display option.

5. **Pricing & Dedicated Driver Subscription Engine**:
   - Distance-based, Zone-based, and Hybrid pricing.
   - Vehicle categories: Moto, Klasik (Standard), Konfò (Comfort), and Van.
   - Monthly and weekly subscription plans with dedicated preferred driver assignments, scheduling slots, and priority dispatch.

---

## 📁 Project Structure

```
kouri/
├── index.html                       # Public editorial landing page
├── login.html                       # Unified login page with demo role switches
├── register.html                    # Unified registration (Rider or Driver)
├── forgot-password.html             # Password recovery
├── terms.html                       # Terms of Service
├── privacy.html                     # Privacy Policy
├── manifest.json                    # PWA Web App Manifest
├── sw.js                            # PWA Service Worker (Corridor caching + offline sync)
├── pages/
│   ├── rider/
│   │   ├── home.html                # Fullscreen map, booking sheet, searching radar, tracking, rating
│   │   ├── trips.html               # Trip history with PDF printable receipts
│   │   ├── subscription.html        # Subscription card with assigned dedicated driver & schedules
│   │   ├── wallet.html              # Balance, MonCash/NatCash top-up proof upload, transactions
│   │   ├── account.html             # Profile, avatar upload, saved places, safety contacts
│   │   └── support.html             # Ticket creation & FAQ
│   ├── driver/
│   │   ├── home.html                # Online toggle, 15s request countdown, navigation, offline pickup
│   │   ├── earnings.html            # Daily/weekly/monthly charts (Chart.js), payouts, commission
│   │   ├── trips.html               # Driver trip history
│   │   ├── ratings.html             # Rating breakdown (stars) and passenger reviews
│   │   ├── documents.html           # License, ID, vehicle photos, verification status
│   │   ├── account.html             # Vehicle specifications, category, language
│   │   └── subscribers.html         # Assigned subscription riders with availability schedules
│   └── admin/
│       ├── dashboard.html           # KPIs, Chart.js trends, live mini-map, recent rides
│       ├── live-map.html            # Realtime fleet map, driver inspection, demand heatmap
│       ├── rides.html               # Ride logs, status override, anomaly flags (offline sync)
│       ├── drivers.html             # Driver approvals, document verification, suspensions
│       ├── riders.html              # Rider accounts, wallet adjustments, blocking
│       ├── pricing.html             # Distance/Zone/Hybrid rates, vehicle categories, trip simulator
│       ├── zones.html               # Polygon zone editor on map, zone-to-zone price matrix
│       ├── subscriptions.html       # Subscription plan builder, rider-driver assignment tool
│       ├── promotions.html          # Promo codes & referral rewards
│       ├── payments.html            # MonCash/NatCash proof verification queue, payouts
│       ├── support.html             # Live SOS emergency alerts & support tickets
│       └── settings.html            # Branding (logo/colors), commission %, admin user whitelist
├── assets/
│   ├── css/
│   │   ├── variables.css            # CSS theme variables (ink #0B0F1A, primary, accent, etc.)
│   │   ├── main.css                 # Editorial typography, buttons, cards, skeletons, toasts
│   │   ├── navbar.css               # Desktop glassmorphic pill navbar
│   │   ├── mobile-nav.css           # Mobile fixed bottom bar
│   │   ├── bottom-sheet.css         # Draggable bottom sheet & desktop 420px sidebar
│   │   ├── map.css                  # Map controls, custom SVG markers (pickup, dest, car)
│   │   └── admin.css                # Desktop-first backoffice, card-tables (no horizontal scroll)
│   ├── js/
│   │   ├── supabase.js              # Supabase client singleton (exposed as window.db)
│   │   ├── i18n.js                  # Haitian Creole, French, English + HTG/USD converter
│   │   ├── auth.js                  # Auth helpers, role routing, demo account switchers
│   │   ├── navbar.js                # Unified navbar & role-based visibility
│   │   ├── components/
│   │   │   ├── logo.js              # Dynamic logo component (settings.logo_url fallback)
│   │   │   ├── toast.js             # Accessible toast notifications
│   │   │   └── bottom-sheet.js      # Draggable sheet with snap points & GSAP spring
│   │   ├── offline/
│   │   │   ├── db.js                # IndexedDB storage (kouri_offline_db)
│   │   │   ├── outbox.js            # Offline action queue with idempotency keys
│   │   │   └── sync.js              # Offline banner, corridor prefetch, background flush
│   │   ├── map/
│   │   │   ├── layers.js            # Plan (OpenFreeMap), Satellite (Esri), 3D building styles
│   │   │   ├── markers.js           # SVG markers (pickup, dest, rotating car, pulse dot)
│   │   │   ├── routing.js           # OSRM routing abstraction & polyline renderer
│   │   │   ├── geocoding.js         # Nominatim/Photon search with Haiti bias & center pin
│   │   │   └── map.js               # Unified KouriMap controller
│   │   └── admin/
│   │       └── admin-nav.js         # Admin sidebar, header, and strict email verification
│   └── img/
│       ├── logo-placeholder.svg     # KOURI wordmark + icon placeholder
│       └── icon-placeholder.svg     # KOURI app icon
└── sql/
    ├── 01_schema.sql                # PostGIS, tables, indexes, triggers, dispatch RPC functions
    ├── 02_rls.sql                   # Row Level Security (RLS) on all tables
    ├── 03_storage.sql               # Storage buckets (branding, avatars, documents, proofs)
    ├── 04_admin.sql                 # Admin user email whitelist
    └── 05_seed.sql                  # Port-au-Prince metropolitan zones, pricing matrix, plans
```

---

## 🚀 Supabase Setup Steps

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and execute the SQL files in exact order:
   - **`sql/01_schema.sql`**: Enables `postgis` & `uuid-ossp`, creates all tables, triggers, and functions (`calculate_trip_fare`, `find_nearest_drivers`).
   - **`sql/02_rls.sql`**: Configures strict Row Level Security (RLS) policies for riders, drivers, and admins.
   - **`sql/03_storage.sql`**: Creates buckets (`branding`, `avatars`, `vehicle-photos`, `driver-documents`, `payment-proofs`) and access policies.
   - **`sql/04_admin.sql`**: Inserts your admin email into `admin_users`.
   - **`sql/05_seed.sql`**: Populates Port-au-Prince metropolitan zones (Delmas, Pétion-Ville, Tabarre, Airport, Downtown), vehicle categories, and subscription plans.
3. In [`assets/js/supabase.js`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/assets/js/supabase.js), update:
   ```javascript
   const DEFAULT_SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
   const DEFAULT_SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   *(Or you can simply open Admin > Settings in the app and save your keys dynamically without modifying code).*

---

## 🔒 How to Edit the Admin Email

Open [`sql/04_admin.sql`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/sql/04_admin.sql) and replace the default emails with your email address:

```sql
INSERT INTO public.admin_users (email)
VALUES 
    ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;
```

Only authenticated users whose email exists in `admin_users` can access the `/pages/admin/` dashboard and tools. Any other role is automatically redirected.

---

## 🗺️ How to Host a Free OSRM or Valhalla Instance

During development, KOURI uses the public OSRM demonstration server (`https://router.project-osrm.org`). For production:

1. **Deploy OSRM on a cheap VPS (e.g. $4–$6/month on Hetzner or DigitalOcean)**:
   ```bash
   # Download Haiti OSM extract from Geofabrik
   wget https://download.geofabrik.de/central-america/haiti-and-domrep-latest.osm.pbf

   # Run OSRM backend via Docker
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/haiti-and-domrep-latest.osm.pbf
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/haiti-and-domrep-latest.osrm
   docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/haiti-and-domrep-latest.osrm
   docker run -d -p 5000:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/haiti-and-domrep-latest.osrm
   ```

2. Point KOURI to your self-hosted instance by setting in your HTML or script:
   ```javascript
   window.KOURI_ROUTING_ENDPOINT = 'https://routing.yourdomain.ht/route/v1/driving';
   ```

---

## 🎨 How to Replace the Logo & Branding

1. **No Code Recompilation Needed**:
   - Go to **Admin > Paramèt & Mak (Settings)** (`/pages/admin/settings.html`).
   - Upload your light logo, icon, and favicon.
   - Pick your primary and accent brand colors with the live color picker.
   - Click **"Anrejistre Mak"**.
2. The changes are saved to Supabase Storage bucket `branding` and immediately applied everywhere through the [`assets/js/components/logo.js`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/assets/js/components/logo.js) component and CSS variables (`--ink`, `--primary`, `--accent`).
3. To replace the default SVG directly, overwrite [`assets/img/logo-placeholder.svg`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/assets/img/logo-placeholder.svg).

---

## ⚡ Zero-Stale Cache Solution (No More Ctrl+Shift+R!)

Previous service worker strategies aggressively cached HTML files `cache-first`. This caused code updates to be hidden behind stale cache until manually doing Ctrl+Shift+R.

**How this is permanently solved:**
1. **Network-First Navigation Strategy** in [`sw.js`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/sw.js):
   - Every `.html` page and navigation request goes directly to the network first. Online users always see fresh code immediately.
   - Cache is only used as a fallback when the user is truly offline.
2. **Strict Server No-Cache Headers** in [`server.js`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/server.js):
   - All HTML files are served with `Cache-Control: no-cache, no-store, must-revalidate, max-age=0`.
3. **Instant Activation & Auto-Update**:
   - `sw.js` runs `self.skipWaiting()` on install and `clients.claim()` on activate, pruning outdated cache generations automatically.
   - [`assets/js/sw-register.js`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/assets/js/sw-register.js) triggers `registration.update()` on every page load with `{ updateViaCache: 'none' }`.

---

## 📱 CVISUAL WhatsApp Gateway Integration

KOURI is integrated with the **CVISUAL WhatsApp Gateway REST API** using a secure server-side client ([`backend/whatsapp-gateway.js`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/backend/whatsapp-gateway.js)):

### 1. Security & Configuration
- **API Key**: `cv_live_laurore9_ec0b28c5a0b729162c63c6e2` stored securely in [`.env`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/.env) and handled **only** on the backend server.
- The browser frontend calls the proxy endpoint `/api/whatsapp/notify-event`, ensuring the API key is **never exposed** to clients.

### 2. Dual-Lane Routing & Anti-Ban Protection
- **Fast Lane** (`kind: 'receipt'`, `'welcome'`, `'otp'`, `'test'`): Priority delivery (~2.5s–6.5s) without daily caps. Used for instant trip alerts and security codes.
- **Slow Lane** (`kind: 'reminder'`, `'marketing'`, `'manual'`): Safe intervals (10–16 min) with Meta anti-ban pacing.
- **Spintax Enabled**: Dynamic message variation `{Bonjou|Bonswa}`.
- **Haitian Number Normalization**: 8-digit numbers (`37123456`) are automatically formatted to E.164 (`50937123456`).

### 3. Automatic Notification Triggers
1. **Welcome on Sign-Up**: Sent when a user registers on [`register.html`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/register.html).
2. **Ride Requested & 6-Digit PIN**: Sent immediately to the rider with their pickup PIN code.
3. **Driver Assigned**: Sent with driver name, vehicle model, and plate number.
4. **Driver Arrived**: Alert sent when the driver reaches the pickup location.
5. **Ride Completed & Fare Receipt**: Sent at drop-off with distance and total fare.

### 4. Admin WhatsApp Control Center
Go to **Admin > WhatsApp Gateway** ([`pages/admin/whatsapp.html`](file:///c:/Users/cbj1_u3/Documents/KOURI%20+/pages/admin/whatsapp.html)):
- Monitor live gateway health and active SIM lines (`50956164468` - READY).
- View daily quota remaining (5,000 messages/day).
- Test send messages with Spintax and lane selectors.
- Verify numbers with `/api/v1/numbers/check`.

---

## 🚀 Running the Server

Start the zero-dependency backend server:

```powershell
node server.js
```

This starts:
- Frontend on `http://localhost:3000`
- Instant no-cache HTML serving (eliminates Ctrl+Shift+R)
- WhatsApp Gateway REST proxy at `/api/whatsapp/...`


### Netlify:
1. Connect your repository to Netlify or run Netlify CLI:
   ```bash
   npx netlify-cli deploy --prod --dir=.
   ```
2. In the Netlify dashboard, configure **Asset Optimization** and ensure PWA Service Worker caching headers are active.

### Cloudflare Pages:
1. Go to **Workers & Pages > Create application > Pages**.
2. Connect your Git repository.
3. Build settings:
   - **Framework preset**: None / Static HTML.
   - **Build output directory**: `.` (Root directory).
4. Click **Save and Deploy**.

---

## 🧪 Testing the Flows Locally

You can serve the project using any static web server:

```powershell
# Using Python
python -m http.server 8080

# Or using npx serve
npx serve .
```

Open `http://localhost:8080` in your browser.
- **Rider Flow**: Go to `/pages/rider/home.html` (Choose destination, view category pricing, order ride, see searching radar, view assigned driver with PIN code, simulate complete trip).
- **Driver Flow**: Go to `/pages/driver/home.html` (Toggle online, trigger simulated request, accept within 15s countdown, view passenger pickup navigation, enter 6-digit confirmation code `582914`, record offline GPS traces, drop off passenger).
- **Admin Flow**: Go to `/pages/admin/dashboard.html` (View KPIs, inspect live fleet map, configure pricing, draw zones, assign drivers to subscribers).
- **Demo Switcher**: Click on any demo badge on `/login.html` to instantly switch between Demo Rider, Demo Driver, and Demo Admin!
