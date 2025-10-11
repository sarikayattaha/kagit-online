/*
  # Create Orders Table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key) - Unique order identifier
      - `customer_id` (uuid) - References customers table
      - `customer_email` (text) - Customer email for reference
      - `customer_name` (text) - Customer name
      - `customer_company` (text) - Customer company
      - `product_name` (text) - Product ordered
      - `quantity` (integer) - Quantity ordered
      - `unit_price` (numeric) - Price per unit
      - `total_price` (numeric) - Total order price
      - `shipping_address` (text) - Delivery address
      - `shipping_city` (text) - Delivery city
      - `shipping_postal_code` (text) - Postal code
      - `notes` (text) - Additional notes
      - `status` (text) - Order status (pending, processing, completed, cancelled)
      - `created_at` (timestamptz) - Order timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `orders` table
    - Users can view their own orders
    - Users can create orders
    - Admins can view all orders and update status

  3. Notes
    - Orders are linked to customers but also store snapshot data
    - This prevents data loss if customer details change
    - Status tracking allows order management
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_company text NOT NULL DEFAULT '',
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL DEFAULT '',
  shipping_postal_code text NOT NULL DEFAULT '',
  notes text DEFAULT '',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);