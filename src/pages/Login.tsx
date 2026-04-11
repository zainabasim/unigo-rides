import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import unigoIcon from "@/assets/unigo-icon.png";
import unigoLogo from "@/assets/unigo-logo.png";
import nedLogo from "@/assets/ned-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) navigate("/home", { replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@neduet.edu.pk") && !normalizedEmail.endsWith("@cloud.neduet.edu.pk")) {
      setError("Only @neduet.edu.pk or @cloud.neduet.edu.pk emails are allowed");
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          data: {
            full_name: fullName.trim(),
            department: department.trim(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        navigate("/verify-otp", { 
          state: { 
            email: normalizedEmail, 
            password, 
            fullName: fullName.trim(), 
            department: department.trim(),
            designation: designation.trim()
          } 
        });
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        if (authError.message === "Invalid login credentials") {
          setError("No faculty account was found with these credentials. If this is your first time, please use Sign Up first.");
        } else {
          setError(authError.message);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <img src={unigoIcon} alt="UniGo" className="w-16 h-16 object-contain" />
        <span className="text-sm text-muted-foreground">{isSignUp ? "Sign Up" : "Login"}</span>
        <img src={nedLogo} alt="NED University" className="w-24 h-24 object-contain" />
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mt-12 mb-12 px-8">
        <img src={unigoIcon} alt="UniGo" className="w-80 h-80 object-contain mb-6" />
        <img src={unigoLogo} alt="UniGo" className="h-32 object-contain" />
        <p className="text-muted-foreground text-sm mt-4">NED Faculty Commute Network</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 flex-1 flex flex-col">
        <div className="space-y-4 mb-6">
          {isSignUp && (
            <>
              <input
                type="text"
                placeholder="Full Name (e.g. Dr. Zainab Ahmed)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <input
                type="text"
                placeholder="Department (e.g. Computer Science)"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <input
                type="text"
                placeholder="Designation (e.g. Assistant Professor)"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="prof.ahmed@neduet.edu.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        {error && (
          <p className={`text-sm text-center mb-4 ${error.includes("created") ? "text-primary" : "text-destructive"}`}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")}
        </button>

        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </button>

        {/* Footer */}
        <div className="flex-1" />
        <div className="flex flex-col items-center pb-8 mt-8">
          <img src={nedLogo} alt="NED University" className="w-32 h-32 object-contain mb-2" />
          <p className="text-xs text-muted-foreground">In collaboration with</p>
          <p className="text-sm font-semibold text-foreground">NED University</p>
        </div>
      </form>
    </div>
  );
};

export default Login;
