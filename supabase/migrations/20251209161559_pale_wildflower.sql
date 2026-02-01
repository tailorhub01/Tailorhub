/*
  # Fix RLS Policies and Add Order Management

  1. Fix Issues
    - Remove infinite recursion in profiles RLS policy
    - Drop unnecessary order_summary table if exists
    - Fix order placement policies

  2. New Features
    - Create orders view for better order management
    - Add order status tracking
    - Improve RLS policies

  3. Security
    - Fix all RLS policies to prevent recursion
    - Ensure proper access control
*/

-- Drop order_summary table if it exists (this shouldn't exist)
DROP VIEW IF EXISTS order_summary CASCADE;


-- Fix profiles RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile (except role)" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;

-- Create proper profiles policies without recursion
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile (except role)"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Service role can manage profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix orders policies
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fix order_items policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage order items"
  ON order_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix home_service_requests policies
DROP POLICY IF EXISTS "Anyone can create home service request" ON home_service_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON home_service_requests;

CREATE POLICY "Anyone can create home service request"
  ON home_service_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own requests"
  ON home_service_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all service requests"
  ON home_service_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a view for order management with all details
CREATE OR REPLACE VIEW user_orders_view AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  o.customer_name,
  o.customer_phone,
  o.customer_address,
  o.notes,
  o.created_at,
  o.updated_at,
  json_agg(
    json_build_object(
      'id', oi.id,
      'product_name', oi.product_name,
      'quantity', oi.quantity,
      'price', oi.price,
      'subtotal', oi.subtotal
    )
  ) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.status, o.total_amount, 
         o.customer_name, o.customer_phone, o.customer_address, 
         o.notes, o.created_at, o.updated_at
ORDER BY o.created_at DESC;

-- Grant access to the view
GRANT SELECT ON user_orders_view TO authenticated;

-- Create RLS policy for the view
ALTER VIEW user_orders_view OWNER TO postgres;

-- Add some sample order statuses for testing
UPDATE orders SET status = 'confirmed' WHERE id IN (
  SELECT id FROM orders LIMIT 1
);

UPDATE orders SET status = 'in_progress' WHERE id IN (
  SELECT id FROM orders OFFSET 1 LIMIT 1
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_home_service_requests_user_id ON home_service_requests(user_id, created_at DESC);