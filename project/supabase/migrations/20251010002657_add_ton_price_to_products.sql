/*
  # Add Ton Price to Products

  1. Schema Changes
    - Add `ton_price` column to products table
    - This will be used in price calculation formulas

  2. Notes
    - Ton price is the price per ton (1000 kg) of the product
    - Used in formula calculations
    - Admin can set via CSV upload or manual entry
*/

-- Add ton_price column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'ton_price'
  ) THEN
    ALTER TABLE products ADD COLUMN ton_price numeric DEFAULT 0;
  END IF;
END $$;