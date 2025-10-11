/*
  # Update Products for Package-Based Sales

  1. Schema Changes
    - Add `sheets_per_package` column - How many sheets in one package
    - Add `sale_type` column - 'package' or 'individual'
    - Remove unused columns for simpler structure

  2. Notes
    - sheets_per_package: Number of sheets in one package (e.g. 250)
    - sale_type: 'package' for package sales, 'individual' for individual sales
    - min_order_quantity: Minimum number of packages (e.g. 1 package = 250 sheets)
    - Users can only order in multiples of package size
*/

-- Add sheets_per_package column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sheets_per_package'
  ) THEN
    ALTER TABLE products ADD COLUMN sheets_per_package integer DEFAULT 1;
  END IF;
END $$;

-- Add sale_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sale_type'
  ) THEN
    ALTER TABLE products ADD COLUMN sale_type text DEFAULT 'individual';
  END IF;
END $$;

-- Add constraint for sale_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_type_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_sale_type_check 
    CHECK (sale_type IN ('package', 'individual'));
  END IF;
END $$;

COMMENT ON COLUMN products.sheets_per_package IS 'Number of sheets per package (e.g., 250)';
COMMENT ON COLUMN products.sale_type IS 'Sale type: package or individual';
COMMENT ON COLUMN products.min_order_quantity IS 'Minimum number of packages (for package sales) or sheets (for individual sales)';