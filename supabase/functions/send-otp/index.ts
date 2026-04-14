// Supabase Edge Function: Send OTP Email
// Deploy with: supabase functions deploy send-otp
// Supports: Resend API OR Gmail SMTP

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";

// Gmail SMTP credentials (alternative to Resend)
const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  fullName: string;
  phone: string;
  department?: string;
  password: string;
}

function generateOTP(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

const EMAIL_HTML_TEMPLATE = (otp: string, fullName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UniGo Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: #000; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
    <span style="color: #00D154; font-size: 48px; font-weight: bold;">U</span>
    <p style="color: #fff; margin: 10px 0 0 0; font-size: 20px;">UniGo</p>
  </div>
  
  <div style="background: #fff; padding: 30px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-bottom: 20px;">Hello ${fullName},</h2>
    
    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
      Thank you for registering with <strong>UniGo</strong> - NEDUET Faculty Commute Network. 
      Your verification code is:
    </p>
    
    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; border: 2px dashed #00D154;">
      <span style="font-size: 42px; font-weight: bold; color: #00D154; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otp}</span>
    </div>
    
    <p style="color: #666; font-size: 14px; text-align: center; margin: 20px 0;">
      ⏰ This code will expire in <strong style="color: #dc3545;">5 minutes</strong>
    </p>
    
    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 25px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      If you didn't request this code, please ignore this email.<br>
      For support, contact the UniGo team at NEDUET.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 15px;">
    <p style="color: #999; font-size: 11px; margin: 0;">
      © 2024 UniGo | NED University of Engineering & Technology
    </p>
  </div>
</body>
</html>
`;

// Send email via Resend API
async function sendViaResend(to: string, otp: string, fullName: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `UniGo <${FROM_EMAIL}>`,
        to: [to],
        subject: "Your UniGo Verification Code",
        html: EMAIL_HTML_TEMPLATE(otp, fullName),
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Resend failed:", error);
    return false;
  }
}

// Send email via Gmail SMTP
async function sendViaGmail(to: string, otp: string, fullName: string): Promise<boolean> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return false;
  
  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    });

    await client.send({
      from: `UniGo NED <${GMAIL_USER}>`,
      to: to,
      subject: "Your UniGo Verification Code",
      html: EMAIL_HTML_TEMPLATE(otp, fullName),
    });

    await client.close();
    return true;
  } catch (error) {
    console.error("Gmail SMTP failed:", error);
    return false;
  }
}

async function sendEmail(to: string, otp: string, fullName: string): Promise<boolean> {
  // Try Resend first
  if (RESEND_API_KEY) {
    const resendSuccess = await sendViaResend(to, otp, fullName);
    if (resendSuccess) return true;
  }
  
  // Fallback to Gmail SMTP
  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    const gmailSuccess = await sendViaGmail(to, otp, fullName);
    if (gmailSuccess) return true;
  }
  
  // Development mode - just log
  console.log("📧 OTP Email (dev mode):");
  console.log(`   To: ${to}`);
  console.log(`   OTP: ${otp}`);
  console.log(`   Full Name: ${fullName}`);
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, fullName, phone, department, password }: RequestBody = await req.json();
    
    // Department is optional now

    // Validate email domain
    if (!email.endsWith("@cloud.neduet.edu.pk") && !email.endsWith("@neduet.edu.pk")) {
      return new Response(
        JSON.stringify({ error: "Only NEDUET emails are allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check rate limit
    const { data: rateLimitOk, error: rateError } = await supabaseClient.rpc(
      "check_otp_rate_limit",
      { p_email: email }
    );

    if (rateError || !rateLimitOk) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please try again in an hour." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Hash password temporarily (will be deleted after verification)
    // Note: In production, you might want to use a proper hashing library
    const passwordHash = btoa(password); // Simple base64 for demo, use bcrypt in production

    // Store OTP in database
    const { error: dbError } = await supabaseClient
      .from("registration_otps")
      .upsert({
        email,
        otp,
        full_name: fullName,
        phone,
        department: department || null,
        password_hash: passwordHash,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        verified: false,
        attempts: 0,
      }, { onConflict: "email" });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to store OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email (use email for full name if not provided)
    const emailSent = await sendEmail(email, otp, fullName || email.split('@')[0]);

    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For development: return OTP if no email service configured
    const response: any = { 
      success: true, 
      message: "OTP sent successfully" 
    };
    
    // Only show OTP in dev mode if no email service is configured
    if (!RESEND_API_KEY && !GMAIL_USER) {
      response.devOtp = otp; // Only for development!
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
