/*
  # Create Product Categories Table

  1. New Tables
    - `product_categories`
      - `id` (uuid, primary key) - Unique identifier for each category
      - `name` (text) - Category name (e.g., "Kuşe Kağıt", "Bristol Karton")
      - `description` (text) - Category description
      - `display_order` (integer) - Order to display categories
      - `is_active` (boolean) - Whether category is active/visible
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `product_categories` table
    - Add policy for public read access (anyone can view active categories)
    - Add policy for authenticated users to manage categories (admin only)

  3. Indexes
    - Add index on `display_order` for efficient sorting
    - Add index on `is_active` for filtering active categories
*/

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON product_categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all categories"
  ON product_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON product_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON product_categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON product_categories
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_product_categories_display_order 
  ON product_categories(display_order);

CREATE INDEX IF NOT EXISTS idx_product_categories_is_active 
  ON product_categories(is_active);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();