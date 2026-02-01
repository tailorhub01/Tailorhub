/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `service_type_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `is_active` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on products table
    - Add policy for public read access to active products
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  service_type_id uuid REFERENCES service_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can view active products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample products
WITH category_service_data AS (
  SELECT 
    c.id as category_id,
    c.name as category_name,
    st.id as service_type_id,
    st.name as service_type_name
  FROM categories c
  JOIN service_types st ON c.id = st.category_id
)
INSERT INTO products (category_id, service_type_id, name, description, price, display_order)
SELECT 
  csd.category_id,
  csd.service_type_id,
  p.name,
  p.description,
  p.price,
  p.display_order
FROM category_service_data csd
CROSS JOIN (
  SELECT * FROM (VALUES
    -- Male Alterations
    ('Pant Alteration', 'Professional pant hemming and fitting adjustments', 150.00, 1),
    ('Jeans Alteration', 'Jeans hemming, waist adjustment, and tapering', 200.00, 2),
    ('Shirt Alteration', 'Shirt fitting, sleeve adjustment, and collar fixes', 180.00, 3),
    
    -- Male New Stitching
    ('Custom Shirt', 'Tailored shirt with premium fabric and perfect fit', 800.00, 1),
    ('Custom Pants', 'Bespoke pants with choice of fabric and style', 1200.00, 2),
    ('Formal Suit', 'Complete formal suit with jacket and pants', 3500.00, 3),
    
    -- Female Alterations
    ('Blouse Alteration', 'Blouse fitting and size adjustments', 200.00, 1),
    ('Saree Blouse', 'Custom saree blouse stitching and fitting', 300.00, 2),
    ('Dress Alteration', 'Dress hemming and fitting adjustments', 250.00, 3),
    
    -- Female New Stitching
    ('Punjabi Dress', 'Traditional Punjabi suit with dupatta', 1500.00, 1),
    ('Designer Dress', 'Custom designer dress for special occasions', 2500.00, 2),
    ('Lehenga', 'Traditional lehenga with intricate work', 4000.00, 3),
    
    -- Children Alterations
    ('Kids Pant Alteration', 'Children pant hemming and adjustments', 100.00, 1),
    ('Kids Shirt Alteration', 'Children shirt fitting and sleeve adjustment', 120.00, 2),
    ('School Uniform Alteration', 'School uniform fitting and adjustments', 150.00, 3),
    
    -- Children New Stitching
    ('Kids Ethnic Wear', 'Traditional ethnic wear for children', 800.00, 1),
    ('Kids Party Dress', 'Designer party dress for children', 1200.00, 2),
    ('Kids Formal Wear', 'Formal wear for special occasions', 1000.00, 3)
  ) AS p(name, description, price, display_order)
) p
WHERE 
  (csd.category_name = 'Male' AND csd.service_type_name = 'Alterations' AND p.name LIKE '%Alteration' AND p.name NOT LIKE 'Kids%') OR
  (csd.category_name = 'Male' AND csd.service_type_name = 'New Stitching' AND p.name IN ('Custom Shirt', 'Custom Pants', 'Formal Suit')) OR
  (csd.category_name = 'Female' AND csd.service_type_name = 'Alterations' AND p.name IN ('Blouse Alteration', 'Saree Blouse', 'Dress Alteration')) OR
  (csd.category_name = 'Female' AND csd.service_type_name = 'New Stitching' AND p.name IN ('Punjabi Dress', 'Designer Dress', 'Lehenga')) OR
  (csd.category_name = 'Children' AND csd.service_type_name = 'Alterations' AND p.name LIKE 'Kids%Alteration' OR p.name = 'School Uniform Alteration') OR
  (csd.category_name = 'Children' AND csd.service_type_name = 'New Stitching' AND p.name LIKE 'Kids%' AND p.name NOT LIKE '%Alteration');