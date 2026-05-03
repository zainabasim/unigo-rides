import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface MockUser {
  id: string;
  email: string;
  full_name: string;
  user_role: string;
  phone: string;
  whatsapp: string;
}

interface AuthContextType {
  session: MockUser | null;
  user: MockUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Set a 2-second timeout to force success state
    timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    // Check localStorage for existing user session (async)
    setTimeout(() => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setSession(user);
        }
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (error) {
        localStorage.removeItem('user');
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }, 0);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const signOut = async () => {
    // Clear session state
    setSession(null);
    
    // Clear localStorage asynchronously
    setTimeout(() => {
      localStorage.removeItem('user');
    }, 0);
    
    // Navigation will redirect to login page via useEffect in components
  };

  return (
    <AuthContext.Provider value={{ session, user: session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
