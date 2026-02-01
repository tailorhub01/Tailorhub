/*
  # Create admin policies and functions

  1. Admin Policies
    - Admins can view all orders
    - Admins can update order status
    - Admins can view all home service requests
    - Admins can manage products and categories

  2. Functions
    - Function to check if user is admin
    - Function to get order statistics
*/

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for orders
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update order status"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admin policies for order items
CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin policies for home service requests
CREATE POLICY "Admins can view all home service requests"
  ON home_service_requests
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update home service requests"
  ON home_service_requests
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Admin policies for products
CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Admin policies for categories
CREATE POLICY "Admins can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Admin policies for service types
CREATE POLICY "Admins can manage service types"
  ON service_types
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Create function to get order statistics
CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_orders', COUNT(*),
    'pending_orders', COUNT(*) FILTER (WHERE status = 'pending'),
    'completed_orders', COUNT(*) FILTER (WHERE status = 'completed'),
    'total_revenue', COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0),
    'average_order_value', COALESCE(AVG(total_amount), 0)
  ) INTO result
  FROM orders;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get popular products
CREATE OR REPLACE FUNCTION get_popular_products(limit_count integer DEFAULT 10)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  total_quantity bigint,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.product_id,
    oi.product_name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY oi.product_id, oi.product_name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for order summary
CREATE OR REPLACE VIEW order_summary AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.total_amount,
  o.customer_name,
  o.customer_phone,
  o.created_at,
  COUNT(oi.id) as item_count,
  p.full_name as user_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN profiles p ON o.user_id = p.id
GROUP BY o.id, o.order_number, o.status, o.total_amount, o.customer_name, o.customer_phone, o.created_at, p.full_name;

-- Grant access to the view
GRANT SELECT ON order_summary TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view own order summary"
  ON order_summary
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM orders WHERE id = order_summary.id
    ) OR is_admin()
  );