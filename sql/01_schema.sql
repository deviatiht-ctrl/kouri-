-- ======================================================================
-- KOURI — Ride Hailing Platform Database Schema
-- SQL 01: Core Schema, Extensions, Tables, Triggers, & Postgres Functions
-- ======================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ----------------------------------------------------------------------
-- PROFILES & AUTH EXTENSION
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('rider', 'driver', 'admin')) DEFAULT 'rider',
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    language TEXT NOT NULL DEFAULT 'ht' CHECK (language IN ('ht', 'fr', 'en')),
    currency TEXT NOT NULL DEFAULT 'HTG' CHECK (currency IN ('HTG', 'USD')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all required columns exist in case profiles table was pre-existing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'rider';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='language') THEN
        ALTER TABLE public.profiles ADD COLUMN language TEXT NOT NULL DEFAULT 'ht';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='currency') THEN
        ALTER TABLE public.profiles ADD COLUMN currency TEXT NOT NULL DEFAULT 'HTG';
    END IF;
END $$;

-- Admin email whitelist table (used for secure role checks & admin interface access)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------
-- VEHICLE CATEGORIES & VEHICLES
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
    id TEXT PRIMARY KEY, -- 'moto', 'standard', 'comfort', 'van'
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'car', -- Lucide icon name
    capacity INT NOT NULL DEFAULT 4,
    base_fare NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    per_km_rate NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    per_minute_rate NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    min_fare NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
    commission_rate NUMERIC(4, 3) NOT NULL DEFAULT 0.150, -- 15%
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.vehicle_categories(id),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT NOT NULL,
    color TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    photo_url TEXT DEFAULT '',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------
-- DRIVERS & DOCUMENTS
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES public.vehicle_categories(id) ON DELETE SET NULL,
    is_online BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_trips INT NOT NULL DEFAULT 0,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.driver_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('license', 'id_card', 'registration', 'insurance', 'vehicle_photo')),
    file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------
-- GEOGRAPHIC ZONES & PRICING
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'standard' CHECK (type IN ('standard', 'airport', 'special', 'restricted')),
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_zones_boundary ON public.zones USING GIST (boundary);

CREATE TABLE IF NOT EXISTS public.zone_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    to_zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.vehicle_categories(id) ON DELETE CASCADE,
    fixed_price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(from_zone_id, to_zone_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode TEXT NOT NULL DEFAULT 'hybrid' CHECK (mode IN ('distance', 'zone', 'hybrid')),
    waiting_fee_per_min NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
    cancellation_fee NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    night_start TIME NOT NULL DEFAULT '21:00:00',
    night_end TIME NOT NULL DEFAULT '05:00:00',
    night_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.25,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.surge_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
    multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    reason TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------
-- SUBSCRIPTIONS & DEDICATED DRIVER ASSIGNMENTS
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_type TEXT NOT NULL DEFAULT 'monthly' CHECK (duration_type IN ('weekly', 'monthly', 'custom')),
    price NUMERIC(10, 2) NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('included_rides', 'unlimited_zone', 'discount_percent', 'fixed_route')),
    rides_count INT NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    covered_zone_ids UUID[] DEFAULT '{}',
    allowed_category_ids TEXT[] DEFAULT '{}',
    priority_dispatch BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending_payment')),
    rides_used INT NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ends_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subscription_driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    schedule_slot TEXT NOT NULL DEFAULT '08:00 - 18:00 (Mon-Fri)',
    assigned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------
-- RIDES & DISPATCH ENGINE
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES public.profiles(id),
    driver_id UUID REFERENCES public.profiles(id),
    category_id TEXT NOT NULL REFERENCES public.vehicle_categories(id),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (
        status IN (
            'requested', 'offered', 'accepted', 'arrived', 
            'in_progress', 'completed', 'paid', 
            'cancelled_by_rider', 'cancelled_by_driver', 'cancelled_by_admin'
        )
    ),
    pickup_lat NUMERIC(10, 7) NOT NULL,
    pickup_lng NUMERIC(10, 7) NOT NULL,
    pickup_address TEXT NOT NULL,
    pickup_geom GEOMETRY(Point, 4326),
    destination_lat NUMERIC(10, 7) NOT NULL,
    destination_lng NUMERIC(10, 7) NOT NULL,
    destination_address TEXT NOT NULL,
    destination_geom GEOMETRY(Point, 4326),
    fare NUMERIC(10, 2) NOT NULL,
    estimated_fare NUMERIC(10, 2) NOT NULL,
    distance_km NUMERIC(6, 2) NOT NULL,
    duration_min NUMERIC(6, 2) NOT NULL,
    pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    trip_code TEXT NOT NULL, -- 6 digits code
    trip_token TEXT,        -- signed verification hash for offline HMAC check
    idempotency_key TEXT UNIQUE,
    offline_synced BOOLEAN NOT NULL DEFAULT false,
    anomaly_flag BOOLEAN NOT NULL DEFAULT false,
    anomaly_reason TEXT,
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'wallet', 'moncash', 'natcash', 'subscription')),
    subscription_id UUID REFERENCES public.subscriptions(id),
    rating NUMERIC(2, 1),
    tip NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    accepted_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides (status);
CREATE INDEX IF NOT EXISTS idx_rides_rider ON public.rides (rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON public.rides (driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_geom ON public.rides USING GIST (pickup_geom);

-- Ride State Change Audit Log
CREATE TABLE IF NOT EXISTS public.ride_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id),
    status TEXT NOT NULL,
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- GPS Traces recorded offline/online
CREATE TABLE IF NOT EXISTS public.ride_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    location GEOMETRY(Point, 4326) NOT NULL,
    speed NUMERIC(5, 2) DEFAULT 0.0,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ride_tracks_ride ON public.ride_tracks (ride_id);

-- Realtime Driver Locations
CREATE TABLE IF NOT EXISTS public.driver_locations (
    driver_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.vehicle_categories(id),
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    heading NUMERIC(5, 2) DEFAULT 0.0,
    speed NUMERIC(5, 2) DEFAULT 0.0,
    is_online BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_geom ON public.driver_locations USING GIST (location);

-- ----------------------------------------------------------------------
-- RATINGS, WALLETS & PAYMENTS
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id),
    to_user_id UUID NOT NULL REFERENCES public.profiles(id),
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'HTG',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup', 'ride_payment', 'commission', 'payout', 'refund', 'subscription')),
    description TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    ride_id UUID REFERENCES public.rides(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'HTG',
    provider TEXT NOT NULL CHECK (provider IN ('cash', 'wallet', 'moncash', 'natcash')),
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    transaction_code TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('moncash', 'natcash', 'bank')),
    account_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_percent NUMERIC(5, 2) NOT NULL,
    max_discount NUMERIC(10, 2) DEFAULT 250.00,
    valid_until TIMESTAMPTZ NOT NULL,
    usage_limit INT NOT NULL DEFAULT 100,
    times_used INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- e.g. "Kay / Home", "Biwo / Work"
    address TEXT NOT NULL,
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    icon TEXT NOT NULL DEFAULT 'map-pin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    read BOOLEAN NOT NULL DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    ride_id UUID REFERENCES public.rides(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sos_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES public.rides(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    lat NUMERIC(10, 7) NOT NULL,
    lng NUMERIC(10, 7) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ----------------------------------------------------------------------
-- TRIGGERS & AUTOMATION
-- ----------------------------------------------------------------------

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_drivers_updated_at ON public.drivers;
CREATE TRIGGER tr_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER tr_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_driver_documents_updated_at ON public.driver_documents;
CREATE TRIGGER tr_driver_documents_updated_at BEFORE UPDATE ON public.driver_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile and wallet on new Supabase auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'rider';
    v_full_name TEXT := '';
    v_phone TEXT := '';
BEGIN
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        v_role := NEW.raw_user_meta_data->>'role';
    END IF;
    IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
        v_full_name := NEW.raw_user_meta_data->>'full_name';
    END IF;
    IF NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
        v_phone := NEW.raw_user_meta_data->>'phone';
    END IF;

    -- Check if email is in admin_users, elevate role to admin if so
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(NEW.email)) THEN
        v_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, role, full_name, phone)
    VALUES (NEW.id, v_role, v_full_name, v_phone)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (id, balance, currency)
    VALUES (NEW.id, 0.00, 'HTG')
    ON CONFLICT (id) DO NOTHING;

    -- If driver, insert into drivers table as well
    IF v_role = 'driver' THEN
        INSERT INTO public.drivers (id, status, is_online)
        VALUES (NEW.id, 'pending', false)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind new auth user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-sync PostGIS Point geometries on ride pickup/destination insert or update
CREATE OR REPLACE FUNCTION public.sync_ride_geometries()
RETURNS TRIGGER AS $$
BEGIN
    NEW.pickup_geom = ST_SetSRID(ST_MakePoint(NEW.pickup_lng, NEW.pickup_lat), 4326);
    NEW.destination_geom = ST_SetSRID(ST_MakePoint(NEW.destination_lng, NEW.destination_lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_rides_sync_geom ON public.rides;
CREATE TRIGGER tr_rides_sync_geom
    BEFORE INSERT OR UPDATE OF pickup_lat, pickup_lng, destination_lat, destination_lng
    ON public.rides
    FOR EACH ROW EXECUTE FUNCTION public.sync_ride_geometries();

-- Auto-sync PostGIS Point geometries on driver_locations
CREATE OR REPLACE FUNCTION public.sync_driver_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_driver_location_geom ON public.driver_locations;
CREATE TRIGGER tr_driver_location_geom
    BEFORE INSERT OR UPDATE OF lat, lng
    ON public.driver_locations
    FOR EACH ROW EXECUTE FUNCTION public.sync_driver_location_geom();

-- ----------------------------------------------------------------------
-- CORE DISPATCH & PRICING POSTGRES FUNCTIONS (RPC)
-- ----------------------------------------------------------------------

-- 1. Find Nearest Available Drivers
CREATE OR REPLACE FUNCTION public.find_nearest_drivers(
    p_lat NUMERIC,
    p_lng NUMERIC,
    p_category_id TEXT,
    p_radius_km NUMERIC DEFAULT 10.0
)
RETURNS TABLE (
    driver_id UUID,
    full_name TEXT,
    phone TEXT,
    rating NUMERIC,
    avatar_url TEXT,
    category_id TEXT,
    lat NUMERIC,
    lng NUMERIC,
    distance_meters DOUBLE PRECISION,
    heading NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id AS driver_id,
        p.full_name,
        p.phone,
        d.rating,
        p.avatar_url,
        dl.category_id,
        dl.lat,
        dl.lng,
        ST_Distance(
            dl.location::geography, 
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) AS distance_meters,
        dl.heading
    FROM public.drivers d
    JOIN public.profiles p ON p.id = d.id
    JOIN public.driver_locations dl ON dl.driver_id = d.id
    WHERE d.status = 'approved'
      AND d.is_online = true
      AND (p_category_id IS NULL OR dl.category_id = p_category_id)
      AND ST_DWithin(
          dl.location::geography, 
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, 
          p_radius_km * 1000
      )
    ORDER BY distance_meters ASC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Calculate Fare (Hybrid / Zone / Distance with Night & Surge Multipliers)
CREATE OR REPLACE FUNCTION public.calculate_trip_fare(
    p_category_id TEXT,
    p_pickup_lat NUMERIC,
    p_pickup_lng NUMERIC,
    p_dest_lat NUMERIC,
    p_dest_lng NUMERIC,
    p_distance_km NUMERIC,
    p_duration_min NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_pricing_mode TEXT := 'hybrid';
    v_cat RECORD;
    v_rules RECORD;
    v_pickup_zone_id UUID;
    v_dest_zone_id UUID;
    v_zone_price NUMERIC := NULL;
    v_base_fare NUMERIC := 0.0;
    v_distance_fare NUMERIC := 0.0;
    v_time_fare NUMERIC := 0.0;
    v_total_fare NUMERIC := 0.0;
    v_multiplier NUMERIC := 1.0;
    v_surge_multiplier NUMERIC := 1.0;
    v_current_time TIME;
    v_result JSONB;
BEGIN
    -- Fetch category rates
    SELECT * INTO v_cat FROM public.vehicle_categories WHERE id = p_category_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vehicle category % does not exist', p_category_id;
    END IF;

    -- Fetch global pricing rule
    SELECT * INTO v_rules FROM public.pricing_rules LIMIT 1;
    IF FOUND THEN
        v_pricing_mode := v_rules.mode;
    END IF;

    -- Check zones for pickup and destination
    SELECT id INTO v_pickup_zone_id FROM public.zones 
    WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint(p_pickup_lng, p_pickup_lat), 4326)) LIMIT 1;

    SELECT id INTO v_dest_zone_id FROM public.zones 
    WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)) LIMIT 1;

    -- Check zone-to-zone fixed pricing if applicable
    IF (v_pricing_mode IN ('zone', 'hybrid')) AND (v_pickup_zone_id IS NOT NULL) AND (v_dest_zone_id IS NOT NULL) THEN
        SELECT fixed_price INTO v_zone_price FROM public.zone_prices 
        WHERE from_zone_id = v_pickup_zone_id AND to_zone_id = v_dest_zone_id AND category_id = p_category_id;
    END IF;

    -- Determine base calculation
    IF v_zone_price IS NOT NULL THEN
        v_total_fare := v_zone_price;
    ELSE
        v_base_fare := v_cat.base_fare;
        v_distance_fare := p_distance_km * v_cat.per_km_rate;
        v_time_fare := p_duration_min * v_cat.per_minute_rate;
        v_total_fare := GREATEST(v_base_fare + v_distance_fare + v_time_fare, v_cat.min_fare);
    END IF;

    -- Night time multiplier
    v_current_time := CURRENT_TIME;
    IF v_rules IS NOT NULL AND (
        (v_rules.night_start <= v_rules.night_end AND v_current_time BETWEEN v_rules.night_start AND v_rules.night_end) OR
        (v_rules.night_start > v_rules.night_end AND (v_current_time >= v_rules.night_start OR v_current_time <= v_rules.night_end))
    ) THEN
        v_multiplier := v_multiplier * v_rules.night_multiplier;
    END IF;

    -- Zone surge multiplier if pickup zone has active surge
    IF v_pickup_zone_id IS NOT NULL THEN
        SELECT COALESCE(MAX(multiplier), 1.0) INTO v_surge_multiplier 
        FROM public.surge_rules 
        WHERE zone_id = v_pickup_zone_id AND is_active = true 
          AND (starts_at IS NULL OR starts_at <= now())
          AND (ends_at IS NULL OR ends_at >= now());
        v_multiplier := v_multiplier * v_surge_multiplier;
    END IF;

    v_total_fare := ROUND((v_total_fare * v_multiplier)::numeric, 2);

    v_result := jsonb_build_object(
        'total_fare', v_total_fare,
        'category_id', p_category_id,
        'base_fare', v_cat.base_fare,
        'per_km_rate', v_cat.per_km_rate,
        'per_min_rate', v_cat.per_minute_rate,
        'min_fare', v_cat.min_fare,
        'distance_km', p_distance_km,
        'duration_min', p_duration_min,
        'is_zone_fare', (v_zone_price IS NOT NULL),
        'zone_price', v_zone_price,
        'multiplier', v_multiplier,
        'commission_rate', v_cat.commission_rate
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
