-- Add short booking number for easy reference
-- Format: HLP-YYMM0001 (e.g., HLP-24120001)

-- Add booking_number column
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS booking_number VARCHAR(15) UNIQUE;

-- Create sequence table to track monthly sequences
CREATE TABLE IF NOT EXISTS booking_number_sequences (
  year_month VARCHAR(4) PRIMARY KEY, -- e.g., '2412' for Dec 2024
  last_sequence INTEGER DEFAULT 0
);

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month VARCHAR(4);
  next_seq INTEGER;
  new_booking_number VARCHAR(15);
BEGIN
  -- Get current year and month (YYMM format)
  year_month := TO_CHAR(NOW(), 'YYMM');
  
  -- Get and increment sequence (with locking to prevent race conditions)
  INSERT INTO booking_number_sequences (year_month, last_sequence)
  VALUES (year_month, 1)
  ON CONFLICT (year_month) 
  DO UPDATE SET last_sequence = booking_number_sequences.last_sequence + 1
  RETURNING last_sequence INTO next_seq;
  
  -- Generate booking number: HLP-YYMM0001
  new_booking_number := 'HLP-' || year_month || LPAD(next_seq::TEXT, 4, '0');
  
  -- Set the booking number
  NEW.booking_number := new_booking_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate booking number on insert
DROP TRIGGER IF EXISTS set_booking_number ON service_requests;
CREATE TRIGGER set_booking_number
  BEFORE INSERT ON service_requests
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL)
  EXECUTE FUNCTION generate_booking_number();

-- Generate booking numbers for existing records that don't have one
DO $$
DECLARE
  rec RECORD;
  year_month VARCHAR(4);
  next_seq INTEGER;
  new_booking_number VARCHAR(15);
BEGIN
  FOR rec IN 
    SELECT id, created_at 
    FROM service_requests 
    WHERE booking_number IS NULL 
    ORDER BY created_at ASC
  LOOP
    year_month := TO_CHAR(rec.created_at, 'YYMM');
    
    INSERT INTO booking_number_sequences (year_month, last_sequence)
    VALUES (year_month, 1)
    ON CONFLICT (year_month) 
    DO UPDATE SET last_sequence = booking_number_sequences.last_sequence + 1
    RETURNING last_sequence INTO next_seq;
    
    new_booking_number := 'HLP-' || year_month || LPAD(next_seq::TEXT, 4, '0');
    
    UPDATE service_requests 
    SET booking_number = new_booking_number 
    WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_requests_booking_number 
ON service_requests(booking_number);

-- Add RLS policy for booking_number_sequences (admin only)
ALTER TABLE booking_number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow system to manage sequences"
ON booking_number_sequences
FOR ALL
USING (true)
WITH CHECK (true);
