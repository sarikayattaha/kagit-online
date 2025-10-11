/*
  # Update Products Table for Currency and Category Support

  1. Changes to Tables
    - Add `currency` column to products table (USD or EUR)
    - Add `category_id` column to link products to categories
    - Add foreign key constraint to product_categories table
    - Set default currency to USD for existing products
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
    - Ensure foreign key constraints work with RLS

  3. Notes
    - Existing products will default to USD currency
    - Category is optional (can be null) for backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'currency'
  ) THEN
    ALTER TABLE products ADD COLUMN currency text DEFAULT 'USD';
    ALTER TABLE products ADD CONSTRAINT valid_product_currency CHECK (currency IN ('USD', 'EUR'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_currency ON products(currency);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);