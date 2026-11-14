-- ======================================================================
-- KOURI — Ride Hailing Platform Database Schema
-- SQL 03: Storage Buckets & Policies
-- ======================================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('branding', 'branding', true),
    ('avatars', 'avatars', true),
    ('vehicle-photos', 'vehicle-photos', true),
    ('driver-documents', 'driver-documents', false),
    ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. Branding Bucket Policies (Public read, Admin write)
DROP POLICY IF EXISTS "Public read branding" ON storage.objects;
CREATE POLICY "Public read branding"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "Admin manage branding" ON storage.objects;
CREATE POLICY "Admin manage branding"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'branding' AND public.is_admin())
WITH CHECK (bucket_id = 'branding' AND public.is_admin());

-- 3. Avatars Bucket Policies (Public read, Authenticated user write own avatar)
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Vehicle Photos Bucket Policies (Public read, Drivers manage own)
DROP POLICY IF EXISTS "Public read vehicle photos" ON storage.objects;
CREATE POLICY "Public read vehicle photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-photos');

DROP POLICY IF EXISTS "Drivers upload vehicle photos" ON storage.objects;
CREATE POLICY "Drivers upload vehicle photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'vehicle-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Driver Documents (Private, Drivers read/upload own, Admin full access)
DROP POLICY IF EXISTS "Drivers read own documents" ON storage.objects;
CREATE POLICY "Drivers read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'driver-documents' 
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

DROP POLICY IF EXISTS "Drivers upload own documents" ON storage.objects;
CREATE POLICY "Drivers upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'driver-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Payment Proofs (Private, Users read/upload own, Admin full access)
DROP POLICY IF EXISTS "Users and Admin read payment proofs" ON storage.objects;
CREATE POLICY "Users and Admin read payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment-proofs' 
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

DROP POLICY IF EXISTS "Users upload payment proofs" ON storage.objects;
CREATE POLICY "Users upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'payment-proofs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
