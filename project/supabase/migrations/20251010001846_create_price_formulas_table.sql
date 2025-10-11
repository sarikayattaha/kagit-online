/*
  # Create Price Formulas Table

  1. New Tables
    - `price_formulas`
      - `id` (uuid, primary key)
      - `name` (text) - Formula name for admin reference
      - `formula` (text) - The actual formula expression
      - `description` (text) - Optional description of what the formula does
      - `variables` (jsonb) - JSON object defining variables used in formula
      - `is_active` (boolean) - Whether this formula is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Product-Formula Relationship
    - Add `formula_id` column to products table to link each product to a formula
    - Foreign key constraint to price_formulas table

  3. Security
    - Enable RLS on price_formulas table
    - Admin users can manage formulas
    - Public users can read active formulas

  4. Notes
    - Formulas will use exchange rates from exchange_rates table
    - Multiple formulas can exist, but each product uses one formula at a time
    - Admin can switch formulas for products anytime
*/

-- Create price_formulas table
CREATE TABLE IF NOT EXISTS price_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  formula text NOT NULL,
  description text DEFAULT '',
  variables jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add formula_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'formula_id'
  ) THEN
    ALTER TABLE products ADD COLUMN formula_id uuid REFERENCES price_formulas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on price_formulas
ALTER TABLE price_formulas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_formulas
DROP POLICY IF EXISTS "Public can view active formulas" ON price_formulas;
CREATE POLICY "Public can view active formulas"
  ON price_formulas
  FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view all formulas" ON price_formulas;
CREATE POLICY "Authenticated users can view all formulas"
  ON price_formulas
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert formulas" ON price_formulas;
CREATE POLICY "Authenticated users can insert formulas"
  ON price_formulas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update formulas" ON price_formulas;
CREATE POLICY "Authenticated users can update formulas"
  ON price_formulas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete formulas" ON price_formulas;
CREATE POLICY "Authenticated users can delete formulas"
  ON price_formulas
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_formula_id ON products(formula_id);
CREATE INDEX IF NOT EXISTS idx_price_formulas_active ON price_formulas(is_active);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_price_formulas_updated_at ON price_formulas;
CREATE TRIGGER update_price_formulas_updated_at
    BEFORE UPDATE ON price_formulas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();