/*
  # Create categories and service types

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `display_order` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)
    
    - `service_types`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `name` (text)
      - `slug` (text)
      - `display_order` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access to active items
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create service_types table
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view active categories"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Create policies for service_types
CREATE POLICY "Anyone can view active service types"
  ON service_types
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Insert categories
INSERT INTO categories (name, slug, display_order) VALUES
  ('Male', 'male', 1),
  ('Female', 'female', 2),
  ('Children', 'children', 3);

-- Insert service types
INSERT INTO service_types (category_id, name, slug, display_order)
SELECT 
  c.id,
  st.name,
  st.slug,
  st.display_order
FROM categories c
CROSS JOIN (
  VALUES 
    ('Alterations', 'alterations', 1),
    ('New Stitching', 'new-stitching', 2)
) AS st(name, slug, display_order);