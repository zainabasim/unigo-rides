import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";

const Login = () => {
  console.log('Login.tsx: Rendering Login component');
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

    if (!normalizedEmail.endsWith("@neduet.edu.pk") && !normalizedEmail.endsWith("@cloud.neduet.edu.pk")) {
      toast.error("Only @neduet.edu.pk or @cloud.neduet.edu.pk emails are allowed");
      return;
    }

    setLoading(true);

    // Mock authentication with predefined credentials
    const mockCredentials = [
      { email: "ali.khan@cloud.neduet.edu.pk", password: "password123", name: "Ali Khan" },
      { email: "sara.ahmed@cloud.neduet.edu.pk", password: "password123", name: "Sara Ahmed" },
      { email: "umar.farooq@cloud.neduet.edu.pk", password: "password123", name: "Umar Farooq" },
      { email: "zainab@cloud.neduet.edu.pk", password: "password123", name: "Zainab Asim" }
    ];

    const user = mockCredentials.find(
      cred => cred.email === normalizedEmail && cred.password === password
    );

    if (user) {
      // Mock successful login
      toast.success(`Welcome back, ${user.name}!`);
      // Redirect to home page after successful login
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 1000);
    } else {
      toast.error("Invalid credentials. Please check your email and password.");
    }

    setLoading(false);
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
              className="w-full p-4 border border-gray-300 rounded-xl bg-white text-slate-900 focus:border-[#00D154] focus:outline-none focus:ring-2 focus:ring-[#00D154]/20"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl bg-white text-slate-900 focus:border-[#00D154] focus:outline-none focus:ring-2 focus:ring-[#00D154]/20"
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
};

export default Login;
