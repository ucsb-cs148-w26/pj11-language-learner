-- ============================================================================
-- Supabase Trigger Investigation and Fix Script
-- ============================================================================
-- Run this in your Supabase SQL Editor to investigate and fix the trigger issue
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Check for existing triggers on auth.users
-- ----------------------------------------------------------------------------
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  event_object_schema,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- ----------------------------------------------------------------------------
-- STEP 2: Check for functions that might be used by triggers
-- ----------------------------------------------------------------------------
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%user%' 
    OR routine_name LIKE '%profile%'
    OR routine_name LIKE '%auth%'
  )
ORDER BY routine_name;

-- ----------------------------------------------------------------------------
-- STEP 3: Check profiles table structure
-- ----------------------------------------------------------------------------
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ----------------------------------------------------------------------------
-- STEP 4: Check RLS policies on profiles table
-- ----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- STEP 5: Check if RLS is enabled on profiles table
-- ----------------------------------------------------------------------------
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- ============================================================================
-- FIX OPTION 1: Create/Replace a Safe Trigger Function
-- ============================================================================
-- This function handles errors gracefully and won't block user creation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to insert profile, but don't fail if it already exists or errors occur
  INSERT INTO public.profiles (
    user_id,
    email,
    level,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    'Beginner',
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log warning but don't fail user creation
    -- The application code will handle profile creation as fallback
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- FIX OPTION 2: Create the Trigger (if it doesn't exist or replace it)
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires AFTER INSERT (so user is already created)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FIX OPTION 3: Ensure RLS Policy Allows Service Role to Insert
-- ============================================================================
-- Only needed if RLS is enabled and blocking the trigger

-- Check if service_role policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Allow service role to create profiles'
  ) THEN
    CREATE POLICY "Allow service role to create profiles"
    ON public.profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);
    
    RAISE NOTICE 'Created RLS policy for service_role';
  ELSE
    RAISE NOTICE 'RLS policy for service_role already exists';
  END IF;
END $$;

-- ============================================================================
-- ALTERNATIVE: Disable Trigger and Use Application Code Only
-- ============================================================================
-- If you prefer to handle profile creation entirely in your app code,
-- uncomment these lines to remove the trigger:

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- VERIFICATION: Test the Setup
-- ============================================================================

-- Check that trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- Check recent profiles to see if they're being created
SELECT 
  user_id,
  email,
  level,
  updated_at
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================================================
-- TROUBLESHOOTING: Check for Common Issues
-- ============================================================================

-- Check if there are any constraints that might be failing
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- Check for NOT NULL constraints that might be missing values
SELECT
  a.attname AS column_name,
  a.attnotnull AS is_not_null,
  a.atthasdef AS has_default
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
WHERE c.relname = 'profiles'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;
