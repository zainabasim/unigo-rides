-- OTP System for UniGo Registration
-- Run this in Supabase SQL Editor

-- 1. Create OTP table for storing verification codes
CREATE TABLE IF NOT EXISTS registration_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- Temporary storage, deleted after verification
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  
  -- Index for faster lookups
  CONSTRAINT idx_email UNIQUE (email)
);

-- 2. Add RLS policies
ALTER TABLE registration_otps ENABLE ROW LEVEL SECURITY;

-- Allow service role to read/write
CREATE POLICY "Service can manage OTPs" 
  ON registration_otps 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Allow authenticated users to read their own OTP (for verification)
CREATE POLICY "Users can read own OTP" 
  ON registration_otps 
  FOR SELECT 
  TO authenticated 
  USING (email = auth.email());

-- 3. Create function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM registration_otps 
  WHERE expires_at < now() 
     OR (verified = true AND created_at < now() - interval '1 hour');
END;
$$ LANGUAGE plpgsql;

-- 4. Create scheduled job to clean up expired OTPs (runs every 15 minutes)
-- Note: Enable pg_cron extension in Supabase first
-- SELECT cron.schedule('cleanup-otps', '*/15 * * * *', 'SELECT cleanup_expired_otps()');

-- 5. Create rate limiting function
CREATE OR REPLACE FUNCTION check_otp_rate_limit(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check how many OTPs sent in last hour
  SELECT COUNT(*) INTO recent_count
  FROM registration_otps
  WHERE email = p_email
    AND created_at > now() - interval '1 hour';
  
  -- Limit to 5 OTPs per hour per email
  RETURN recent_count < 5;
END;
$$ LANGUAGE plpgsql;

-- 6. Add index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_registration_otps_email_created 
  ON registration_otps(email, created_at);
