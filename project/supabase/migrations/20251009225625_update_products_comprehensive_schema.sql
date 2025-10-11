/*
  # Comprehensive Products Table Update

  1. Changes to Products Table
    - Add `description` (text) - Product description
    - Add `image_url` (text) - Product image URL
    - Add `specifications` (jsonb) - Product specifications as JSON
    - Add `min_order_quantity` (integer) - Minimum order quantity
    - Add `available_sizes` (text[]) - Array of available sizes
    - Add `is_active` (boolean) - Whether product is active
    - Ensure `currency` and `category_id` exist (already added in previous migration)
    - Add `display_order` for sorting

  2. Security
    - Maintain existing RLS policies
    - Public can view active products
    - Authenticated users (admins) can manage all products

  3. Notes
    - All new fields have sensible defaults
    - Specifications stored as JSONB for flexibility
    - Available sizes stored as array for easy querying
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'description'
  ) THEN
    ALTER TABLE products ADD COLUMN description text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'specifications'
  ) THEN
    ALTER TABLE products ADD COLUMN specifications jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'min_order_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN min_order_quantity integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'available_sizes'
  ) THEN
    ALTER TABLE products ADD COLUMN available_sizes text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE products ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);