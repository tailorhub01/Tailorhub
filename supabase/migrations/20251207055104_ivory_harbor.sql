/*
  # Create home service requests table

  1. New Tables
    - `home_service_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key, nullable)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `customer_email` (text, nullable)
      - `address` (text)
      - `landmark` (text)
      - `preferred_date` (date)
      - `preferred_time` (text)
      - `service_type` (text)
      - `details` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on table
    - Add policies for user access and public creation
*/

-- Create home_service_requests table
CREATE TABLE IF NOT EXISTS home_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address text NOT NULL,
  landmark text DEFAULT '',
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  service_type text DEFAULT 'Consultation' CHECK (service_type IN ('Alterations', 'New Stitching', 'Consultation')),
  details text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE home_service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger for updated_at
CREATE TRIGGER update_home_service_requests_updated_at
  BEFORE UPDATE ON home_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample home service requests for testing
INSERT INTO home_service_requests (
  customer_name, 
  customer_phone, 
  customer_email, 
  address, 
  landmark, 
  preferred_date, 
  preferred_time, 
  service_type, 
  details
) VALUES 
(
  'John Doe', 
  '+91-9876543210', 
  'john@example.com', 
  '123 Main Street, Bangalore', 
  'Near City Mall', 
  CURRENT_DATE + INTERVAL '2 days', 
  '2:00 PM - 4:00 PM', 
  'Consultation', 
  'Need consultation for wedding suit'
),
(
  'Priya Sharma', 
  '+91-9876543211', 
  'priya@example.com', 
  '456 Park Avenue, Mumbai', 
  'Opposite Metro Station', 
  CURRENT_DATE + INTERVAL '3 days', 
  '4:00 PM - 6:00 PM', 
  'Alterations', 
  'Saree blouse alterations needed'
);