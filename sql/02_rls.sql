-- ======================================================================
-- KOURI — Ride Hailing Platform Database Schema
-- SQL 02: Row Level Security (RLS) & Policies
-- ======================================================================

-- ----------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ----------------------------------------------------------------------

-- Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
    ) OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current authenticated user is an approved driver
CREATE OR REPLACE FUNCTION public.is_approved_driver()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.drivers
        WHERE id = auth.uid() AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------
-- ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------
-- 1. PUBLIC READABLE TABLES (Categories, Plans, Settings, Zones)
-- ----------------------------------------------------------------------
-- Vehicle categories: public view, admin manage
DROP POLICY IF EXISTS "Public read vehicle categories" ON public.vehicle_categories;
CREATE POLICY "Public read vehicle categories" ON public.vehicle_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage vehicle categories" ON public.vehicle_categories;
CREATE POLICY "Admin manage vehicle categories" ON public.vehicle_categories FOR ALL USING (public.is_admin());

-- App settings: public view, admin manage
DROP POLICY IF EXISTS "Public read app settings" ON public.app_settings;
CREATE POLICY "Public read app settings" ON public.app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage app settings" ON public.app_settings;
CREATE POLICY "Admin manage app settings" ON public.app_settings FOR ALL USING (public.is_admin());

-- Zones: public view active zones, admin manage
DROP POLICY IF EXISTS "Public read zones" ON public.zones;
CREATE POLICY "Public read zones" ON public.zones FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage zones" ON public.zones;
CREATE POLICY "Admin manage zones" ON public.zones FOR ALL USING (public.is_admin());

-- Zone prices: public view, admin manage
DROP POLICY IF EXISTS "Public read zone prices" ON public.zone_prices;
CREATE POLICY "Public read zone prices" ON public.zone_prices FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage zone prices" ON public.zone_prices;
CREATE POLICY "Admin manage zone prices" ON public.zone_prices FOR ALL USING (public.is_admin());

-- Pricing rules: public view, admin manage
DROP POLICY IF EXISTS "Public read pricing rules" ON public.pricing_rules;
CREATE POLICY "Public read pricing rules" ON public.pricing_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage pricing rules" ON public.pricing_rules;
CREATE POLICY "Admin manage pricing rules" ON public.pricing_rules FOR ALL USING (public.is_admin());

-- Surge rules: public view active, admin manage
DROP POLICY IF EXISTS "Public read surge rules" ON public.surge_rules;
CREATE POLICY "Public read surge rules" ON public.surge_rules FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage surge rules" ON public.surge_rules;
CREATE POLICY "Admin manage surge rules" ON public.surge_rules FOR ALL USING (public.is_admin());

-- Subscription plans: public read active, admin manage
DROP POLICY IF EXISTS "Public read subscription plans" ON public.subscription_plans;
CREATE POLICY "Public read subscription plans" ON public.subscription_plans FOR SELECT USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admin manage subscription plans" ON public.subscription_plans FOR ALL USING (public.is_admin());

-- Promo codes: authenticated read active, admin manage
DROP POLICY IF EXISTS "Auth read promo codes" ON public.promo_codes;
CREATE POLICY "Auth read promo codes" ON public.promo_codes FOR SELECT TO authenticated USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage promo codes" ON public.promo_codes;
CREATE POLICY "Admin manage promo codes" ON public.promo_codes FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------
-- 2. USER PROFILES & ADMIN USERS
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage all profiles" ON public.profiles;
CREATE POLICY "Admin manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage admin_users" ON public.admin_users;
CREATE POLICY "Admin manage admin_users" ON public.admin_users FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Auth read admin_users for self check" ON public.admin_users;
CREATE POLICY "Auth read admin_users for self check" ON public.admin_users FOR SELECT TO authenticated USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- ----------------------------------------------------------------------
-- 3. DRIVERS & VEHICLES & DOCUMENTS
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Drivers read own status" ON public.drivers;
CREATE POLICY "Drivers read own status" ON public.drivers FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Drivers update own online status" ON public.drivers;
CREATE POLICY "Drivers update own online status" ON public.drivers FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage all drivers" ON public.drivers;
CREATE POLICY "Admin manage all drivers" ON public.drivers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Drivers manage own vehicles" ON public.vehicles;
CREATE POLICY "Drivers manage own vehicles" ON public.vehicles FOR ALL TO authenticated USING (auth.uid() = driver_id OR public.is_admin());
DROP POLICY IF EXISTS "Drivers manage own documents" ON public.driver_documents;
CREATE POLICY "Drivers manage own documents" ON public.driver_documents FOR SELECT TO authenticated USING (auth.uid() = driver_id OR public.is_admin());
DROP POLICY IF EXISTS "Drivers insert own documents" ON public.driver_documents;
CREATE POLICY "Drivers insert own documents" ON public.driver_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Admin manage all driver documents" ON public.driver_documents;
CREATE POLICY "Admin manage all driver documents" ON public.driver_documents FOR ALL USING (public.is_admin());

-- Driver locations: Drivers update own, riders/drivers/admin read for map
DROP POLICY IF EXISTS "Drivers update own location" ON public.driver_locations;
CREATE POLICY "Drivers update own location" ON public.driver_locations FOR ALL TO authenticated USING (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Public read online driver locations" ON public.driver_locations;
CREATE POLICY "Public read online driver locations" ON public.driver_locations FOR SELECT USING (is_online = true OR public.is_admin());

-- ----------------------------------------------------------------------
-- 4. RIDES, EVENTS & TRACKS
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Riders read own rides" ON public.rides;
CREATE POLICY "Riders read own rides" ON public.rides FOR SELECT TO authenticated 
    USING (auth.uid() = rider_id OR auth.uid() = driver_id OR (status IN ('requested', 'offered') AND public.is_approved_driver()) OR public.is_admin());

DROP POLICY IF EXISTS "Riders create rides" ON public.rides;
CREATE POLICY "Riders create rides" ON public.rides FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = rider_id OR public.is_admin());

DROP POLICY IF EXISTS "Participants update rides" ON public.rides;
CREATE POLICY "Participants update rides" ON public.rides FOR UPDATE TO authenticated 
    USING (auth.uid() = rider_id OR auth.uid() = driver_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage all rides" ON public.rides;
CREATE POLICY "Admin manage all rides" ON public.rides FOR ALL USING (public.is_admin());

-- Ride events
DROP POLICY IF EXISTS "Ride participants read events" ON public.ride_events;
CREATE POLICY "Ride participants read events" ON public.ride_events FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid())) OR public.is_admin());

DROP POLICY IF EXISTS "Ride participants insert events" ON public.ride_events;
CREATE POLICY "Ride participants insert events" ON public.ride_events FOR INSERT TO authenticated 
    WITH CHECK (actor_id = auth.uid() OR public.is_admin());

-- Ride tracks (GPS breadcrumbs)
DROP POLICY IF EXISTS "Participants read tracks" ON public.ride_tracks;
CREATE POLICY "Participants read tracks" ON public.ride_tracks FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND (r.rider_id = auth.uid() OR r.driver_id = auth.uid())) OR public.is_admin());

DROP POLICY IF EXISTS "Drivers insert tracks" ON public.ride_tracks;
CREATE POLICY "Drivers insert tracks" ON public.ride_tracks FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = driver_id OR public.is_admin());

-- ----------------------------------------------------------------------
-- 5. SUBSCRIPTIONS & DRIVER ASSIGNMENTS
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Riders read own subscriptions" ON public.subscriptions;
CREATE POLICY "Riders read own subscriptions" ON public.subscriptions FOR SELECT TO authenticated 
    USING (auth.uid() = rider_id OR public.is_admin());

DROP POLICY IF EXISTS "Riders create own subscriptions" ON public.subscriptions;
CREATE POLICY "Riders create own subscriptions" ON public.subscriptions FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = rider_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admin manage subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "View driver assignments" ON public.subscription_driver_assignments;
CREATE POLICY "View driver assignments" ON public.subscription_driver_assignments FOR SELECT TO authenticated 
    USING (
        auth.uid() = driver_id OR 
        EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_id AND s.rider_id = auth.uid()) OR 
        public.is_admin()
    );

DROP POLICY IF EXISTS "Admin manage driver assignments" ON public.subscription_driver_assignments;
CREATE POLICY "Admin manage driver assignments" ON public.subscription_driver_assignments FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------
-- 6. WALLETS, PAYMENTS & TRANSACTIONS
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users read own wallet" ON public.wallets;
CREATE POLICY "Users read own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users read own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users read own wallet transactions" ON public.wallet_transactions FOR SELECT TO authenticated 
    USING (auth.uid() = wallet_id OR public.is_admin());

DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users insert payments" ON public.payments;
CREATE POLICY "Users insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage all payments" ON public.payments;
CREATE POLICY "Admin manage all payments" ON public.payments FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Drivers view own payouts" ON public.payout_requests;
CREATE POLICY "Drivers view own payouts" ON public.payout_requests FOR SELECT TO authenticated USING (auth.uid() = driver_id OR public.is_admin());
DROP POLICY IF EXISTS "Drivers insert payout requests" ON public.payout_requests;
CREATE POLICY "Drivers insert payout requests" ON public.payout_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
DROP POLICY IF EXISTS "Admin manage all payout requests" ON public.payout_requests;
CREATE POLICY "Admin manage all payout requests" ON public.payout_requests FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------
-- 7. SAVED PLACES, NOTIFICATIONS, TICKETS & RATINGS
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Riders manage saved places" ON public.saved_places;
CREATE POLICY "Riders manage saved places" ON public.saved_places FOR ALL TO authenticated USING (auth.uid() = rider_id);

DROP POLICY IF EXISTS "Users manage notifications" ON public.notifications;
CREATE POLICY "Users manage notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage support tickets" ON public.support_tickets;
CREATE POLICY "Users manage support tickets" ON public.support_tickets FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users create ratings" ON public.ratings;
CREATE POLICY "Users create ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
DROP POLICY IF EXISTS "Users read ratings" ON public.ratings;
CREATE POLICY "Users read ratings" ON public.ratings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users create sos alerts" ON public.sos_alerts;
CREATE POLICY "Users create sos alerts" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users view own sos alerts" ON public.sos_alerts;
CREATE POLICY "Users view own sos alerts" ON public.sos_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Admin manage sos alerts" ON public.sos_alerts;
CREATE POLICY "Admin manage sos alerts" ON public.sos_alerts FOR ALL USING (public.is_admin());
