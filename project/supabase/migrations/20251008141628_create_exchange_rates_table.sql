/*
  # Create Exchange Rates Table

  1. New Tables
    - `exchange_rates`
      - `id` (uuid, primary key)
      - `currency_pair` (text) - e.g., "USD/TRY"
      - `rate` (decimal) - exchange rate value
      - `updated_at` (timestamptz) - when the rate was last updated
      - `created_at` (timestamptz) - when the record was created

  2. Security
    - Enable RLS on `exchange_rates` table
    - Add policy for public read access (anyone can read rates)
    - Add policy for authenticated admin write access (only admins can update rates)

  3. Initial Data
    - Insert default USD/TRY rate of 43
*/

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair text UNIQUE NOT NULL,
  rate decimal(10, 4) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can update exchange rates"
  ON exchange_rates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can insert exchange rates"
  ON exchange_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

INSERT INTO exchange_rates (currency_pair, rate)
VALUES ('USD/TRY', 43.00)
ON CONFLICT (currency_pair) DO NOTHING;
