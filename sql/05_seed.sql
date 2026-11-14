-- ======================================================================
-- KOURI — Ride Hailing Platform Database Schema
-- SQL 05: Realistic Seed Data (Port-au-Prince Zones, Pricing, Plans, Categories)
-- ======================================================================

-- 1. App Settings (Default branding & operational parameters)
INSERT INTO public.app_settings (key, value)
VALUES 
    ('branding', '{
        "app_name": "KOURI",
        "tagline": "Transpò rapid, fyab e an sekirite nan Ayiti",
        "logo_url": "/assets/img/logo-placeholder.svg",
        "icon_url": "/assets/img/logo-placeholder.svg",
        "favicon_url": "/assets/img/logo-placeholder.svg",
        "primary_color": "#0B0F1A",
        "accent_color": "#2563EB",
        "font_family": "Plus Jakarta Sans, Inter, sans-serif"
    }'::jsonb),
    ('operations', '{
        "search_radius_km": 8.0,
        "dispatch_timeout_seconds": 15,
        "default_commission_rate": 0.15,
        "min_driver_rating": 4.2,
        "auto_dispatch": true,
        "offline_sync_max_age_hours": 24
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Vehicle Categories
INSERT INTO public.vehicle_categories (id, name, description, icon, capacity, base_fare, per_km_rate, per_minute_rate, min_fare, commission_rate, sort_order)
VALUES 
    ('moto', 'Kouri Moto', 'Pi rapid nan anbouteyaj, ekonomik pou yon pasaje', 'bike', 1, 100.00, 35.00, 5.00, 150.00, 0.12, 1),
    ('standard', 'Kouri Klasik', 'Sedan 4 plas konfòtab ak èkondisyone', 'car', 4, 250.00, 65.00, 12.00, 350.00, 0.15, 2),
    ('comfort', 'Kouri Konfò', 'SUV oswa machin modèn, sèvis primyòm', 'sparkles', 4, 450.00, 95.00, 18.00, 600.00, 0.18, 3),
    ('van', 'Kouri Van', 'Minivan 7 plas pou fanmi, gwoup oswa kago', 'truck', 7, 700.00, 130.00, 25.00, 1000.00, 0.20, 4)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    capacity = EXCLUDED.capacity,
    base_fare = EXCLUDED.base_fare,
    per_km_rate = EXCLUDED.per_km_rate,
    per_minute_rate = EXCLUDED.per_minute_rate,
    min_fare = EXCLUDED.min_fare;

-- 3. Pricing Rules
INSERT INTO public.pricing_rules (mode, waiting_fee_per_min, cancellation_fee, night_start, night_end, night_multiplier)
VALUES ('hybrid', 15.00, 150.00, '20:30:00', '05:30:00', 1.25)
ON CONFLICT DO NOTHING;

-- 4. Port-au-Prince Metropolitan Zones (Realistic Polygons)
-- Clean, real geographic coordinates around Delmas, Pétion-Ville, Tabarre, Airport, Centre-Ville, Carrefour
INSERT INTO public.zones (id, name, code, type, boundary, is_active)
VALUES 
    (
        'a1111111-1111-1111-1111-111111111111',
        'Aewopò Entènasyonal (Mais Gâté / Clercine)',
        'ZONE_AIRPORT',
        'airport',
        ST_GeomFromText('POLYGON((-72.305 18.570, -72.280 18.570, -72.280 18.590, -72.305 18.590, -72.305 18.570))', 4326),
        true
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'Petyonvil (Pétion-Ville & Mòn Kalvè)',
        'ZONE_PETIONVILLE',
        'standard',
        ST_GeomFromText('POLYGON((-72.310 18.500, -72.270 18.500, -72.270 18.530, -72.310 18.530, -72.310 18.500))', 4326),
        true
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'Dèlma (Delmas 30 rive Delmas 95)',
        'ZONE_DELMAS',
        'standard',
        ST_GeomFromText('POLYGON((-72.330 18.530, -72.290 18.530, -72.290 18.565, -72.330 18.565, -72.330 18.530))', 4326),
        true
    ),
    (
        'd4444444-4444-4444-4444-444444444444',
        'Taba (Tabarre & Blvd 15 Oktòb)',
        'ZONE_TABARRE',
        'standard',
        ST_GeomFromText('POLYGON((-72.285 18.560, -72.250 18.560, -72.250 18.600, -72.285 18.600, -72.285 18.560))', 4326),
        true
    ),
    (
        'e5555555-5555-5555-5555-555555555555',
        'Sant Vil (Pòtoprens Sant & Channmas)',
        'ZONE_DOWNTOWN',
        'special',
        ST_GeomFromText('POLYGON((-72.355 18.530, -72.325 18.530, -72.325 18.560, -72.355 18.560, -72.355 18.530))', 4326),
        true
    )
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    boundary = EXCLUDED.boundary;

-- 5. Zone Fixed Price Matrix Samples
INSERT INTO public.zone_prices (from_zone_id, to_zone_id, category_id, fixed_price)
VALUES 
    -- Airport to Petion-Ville
    ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'standard', 1500.00),
    ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'comfort', 2200.00),
    ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'moto', 600.00),
    -- Delmas to Petion-Ville
    ('c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'standard', 650.00),
    ('c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'moto', 250.00),
    -- Delmas to Airport
    ('c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'standard', 800.00)
ON CONFLICT (from_zone_id, to_zone_id, category_id) DO UPDATE SET fixed_price = EXCLUDED.fixed_price;

-- 6. Subscription Plans
INSERT INTO public.subscription_plans (id, name, description, duration_type, price, plan_type, rides_count, discount_percent, priority_dispatch, is_active)
VALUES 
    (
        'f1111111-1111-1111-1111-111111111111',
        'Abònman Wout Travay (Commuter)',
        '20 kous pa mwa ant kay ak travay. Chofè dedye asiyen, pri fiks garanti san kout anbouteyaj oswa surge.',
        'monthly',
        12500.00,
        'included_rides',
        20,
        15.00,
        true,
        true
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        'Kouri Biznis VIP San Limit',
        'Kous san limit nan zòn Petyonvil, Dèlma ak Taba. Asiyasyon priyoritè ak chofè Konfò dedye.',
        'monthly',
        35000.00,
        'unlimited_zone',
        999,
        25.00,
        true,
        true
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        'Pake Lekòl / Fanmi Semèn',
        '10 kous pa semèn ak chofè verifye pèsonèlman. Ideyal pou depoze e chache timoun lekòl an sekirite.',
        'weekly',
        4500.00,
        'included_rides',
        10,
        10.00,
        true,
        true
    )
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price;

-- 7. Promo Codes
INSERT INTO public.promo_codes (code, discount_percent, max_discount, valid_until, usage_limit, is_active)
VALUES 
    ('BIENVENUE', 20.00, 300.00, now() + interval '90 days', 500, true),
    ('KOURI2026', 15.00, 200.00, now() + interval '180 days', 1000, true)
ON CONFLICT (code) DO NOTHING;
