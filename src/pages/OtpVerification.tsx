import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import unigoIcon from "@/assets/unigo-icon.png";
import unigoLogo from "@/assets/unigo-logo.png";
import nedLogo from "@/assets/ned-logo.png";

const OtpVerification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const { email, password, fullName, department, designation } = location.state || {};

  useEffect(() => {
    if (session) navigate("/home", { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "signup"
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        // Save user profile data to profiles table
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            user_id: authData.user.id,
            full_name: fullName,
            department: department
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          console.error("Profile save error:", profileError);
          setError("Account verified but profile save failed. Please contact support.");
        } else {
          navigate("/home", { replace: true });
        }
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;

    setResendLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: fullName,
            department: department,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setTimeLeft(60);
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <img src={unigoIcon} alt="UniGo" className="w-16 h-16 object-contain" />
        <span className="text-sm text-muted-foreground">Verify Email</span>
        <img src={nedLogo} alt="NED University" className="w-24 h-24 object-contain" />
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mt-12 mb-12 px-8">
        <img src={unigoIcon} alt="UniGo" className="w-80 h-80 object-contain mb-6" />
        <img src={unigoLogo} alt="UniGo" className="h-32 object-contain" />
        <p className="text-muted-foreground text-sm mt-4">NED Faculty Commute Network</p>
      </div>

      {/* OTP Form */}
      <div className="px-6 flex-1 flex flex-col">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h2>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to<br />
            <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-semibold border-2 border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-center mb-4 text-destructive">{error}</p>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all transform active:scale-95 disabled:opacity-50 mb-4"
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resendLoading || timeLeft > 0}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {timeLeft > 0 
              ? `Resend code in ${timeLeft}s` 
              : resendLoading 
                ? "Sending..." 
                : "Didn't receive the code? Resend"
            }
          </button>
        </div>

        {/* Footer */}
        <div className="flex-1" />
        <div className="flex flex-col items-center pb-8 mt-8">
          <img src={nedLogo} alt="NED University" className="w-32 h-32 object-contain mb-2" />
          <p className="text-xs text-muted-foreground">Developed by Zainab Asim | NEDUET</p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;
