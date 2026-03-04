-- Migration to add 'pending' role and set it as default

-- 1. Add 'pending' to the user_role enum
-- Note: PostgreSQL doesn't support adding enum values within a transaction/easily in some versions without ALTER TYPE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'manager', 'pending');
    ELSE
        ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'pending';
    END IF;
END $$;

-- 2. Update profiles table default role
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending';

-- 3. Update handle_new_user function to use 'pending' as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'pending')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
