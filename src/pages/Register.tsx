import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Form data
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Validate email domain - only @cloud.neduet.edu.pk allowed
  const validateEmail = (email: string) => {
    return email.endsWith("@cloud.neduet.edu.pk");
  };

  // Validate Pakistan phone format
  const validatePhone = (phone: string) => {
    const regex = /^03\d{9}$/;
    return regex.test(phone.replace(/-/g, ""));
  };

  // Handle registration - direct signup with Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error("Only @cloud.neduet.edu.pk emails are allowed!");
      return;
    }
    
    if (!validatePhone(phone)) {
      toast.error("Please enter a valid Pakistan phone number (03xxxxxxxxx)");
      return;
    }

    startTransition(() => {
      setLoading(true);
    });
    
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone.replace(/-/g, ""),
          },
        },
      });

      if (authError) {
        toast.error(authError.message || "Registration failed");
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Profile is created automatically by database trigger
        toast.success("Registration successful!");
        navigate("/driver-dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
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
          Create your account
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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
            disabled={loading || isPending}
            className="w-full bg-[#00D154] text-black font-bold py-4 rounded-xl hover:bg-[#00D154]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register"}
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
      </div>
    </div>
  );
};

export default Register;
