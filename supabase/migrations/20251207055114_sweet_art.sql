/*
  # Insert sample data for testing

  1. Sample Data
    - Additional products for better variety
    - Sample cart items (will be created when users add items)
    - Sample orders for demonstration

  2. Notes
    - This migration adds more realistic sample data
    - Prices are in Indian Rupees
    - Products cover all categories and service types
*/

-- Insert additional sample products for better variety
INSERT INTO products (category_id, service_type_id, name, description, price, display_order)
SELECT 
  c.id,
  st.id,
  p.name,
  p.description,
  p.price,
  p.display_order + 10 -- Offset to avoid conflicts
FROM categories c
JOIN service_types st ON c.id = st.category_id
CROSS JOIN (
  SELECT * FROM (VALUES
    -- Additional Male Products
    ('Kurta Alteration', 'Traditional kurta fitting and length adjustment', 180.00, 4),
    ('Blazer Alteration', 'Professional blazer fitting and sleeve adjustment', 350.00, 5),
    ('Wedding Sherwani', 'Luxury wedding sherwani with intricate embroidery', 5000.00, 4),
    ('Casual Shirt', 'Comfortable casual shirt with modern fit', 600.00, 5),
    
    -- Additional Female Products
    ('Kurti Alteration', 'Kurti fitting and length adjustment', 150.00, 4),
    ('Gown Alteration', 'Evening gown fitting and hemming', 400.00, 5),
    ('Anarkali Suit', 'Traditional Anarkali suit with dupatta', 2000.00, 4),
    ('Saree Draping Service', 'Professional saree draping for events', 500.00, 5),
    
    -- Additional Children Products
    ('Kids Kurta', 'Traditional kurta for children', 600.00, 4),
    ('Kids Lehenga', 'Designer lehenga for special occasions', 1500.00, 5)
  ) AS p(name, description, price, display_order)
) p
WHERE 
  (c.name = 'Male' AND st.name = 'Alterations' AND p.name IN ('Kurta Alteration', 'Blazer Alteration')) OR
  (c.name = 'Male' AND st.name = 'New Stitching' AND p.name IN ('Wedding Sherwani', 'Casual Shirt')) OR
  (c.name = 'Female' AND st.name = 'Alterations' AND p.name IN ('Kurti Alteration', 'Gown Alteration')) OR
  (c.name = 'Female' AND st.name = 'New Stitching' AND p.name IN ('Anarkali Suit', 'Saree Draping Service')) OR
  (c.name = 'Children' AND st.name = 'New Stitching' AND p.name IN ('Kids Kurta', 'Kids Lehenga'));

-- Create a sample admin user profile (this will be created when a user signs up)
-- The trigger will handle profile creation automatically

-- Insert sample orders for demonstration (without user_id for now)
INSERT INTO orders (order_number, status, total_amount, customer_name, customer_phone, customer_address, notes)
VALUES 
(
  'TH' || EXTRACT(EPOCH FROM NOW())::bigint,
  'completed',
  650.00,
  'Sample Customer',
  '+91-9876543210',
  '123 Sample Street, Bangalore, Karnataka',
  'Sample completed order for demonstration'
),
(
  'TH' || (EXTRACT(EPOCH FROM NOW())::bigint + 1),
  'in_progress',
  1200.00,
  'Demo User',
  '+91-9876543211',
  '456 Demo Avenue, Mumbai, Maharashtra',
  'Sample in-progress order'
);

-- Insert corresponding order items
WITH sample_orders AS (
  SELECT id, order_number FROM orders WHERE customer_name IN ('Sample Customer', 'Demo User')
),
sample_products AS (
  SELECT id, name, price FROM products LIMIT 5
)
INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal)
SELECT 
  so.id,
  sp.id,
  sp.name,
  CASE WHEN so.order_number LIKE '%0' THEN 1 ELSE 2 END, -- Vary quantities
  sp.price,
  sp.price * CASE WHEN so.order_number LIKE '%0' THEN 1 ELSE 2 END
FROM sample_orders so
CROSS JOIN sample_products sp
LIMIT 6; -- 3 items per order

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_service ON products(category_id, service_type_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_home_service_requests_user ON home_service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_home_service_requests_status ON home_service_requests(status);