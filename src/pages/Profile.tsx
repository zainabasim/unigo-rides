import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { User, Edit, Leaf, TrendingUp, LogOut, ChevronDown } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";

interface UserProfile {
  full_name: string;
  department: string;
  designation?: string;
  green_score?: number;
  total_rides?: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    department: "",
    designation: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, department, designation, green_score, total_rides")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Profile fetch error:", error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleEdit = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name,
        department: profile.department,
        designation: profile.designation || ""
      });
      setIsEditing(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          department: editForm.department,
          designation: editForm.designation,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to update profile: " + error.message);
      } else {
        setProfile({
          ...profile,
          ...editForm
        });
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Error updating profile: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      full_name: "",
      department: "",
      designation: ""
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/home")}>
          <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
        </button>
        <span className="text-sm text-muted-foreground">My Profile</span>
        <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain" />
      </div>

      {/* Profile Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Info Card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
                <p className="text-muted-foreground">{profile.designation || "Faculty Member"}</p>
                <p className="text-sm text-primary font-medium">{profile.department}</p>
              </div>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Impact Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Leaf className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Green Score</h3>
                    <p className="text-2xl font-bold text-primary">{profile.green_score || 0}</p>
                    <p className="text-xs text-muted-foreground">Environmental Impact</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Total Rides</h3>
                    <p className="text-2xl font-bold text-primary">{profile.total_rides || 0}</p>
                    <p className="text-xs text-muted-foreground">Completed Journeys</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 text-primary">💰</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Ride Ledger</h3>
                    <p className="text-2xl font-bold text-primary">₨2,450</p>
                    <p className="text-xs text-muted-foreground">Total PKR This Month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Edit Profile</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Designation</label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g., Assistant Professor"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="h-12 px-4 rounded-xl border-2 border-border bg-background text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center py-4 border-t border-border">
        <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain mb-1" />
        <p className="text-xs text-muted-foreground">NED University Faculty Carpool</p>
      </div>
    </div>
  );
};

export default Profile;
