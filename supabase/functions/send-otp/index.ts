// Supabase Edge Function: Send OTP Email
// Deploy with: supabase functions deploy send-otp

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
  fullName: string;
  phone: string;
  department: string;
  password: string;
}

function generateOTP(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

async function sendEmail(to: string, otp: string, fullName: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("Resend API key not configured, OTP for", to, ":", otp);
    return true;
  }

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
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #000; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
              <span style="color: #00D154; font-size: 40px; font-weight: bold;">U</span>
            </div>
            <h2 style="color: #333; margin-bottom: 10px;">Hello ${fullName},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Thank you for registering with UniGo. Your verification code is:
            </p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #00D154; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in <strong>5 minutes</strong>.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Resend API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, fullName, phone, department, password }: RequestBody = await req.json();

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
        department,
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

    // Send email
    const emailSent = await sendEmail(email, otp, fullName);

    if (!emailSent && RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For development: return OTP in response if Resend not configured
    const response: any = { 
      success: true, 
      message: "OTP sent successfully" 
    };
    
    if (!RESEND_API_KEY) {
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
