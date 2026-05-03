import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";

const Login = memo(() => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) navigate("/home", { replace: true });
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    // Override validation for presentation
    if (normalizedEmail === 'zainab@cloud.neduet.edu.pk') {
      // Set user state in localStorage immediately
      const userState = {
        id: "4",
        email: normalizedEmail,
        full_name: "Zainab Asim",
        user_role: "driver",
        phone: "03456789012",
        whatsapp: "03456789012"
      };
      
      localStorage.setItem('user', JSON.stringify(userState));
      
      // Show success toast
      toast.success(`Welcome back, Zainab Asim!`);
      
      // Navigate immediately to offer-a-ride
      navigate("/offer-a-ride", { replace: true });
      return;
    }

    if (!normalizedEmail.endsWith("@neduet.edu.pk") && !normalizedEmail.endsWith("@cloud.neduet.edu.pk")) {
      toast.error("Only @neduet.edu.pk or @cloud.neduet.edu.pk emails are allowed");
      return;
    }

    setLoading(true);

    // Hardcoded demo credentials for smooth demo
    const demoEmail = "zainab@cloud.neduet.edu.pk";
    const demoPassword = "12345678";

    if (normalizedEmail === demoEmail && password === demoPassword) {
      // Set user state in localStorage
      const userState = {
        id: "4",
        email: demoEmail,
        full_name: "Zainab Asim",
        user_role: "driver",
        phone: "03456789012",
        whatsapp: "03456789012"
      };
      
      localStorage.setItem('user', JSON.stringify(userState));
      
      // Show success toast
      toast.success(`Welcome back, Zainab Asim!`);
      
      // Simulate loading state for UI feedback
      setTimeout(() => {
        // Redirect to offer-a-ride page
        navigate("/offer-a-ride", { replace: true });
      }, 1500);
    } else {
      // Only show error toast for incorrect credentials (not for presentation email)
      if (normalizedEmail !== 'zainab@cloud.neduet.edu.pk') {
        toast.error("Invalid credentials. Please check your email and password.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ backgroundColor: 'white' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
        <span className="text-sm text-muted-foreground">Login</span>
        <img src={nedLogo} alt="NED University" className="w-10 h-10 object-contain" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Branding */}
        <div className="bg-black p-8 rounded-2xl mb-6 shadow-lg">
          <span className="text-[#00D154] text-6xl font-bold">U</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">UniGo</h1>
        <p className="text-slate-600 mb-8 text-lg font-medium">Faculty Login</p>
        
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div>
            <input
              type="email"
              placeholder="name@cloud.neduet.edu.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl bg-white focus:border-[#00D154] focus:outline-none focus:ring-2 focus:ring-[#00D154]/20"
              style={{ color: '#000000 !important' }}
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl bg-white focus:border-[#00D154] focus:outline-none focus:ring-2 focus:ring-[#00D154]/20"
              style={{ color: '#000000 !important' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00D154] text-white py-4 rounded-xl font-bold hover:bg-[#00D154]/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-[#00D154] font-semibold hover:underline"
            >
              Register
            </button>
          </p>
        </form>

        <div className="mt-12 text-center">
          <img src={nedLogo} alt="NED University" className="w-16 h-16 object-contain mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">DEVELOPED BY S.ZAINAB ASIM | FE ELECTRONICS ENGINEERING DEPT. | NEDUET</p>
        </div>
      </div>
    </div>
  );
});

export default Login;
