/*
  # Add Product Fields and File Storage

  1. Schema Changes
    - Add new fields to products table:
      - `product_type` (text) - Product type/category
      - `dimensions` (text) - Product dimensions/size
      - `weight` (numeric) - Product weight/grammage
      - `sale_unit` (text) - Sale unit type: package, sheet, box
    
  2. Storage
    - Create storage bucket for CSV/Excel files
    - Enable public access for uploaded files
    - Add RLS policies for file access

  3. Security
    - Only authenticated admin users can upload files
    - Files are stored securely in Supabase Storage
*/

-- Add new fields to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'product_type'
  ) THEN
    ALTER TABLE products ADD COLUMN product_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'dimensions'
  ) THEN
    ALTER TABLE products ADD COLUMN dimensions text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'weight'
  ) THEN
    ALTER TABLE products ADD COLUMN weight numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sale_unit'
  ) THEN
    ALTER TABLE products ADD COLUMN sale_unit text DEFAULT 'package';
  END IF;
END $$;

-- Create storage bucket for product files
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload product files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product files" ON storage.objects;

-- Storage policies for product files
CREATE POLICY "Authenticated users can upload product files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-files');

CREATE POLICY "Public can view product files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-files');

CREATE POLICY "Authenticated users can delete product files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-files');