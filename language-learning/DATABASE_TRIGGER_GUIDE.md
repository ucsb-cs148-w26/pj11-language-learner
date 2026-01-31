# Database Trigger Investigation Guide

## Problem
You're getting the error: `server_error: Database error saving new user` when signing in with Google OAuth.

This typically means there's a database trigger on `auth.users` that automatically creates a profile when a new user signs up, but the trigger is failing.

## How to Investigate

### Step 1: Check for Existing Triggers

In your Supabase dashboard, go to:
**Database → Triggers**

Look for triggers on the `auth.users` table. Common trigger names:
- `on_auth_user_created`
- `handle_new_user`
- `create_profile_for_new_user`
- `on_user_created`

### Step 2: Check Database Functions

Go to:
**Database → Functions**

Look for functions that might be called by triggers, such as:
- `handle_new_user()`
- `create_profile_for_user()`
- `on_auth_user_created()`

### Step 3: Check Supabase Logs

Go to:
**Logs → Postgres Logs** or **Logs → Database Logs**

Look for recent errors related to:
- Profile creation
- INSERT into `profiles` table
- RLS (Row Level Security) policy violations

### Step 4: Run SQL Queries to Check

In **SQL Editor**, run these queries:

#### Check for triggers on auth.users:
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';
```

#### Check for functions that might be used by triggers:
```sql
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%'
  OR routine_name LIKE '%profile%';
```

#### Check the profiles table structure:
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

#### Check RLS policies on profiles table:
```sql
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
WHERE tablename = 'profiles';
```

## Common Issues and Solutions

### Issue 1: RLS Policy Blocking Trigger

**Problem**: The trigger runs as the `service_role` or `authenticator`, but RLS policies block the INSERT.

**Solution**: Create a policy that allows service role to insert:

```sql
-- Allow service role to insert profiles (for triggers)
CREATE POLICY "Allow service role to create profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);
```

Or, if using a function, make it SECURITY DEFINER:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the function creator's privileges
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, level, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'Beginner',
    NOW()
  );
  RETURN NEW;
END;
$$;
```

### Issue 2: Missing Required Fields

**Problem**: The trigger tries to INSERT without required fields (like `email` or `level`).

**Solution**: Ensure the trigger includes all required fields:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    level,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NULL), -- Handle NULL email
    'Beginner', -- Default level
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate errors
  RETURN NEW;
END;
$$;
```

### Issue 3: Trigger Firing Multiple Times

**Problem**: Trigger might be firing on UPDATE as well as INSERT.

**Solution**: Ensure trigger only fires on INSERT:

```sql
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that only fires on INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Recommended Trigger Setup

Here's a complete, safe trigger setup:

### 1. Create the function:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    -- Log the error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
```

### 2. Create the trigger:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 3. Ensure RLS allows the operation:

```sql
-- Check if you need this policy (depends on your RLS setup)
-- If your profiles table has RLS enabled, you might need:

CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Or disable RLS for inserts from triggers:
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- (Not recommended for production, but useful for debugging)
```

## Alternative: Disable Trigger and Use Application Code

If you prefer to handle profile creation in your application code (which you're already doing in `app/auth/callback/page.tsx`), you can:

1. **Disable or remove the trigger**:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

2. **Let your application code handle it** (which it already does in the callback page)

## Testing

After fixing the trigger:

1. Try signing in with Google again
2. Check the Supabase logs for any errors
3. Verify the profile was created:
```sql
SELECT * FROM public.profiles ORDER BY updated_at DESC LIMIT 5;
```

## Next Steps

1. Check your Supabase dashboard for existing triggers
2. Review the trigger function code
3. Check RLS policies on the `profiles` table
4. Fix the trigger based on the issues found
5. Test the sign-in flow again

If you need help with a specific error message from the logs, share it and we can troubleshoot further!
