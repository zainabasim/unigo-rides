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
    console.log('AuthProvider: Checking localStorage for user session');
    
    // Check localStorage for existing user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('AuthProvider: Found user in localStorage', { email: user.email });
        setSession(user);
      } catch (error) {
        console.error('AuthProvider: Error parsing stored user', error);
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const signOut = async () => {
    console.log('AuthProvider: Signing out user');
    
    // Clear session state
    setSession(null);
    
    // Clear localStorage
    localStorage.removeItem('user');
    
    console.log('AuthProvider: User signed out successfully');
    // Navigation will redirect to login page via useEffect in components
  };

  return (
    <AuthContext.Provider value={{ session, user: session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
