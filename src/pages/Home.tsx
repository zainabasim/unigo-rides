import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Car, List, Wallet, Leaf, TrendingUp, MessageCircle, User, ChevronDown, LogOut } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";
import QuickRoutes from "@/components/QuickRoutes";
import SavingsDashboard from "@/components/SavingsDashboard";
import WalletLedger from "@/components/WalletLedger";

const Home = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"routes" | "savings" | "wallet">("routes");
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <img src={unigoIcon} alt="UniGo" className="w-16 h-16 object-contain" />
        <span className="text-sm text-muted-foreground">UniGo Dashboard</span>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <User className="w-5 h-5 text-foreground" />
            <span className="text-sm font-medium text-foreground">
              {user?.user_metadata?.full_name || "User"}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate("/profile");
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-foreground">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
        <img src={nedLogo} alt="NED University" className="w-16 h-16 object-contain" />
      </div>

      {/* Welcome */}
      <div className="px-6 mt-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome to UniGo</h1>
        <p className="text-muted-foreground text-sm mt-1">NED Faculty Commute Network</p>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {[
            { id: "routes", label: "Quick Routes", icon: <Car className="w-4 h-4" /> },
            { id: "savings", label: "Savings", icon: <Leaf className="w-4 h-4" /> },
            { id: "wallet", label: "Wallet", icon: <Wallet className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {activeTab === "routes" && (
          <div className="space-y-6">
            <QuickRoutes />
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/need-a-ride")}
                className="rounded-2xl bg-primary p-4 text-left transition-transform active:scale-[0.98] btn-press"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Search className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="text-lg font-bold text-primary-foreground">Need a Ride</h2>
                <p className="text-primary-foreground/80 text-sm">Find available rides</p>
              </button>

              <button
                onClick={() => navigate("/offer-a-ride")}
                className="rounded-2xl bg-secondary p-4 text-left transition-transform active:scale-[0.98] btn-press"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Car className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h2 className="text-lg font-bold text-secondary-foreground">Offer a Ride</h2>
                <p className="text-secondary-foreground/80 text-sm">Share your ride</p>
              </button>
            </div>

            <button
              onClick={() => navigate("/my-rides")}
              className="w-full rounded-2xl border-2 border-border bg-card p-4 text-left transition-transform active:scale-[0.98] btn-press"
            >
              <div className="flex items-center gap-3">
                <List className="w-6 h-6 text-foreground" />
                <h2 className="text-lg font-bold text-foreground">My Rides</h2>
                <TrendingUp className="w-5 h-5 text-primary ml-auto" />
              </div>
              <p className="text-muted-foreground text-sm">View & manage your rides</p>
            </button>
          </div>
        )}

        {activeTab === "savings" && (
          <SavingsDashboard />
        )}

        {activeTab === "wallet" && (
          <WalletLedger />
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center py-4 border-t border-border">
        <img src={nedLogo} alt="NED University" className="w-12 h-12 object-contain mb-1" />
        <p className="text-xs text-muted-foreground">Developed by Zainab Asim | NEDUET</p>
      </div>
    </div>
  );
};

export default Home;
