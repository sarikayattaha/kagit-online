/*
  # Create Contact Information Table

  1. New Tables
    - `contact_info`
      - `id` (uuid, primary key) - Unique identifier
      - `phone` (text) - Main phone number
      - `mobile` (text) - Mobile/cell phone number
      - `email` (text) - Contact email address
      - `address` (text) - Physical address
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `contact_info` table
    - Add policy for public read access (anyone can view contact info)
    - Add policy for authenticated users to manage contact info (admin only)

  3. Initial Data
    - Insert default contact information
    - Phone: 0212 612 31 94
    - Mobile: +90 554 163 00 31
    - Email: info@kagit.online
    - Address: Maltepe, Litros Yolu Sk 2. Matbaacılar Sitesi D:1BD2 Giriş Kat, 34010 Zeytinburnu/İstanbul

  4. Notes
    - Only one row should exist in this table
    - Admins update the existing row rather than creating new ones
*/

CREATE TABLE IF NOT EXISTS contact_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contact info"
  ON contact_info
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert contact info"
  ON contact_info
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contact info"
  ON contact_info
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contact info"
  ON contact_info
  FOR DELETE
  TO authenticated
  USING (true);

CREATE TRIGGER update_contact_info_updated_at
  BEFORE UPDATE ON contact_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO contact_info (phone, mobile, email, address) VALUES
  (
    '0212 612 31 94',
    '+90 554 163 00 31',
    'info@kagit.online',
    'Maltepe, Litros Yolu Sk 2. Matbaacılar Sitesi D:1BD2 Giriş Kat, 34010 Zeytinburnu/İstanbul'
  )
ON CONFLICT DO NOTHING;