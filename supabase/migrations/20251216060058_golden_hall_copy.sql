UPDATE profiles
SET role = 'customer'
WHERE role = 'user';



/*
  # Add product images and extend user roles

  1. Changes
    - Add image_url column to products table
    - Update profiles role constraint to include new roles
    - Add sample product images
    - Create views for role-based data access

  2. Security
    - Update RLS policies for new roles
    - Add role-specific access controls
*/

-- Add image_url column to products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;
END $$;

-- Update profiles table role constraint to include new roles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (
    role = ANY (
      ARRAY['customer'::text, 'admin'::text, 'warehouse'::text, 'hometailor'::text]
    )
  );

-- Update sample products with placeholder images
UPDATE products SET image_url = 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE category_id IN (SELECT id FROM categories WHERE name = 'Male') AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE category_id IN (SELECT id FROM categories WHERE name = 'Female') AND image_url IS NULL;

UPDATE products SET image_url = 'https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE category_id IN (SELECT id FROM categories WHERE name = 'Children') AND image_url IS NULL;

-- Create warehouse management policies
CREATE POLICY "Warehouse can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('warehouse', 'admin')
    )
  );

-- Create home tailor policies for service requests
CREATE POLICY "Home tailors can view assigned requests"
  ON home_service_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'hometailor'
    )
  );

CREATE POLICY "Home tailors can update assigned requests"
  ON home_service_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'hometailor'
    )
  );

-- Create admin policies for user management
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create view for warehouse dashboard
CREATE OR REPLACE VIEW warehouse_stats AS
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_active = true) as active_products,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_products,
  COUNT(DISTINCT category_id) as total_categories
FROM products;

-- Grant access to warehouse stats
GRANT SELECT ON warehouse_stats TO authenticated;

-- Create view for admin dashboard
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer') as total_customers,
  (SELECT COUNT(*) FROM profiles WHERE role = 'warehouse') as total_warehouse_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'hometailor') as total_tailors,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM home_service_requests) as total_service_requests,
  (SELECT COUNT(*) FROM products) as total_products;

-- Grant access to admin stats
GRANT SELECT ON admin_stats TO authenticated;