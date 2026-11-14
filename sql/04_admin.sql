-- ======================================================================
-- KOURI — Ride Hailing Platform Database Schema
-- SQL 04: Admin User Initialization
-- ======================================================================

-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- IMPORTANT: EDIT THE EMAIL BELOW BEFORE RUNNING THIS FILE!
-- Replace 'admin@kouri.ht' with the real email you use to register/login
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

INSERT INTO public.admin_users (email)
VALUES 
    ('admin@kouri.ht'),
    ('cvisual@kouri.ht'),
    ('laurorejeanclarens0@gmail.com'),
    ('laurorejeanclarens9@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- If a profile already exists for these emails, update their role to 'admin'
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
    SELECT u.id 
    FROM auth.users u 
    JOIN public.admin_users a ON lower(u.email) = lower(a.email)
);
