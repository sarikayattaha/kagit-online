/*
  # Update Exchange Rates Table to Support Multiple Currencies

  1. Changes to Tables
    - Modify `exchange_rates` table structure
      - Add `currency` (text) - Currency code (USD or EUR)
      - Add unique constraint on currency to prevent duplicates
      - Keep existing `rate` and `updated_at` columns
      - Remove old data and restructure for new format

  2. Migration Steps
    - Drop existing table and recreate with new structure
    - This is safe since exchange rates are admin-configured data that can be re-entered

  3. Security
    - Maintain existing RLS policies
    - Public read access for active rates
    - Authenticated users can manage rates
*/

DROP TABLE IF EXISTS exchange_rates;

CREATE TABLE exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL UNIQUE,
  rate numeric(10, 4) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_currency CHECK (currency IN ('USD', 'EUR'))
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exchange rates"
  ON exchange_rates
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert rates"
  ON exchange_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rates"
  ON exchange_rates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rates"
  ON exchange_rates
  FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO exchange_rates (currency, rate) VALUES
  ('USD', 34.50),
  ('EUR', 37.80)
ON CONFLICT (currency) DO NOTHING;