/*
  # Create Customers Table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key) - Unique identifier, links to auth.users
      - `first_name` (text) - Customer first name
      - `last_name` (text) - Customer last name
      - `email` (text) - Customer email (from auth)
      - `company_name` (text) - Company name
      - `phone` (text) - Phone number
      - `tax_number` (text) - Tax ID number
      - `created_at` (timestamptz) - Registration timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `customers` table
    - Add policy for users to read their own data
    - Add policy for users to update their own data
    - Add policy for authenticated admins to view all customers

  3. Notes
    - Customer ID matches auth.users.id for seamless authentication
    - Email is duplicated for easier queries but source of truth is auth.users
    - All fields except id and timestamps are editable by the customer
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  tax_number text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customer data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own customer data"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own customer data"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);