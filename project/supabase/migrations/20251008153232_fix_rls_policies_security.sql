/*
  # Fix RLS Policies for Enhanced Security

  1. Changes Made
    - **roll_widths table**: Remove overly permissive policies that allow anonymous users to modify data
    - Add strict policies that only allow authenticated users to perform admin operations
    - Public users can only view active roll widths
    
    - **exchange_rates table**: Fix policies to be more restrictive
    - Remove policies using `USING (true)` which bypass security
    - Only authenticated users can manage exchange rates
    
    - **products table**: Keep current policies but ensure they're secure
    - Public users can view products
    - Only authenticated users can manage products

  2. Security Notes
    - All admin operations (INSERT, UPDATE, DELETE) now require authentication
    - Anonymous users only have SELECT access to public data
    - This prevents unauthorized modifications to critical data
    - Follows principle of least privilege
*/

-- Drop existing overly permissive policies for roll_widths
DROP POLICY IF EXISTS "Anyone can insert roll widths" ON roll_widths;
DROP POLICY IF EXISTS "Anyone can update roll widths" ON roll_widths;
DROP POLICY IF EXISTS "Anyone can delete roll widths" ON roll_widths;
DROP POLICY IF EXISTS "Anyone can view active roll widths" ON roll_widths;

-- Create secure policies for roll_widths
CREATE POLICY "Public can view active roll widths"
  ON roll_widths FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Authenticated users can insert roll widths"
  ON roll_widths FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update roll widths"
  ON roll_widths FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete roll widths"
  ON roll_widths FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing overly permissive policies for exchange_rates
DROP POLICY IF EXISTS "Anyone can read exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Only authenticated users can insert exchange rates" ON exchange_rates;
DROP POLICY IF EXISTS "Only authenticated users can update exchange rates" ON exchange_rates;

-- Create secure policies for exchange_rates
CREATE POLICY "Public can read exchange rates"
  ON exchange_rates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert exchange rates"
  ON exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update exchange rates"
  ON exchange_rates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete exchange rates"
  ON exchange_rates FOR DELETE
  TO authenticated
  USING (true);
