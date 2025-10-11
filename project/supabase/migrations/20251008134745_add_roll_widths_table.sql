/*
  # Bobin Genişlikleri Tablosu Ekleme

  ## Yeni Tablolar
  
  ### 1. roll_widths (Bobin Genişlikleri)
  - `id` (uuid, primary key) - Bobin benzersiz kimliği
  - `width` (integer) - Bobin genişliği (cm)
  - `active` (boolean) - Aktif durumu
  - `created_at` (timestamptz) - Oluşturulma zamanı
  
  ## Güvenlik
  - Tablo için RLS aktif
  - Herkes okuyabilir (public read)
  - Sadece admin ekleyip düzenleyebilir (gelecekte auth eklendiğinde)
  
  ## Notlar
  - Bobinler 50cm'den başlar ve 5'er cm artarak gider
  - Admin panelinden yeni bobin genişlikleri eklenebilir
  - Varsayılan olarak 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100 cm bobinler eklenir
*/

-- Create roll_widths table
CREATE TABLE IF NOT EXISTS roll_widths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  width integer NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roll_widths ENABLE ROW LEVEL SECURITY;

-- RLS policies for roll_widths (public read)
CREATE POLICY "Anyone can view active roll widths"
  ON roll_widths FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "Anyone can insert roll widths"
  ON roll_widths FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update roll widths"
  ON roll_widths FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete roll widths"
  ON roll_widths FOR DELETE
  TO anon
  USING (true);

-- Insert default roll widths (50cm to 100cm, increments of 5)
INSERT INTO roll_widths (width, active) 
VALUES 
  (50, true),
  (55, true),
  (60, true),
  (65, true),
  (70, true),
  (75, true),
  (80, true),
  (85, true),
  (90, true),
  (95, true),
  (100, true)
ON CONFLICT (width) DO NOTHING;