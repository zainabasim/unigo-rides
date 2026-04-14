# UniGo OTP System Setup Guide

This document explains how to set up the production-ready OTP verification system for UniGo.

## Overview

The OTP system consists of:
1. **Database Schema** - Stores OTPs with expiration and rate limiting
2. **Edge Functions** - Handles sending emails and verifying OTPs
3. **Frontend Integration** - Register.tsx calls the Edge Functions

## Setup Steps

### 1. Apply Database Migration

Run the SQL in `supabase/migrations/20240414100000_add_otp_system.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of the migration file
3. Click "Run"

This creates:
- `registration_otps` table with expiration
- Rate limiting function (5 OTPs per hour per email)
- RLS policies for security

### 2. Deploy Edge Functions

Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

Login to Supabase:
```bash
supabase login
```

Link your project:
```bash
supabase link --project-ref your-project-ref
```

Deploy the functions:
```bash
supabase functions deploy send-otp
supabase functions deploy verify-otp
```

### 3. Configure Environment Variables

In Supabase Dashboard → Edge Functions → Secrets, add:

1. **RESEND_API_KEY** (for production email sending)
   - Sign up at https://resend.com
   - Get your API key
   - Add as secret: `RESEND_API_KEY = your_api_key`

2. **FROM_EMAIL**
   - Use a domain you own, verified in Resend
   - Example: `onboarding@yourdomain.com`
   - Or use Resend's default: `onboarding@resend.dev`

The functions will automatically use `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase environment.

### 4. Enable Email Sending

Without Resend configured, the system will:
- Log OTP to console (development mode)
- Show OTP in a yellow banner on the verification page
- NOT send actual emails

To enable real emails, complete step 3 above.

## How It Works

### Registration Flow:

1. User fills registration form on `/register`
2. Frontend calls `send-otp` Edge Function
3. Edge Function:
   - Validates email domain (@cloud.neduet.edu.pk)
   - Checks rate limit (max 5 OTPs/hour per email)
   - Generates 5-digit OTP
   - Stores in database with 5-minute expiration
   - Sends email via Resend (or logs to console)
4. User enters OTP on verification screen
5. Frontend calls `verify-otp` Edge Function
6. Edge Function:
   - Checks OTP exists and not expired
   - Verifies code matches
   - Creates user in Supabase Auth
   - Marks OTP as verified

### Security Features:

- **Rate Limiting**: Max 5 OTPs per hour per email
- **Expiration**: OTPs expire after 5 minutes
- **Attempt Limiting**: Max 5 failed verification attempts
- **Auto-cleanup**: Expired/used OTPs cleaned up automatically
- **RLS**: Row Level Security prevents unauthorized access

### Rate Limiting Response:

If rate limit exceeded, user sees:
```
"Too many attempts. Please try again in an hour."
```

### Development Mode:

When `RESEND_API_KEY` is not set:
1. OTP is displayed in browser console
2. OTP is shown in yellow banner on verification page
3. No actual emails are sent

## Testing

1. Go to `/register`
2. Fill in form with valid NEDUET email
3. Click "Get Verification Code"
4. Check console or yellow banner for OTP
5. Enter OTP and click "Verify"
6. User should be created and redirected to login

## Troubleshooting

### "Failed to send OTP"
- Check Supabase Edge Function logs in Dashboard
- Verify database migration was applied
- Check rate limits haven't been exceeded

### "Invalid or expired OTP"
- OTP expires after 5 minutes
- Check if OTP was already used
- Try requesting a new OTP

### Edge Function deployment fails
```bash
# Check if you're linked to the right project
supabase status

# If not linked:
supabase link --project-ref your-project-ref
```

## Production Checklist

- [ ] Applied database migration
- [ ] Deployed `send-otp` and `verify-otp` Edge Functions
- [ ] Configured `RESEND_API_KEY` secret
- [ ] Configured `FROM_EMAIL` secret
- [ ] Verified domain in Resend (if using custom domain)
- [ ] Tested registration flow end-to-end
- [ ] Removed development OTP banner (optional)

## Customization

### Change OTP Expiration

Edit the SQL function or Edge Function:
```typescript
// In send-otp/index.ts
expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
```

### Change Rate Limit

Edit the SQL function:
```sql
RETURN recent_count < 10; -- Allow 10 OTPs per hour
```

### Change Email Template

Edit `send-otp/index.ts` and modify the HTML in the `sendEmail` function.
