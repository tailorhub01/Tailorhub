/*
  # Create user measurements table

  1. New Tables
    - `user_measurements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `category` (text, shirt/pant/other)
      - `gender` (text, male/female)
      - `chest` (numeric, optional)
      - `waist` (numeric, optional)
      - `shoulder` (numeric, optional)
      - `sleeve` (numeric, optional)
      - `length` (numeric, optional)
      - `hip` (numeric, optional)
      - `inseam` (numeric, optional)
      - `notes` (text, optional)
      - `image_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create bucket for measurement images

  3. Security
    - Enable RLS on `user_measurements` table
    - Add policies for authenticated users to manage their own measurements
    - Add storage policies for measurement images
*/

-- Create user_measurements table
CREATE TABLE IF NOT EXISTS user_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('shirt', 'pant', 'other')),
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  chest numeric(5,2),
  waist numeric(5,2),
  shoulder numeric(5,2),
  sleeve numeric(5,2),
  length numeric(5,2),
  hip numeric(5,2),
  inseam numeric(5,2),
  notes text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own measurements"
  ON user_measurements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON user_measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON user_measurements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON user_measurements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for measurement images
INSERT INTO storage.buckets (id, name, public)
VALUES ('measurement-images', 'measurement-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload measurement images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'measurement-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view measurement images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'measurement-images');

CREATE POLICY "Users can update own measurement images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'measurement-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own measurement images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'measurement-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_measurements_user_id ON user_measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_measurements_category ON user_measurements(category);
CREATE INDEX IF NOT EXISTS idx_user_measurements_gender ON user_measurements(gender);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_measurements_updated_at
  BEFORE UPDATE ON user_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_user_measurements_updated_at();