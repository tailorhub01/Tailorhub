-- =========================================================
-- REVISED AUTH & RLS FIX (syntax-corrected)
-- Run in Supabase SQL editor
-- This version fixes the previous syntax error at RAISE NOTICE.
-- =========================================================

BEGIN;

--------------------------------------------------------------------------------
-- 1) Ensure update_updated_at trigger function exists
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------
-- 2) Robust handle_new_user trigger function (idempotent, avoids UNIQUE errors)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  email_count int;
BEGIN
  -- If a profile already exists for this auth user id, update it
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    UPDATE public.profiles
    SET
      email = COALESCE(NEW.email, public.profiles.email),
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', public.profiles.full_name),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', public.profiles.avatar_url),
      updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- If NEW.email already exists on another profile, skip insert (prevents UNIQUE violation)
  IF NEW.email IS NOT NULL THEN
    SELECT COUNT(*) INTO email_count FROM public.profiles WHERE email = NEW.email;
    IF email_count > 0 THEN
      RAISE NOTICE 'handle_new_user: profile with email % already exists; skipping insert for auth.id %', NEW.email, NEW.id;
      RETURN NEW;
    END IF;
  END IF;

  -- Otherwise insert a new profile record
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    now(),
    now()
  );

  RETURN NEW;

EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'handle_new_user: unique_violation inserting profile for auth.id % email % - ignoring', NEW.id, NEW.email;
  RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 3) Safe & explicit policies for profiles and orders (non-destructive)
--------------------------------------------------------------------------------
-- Profiles: allow auth-trigger inserts (intentionally permissive; tighten later)
DROP POLICY IF EXISTS "Auth can insert profiles" ON public.profiles;
CREATE POLICY "Auth can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated, anon, service_role
  WITH CHECK (true);

-- Profiles: select/update policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile (except role)" ON public.profiles;
CREATE POLICY "Users can update own profile (except role)"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Orders: safe SELECT/INSERT policies so users can create/read own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

--------------------------------------------------------------------------------
-- 4) Conditional handling for order_summary (view vs table) -- syntax-corrected
--------------------------------------------------------------------------------
DO $$
DECLARE
  rel RECORD;
BEGIN
  SELECT c.oid AS oid, c.relkind AS relkind
  INTO rel
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = 'order_summary' AND n.nspname = 'public';

  IF NOT FOUND THEN
    RAISE NOTICE 'object public.order_summary not found; skipping view/table-specific operations';
  ELSE
    IF rel.relkind = 'r' THEN
      -- relkind 'r' = ordinary table: create/drop policy safely
      BEGIN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own order summary" ON public.order_summary';
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Could not drop policy on public.order_summary: %', SQLERRM;
      END;

      -- Create policy for table
      EXECUTE $pol$
        CREATE POLICY "Users can view own order summary"
          ON public.order_summary
          FOR SELECT
          TO authenticated
          USING (
            auth.uid() IN (SELECT user_id FROM public.orders WHERE id = public.order_summary.id)
            OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
          );
      $pol$;

      -- If needed, enable RLS for table
      EXECUTE 'ALTER TABLE public.order_summary ENABLE ROW LEVEL SECURITY';
      EXECUTE 'GRANT SELECT ON public.order_summary TO authenticated';
      RAISE NOTICE 'order_summary is a TABLE: created policy and granted SELECT';
    ELSE
      -- relkind not 'r' (probably 'v' = view). Do not create policy (would error).
      EXECUTE 'GRANT SELECT ON public.order_summary TO authenticated';
      RAISE NOTICE 'order_summary is not a table (relkind=%); granted SELECT and skipped CREATE POLICY', rel.relkind;
    END IF;
  END IF;
END$$;

--------------------------------------------------------------------------------
-- 5) Attach update_updated_at triggers to commonly updated tables (idempotent)
--------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'profiles' AND n.nspname = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
      CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'orders' AND n.nspname = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
      CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'cart_items' AND n.nspname = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cart_items_updated_at') THEN
      CREATE TRIGGER update_cart_items_updated_at
        BEFORE UPDATE ON public.cart_items
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'home_service_requests' AND n.nspname = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_home_service_requests_updated_at') THEN
      CREATE TRIGGER update_home_service_requests_updated_at
        BEFORE UPDATE ON public.home_service_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END$$;

--------------------------------------------------------------------------------
-- 6) Enable RLS only on real tables (skip views)
--------------------------------------------------------------------------------
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('profiles','orders','cart_items','order_items','home_service_requests')
  LOOP
    -- relkind 'v' = view, 'r' = table, 'm' = materialized view, etc.
    IF t.relkind = 'r' THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Could not enable RLS on % - %', t.relname, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Skipping ENABLE RLS on public.% (relkind=%).', t.relname, t.relkind;
    END IF;
  END LOOP;
END$$;

COMMIT;

-- =========================================================
-- End of revised script
-- =========================================================
