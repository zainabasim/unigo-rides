import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANONYMOUS_KEY;

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  
  // OTP
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [devOtp, setDevOtp] = useState<string | null>(null); // For development only

  // Validate email domain
  const validateEmail = (email: string) => {
    return email.endsWith("@cloud.neduet.edu.pk") || email.endsWith("@neduet.edu.pk");
  };

  // Validate Pakistan phone format
  const validatePhone = (phone: string) => {
    const regex = /^03\d{9}$/;
    return regex.test(phone.replace(/-/g, ""));
  };

  // Handle registration step 1 - Call Edge Function
  const handleGetOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error("Only @cloud.neduet.edu.pk or @neduet.edu.pk emails are allowed!");
      return;
    }
    
    if (!validatePhone(phone)) {
      toast.error("Please enter a valid Pakistan phone number (03xxxxxxxxx)");
      return;
    }

    setLoading(true);
    
    try {
      // Call Edge Function to send OTP
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          fullName,
          phone: phone.replace(/-/g, ""),
          department,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send OTP");
        setLoading(false);
        return;
      }

      // For development: show OTP if returned
      if (data.devOtp) {
        setDevOtp(data.devOtp);
        console.log(`Development OTP: ${data.devOtp}`);
      }
      
      toast.success("Verification code sent! Check your email.");
      setStep(2);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 4) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP via Edge Function and complete registration
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 5) {
      toast.error("Please enter all 5 digits");
      return;
    }

    setLoading(true);
    
    try {
      // Call Edge Function to verify OTP
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          otp: enteredOtp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Verification failed");
        setLoading(false);
        return;
      }

      setDevOtp(null);
      toast.success("Registration successful! Please login.");
      navigate("/");
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={() => navigate("/")} className="p-2">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Branding */}
        <div className="bg-black p-6 rounded-2xl mb-4">
          <span className="text-[#00D154] text-5xl font-bold">U</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">UniGo</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          {step === 1 ? "Create your account" : "Verify your email"}
        </p>

        {step === 1 ? (
          <form onSubmit={handleGetOTP} className="w-full max-w-sm space-y-4">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-4 border border-border rounded-xl bg-background text-foreground focus:border-[#00D154] focus:outline-none"
                required
              />
            </div>

            <div>
              <input
                type="email"
                placeholder="name@cloud.neduet.edu.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 border border-border rounded-xl bg-background text-foreground focus:border-[#00D154] focus:outline-none"
                required
              />
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                Only @cloud.neduet.edu.pk emails allowed
              </p>
            </div>

            <div>
              <input
                type="tel"
                placeholder="03xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full p-4 border border-border rounded-xl bg-background text-foreground focus:border-[#00D154] focus:outline-none"
                maxLength={11}
                required
              />
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                Pakistan format: 03xxxxxxxxx
              </p>
            </div>

            <div>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-4 border border-border rounded-xl bg-background text-foreground focus:border-[#00D154] focus:outline-none"
                required
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Chemical Engineering">Chemical Engineering</option>
                <option value="Industrial Engineering">Industrial Engineering</option>
                <option value="Architecture">Architecture</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>

            <div>
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border border-border rounded-xl bg-background text-foreground focus:border-[#00D154] focus:outline-none"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00D154] text-white py-4 rounded-xl font-bold hover:bg-[#00D154]/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Get Verification Code"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-[#00D154] font-semibold hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="w-full max-w-sm">
            <p className="mb-4 text-sm text-muted-foreground text-center">
              Enter the 5-digit code sent to<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>

            <div className="flex justify-between gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-14 h-14 border-2 border-border rounded-xl text-center text-2xl font-bold text-foreground focus:border-[#00D154] focus:outline-none bg-background"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-[#00D154] py-4 rounded-xl font-bold hover:bg-black/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              Back to registration
            </button>

            {devOtp && (
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                  Development Mode:<br/>
                  OTP: <strong>{devOtp}</strong>
                </p>
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground mt-4">
              Check your email for the 5-digit code
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
