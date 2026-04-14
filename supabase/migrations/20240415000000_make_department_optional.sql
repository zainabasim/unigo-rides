-- Make department column optional in registration_otps table
ALTER TABLE registration_otps ALTER COLUMN department DROP NOT NULL;
