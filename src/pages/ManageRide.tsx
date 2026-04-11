import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Play, CheckCircle, Users, Clock } from "lucide-react";
import nedLogo from "@/assets/ned-logo.png";

const ManageRide = () => {
  const navigate = useNavigate();
  const { rideId } = useParams<{ rideId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ride, isLoading: rideLoading } = useQuery({
    queryKey: ["manage-ride", rideId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("id", rideId!)
        .eq("driver_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!rideId && !!user,
  });

  const { data: passengers = [], isLoading: passengersLoading } = useQuery({
    queryKey: ["ride-passengers", rideId],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("ride_id", rideId!)
        .eq("status", "booked");
      if (error) throw error;
      if (!bookings || bookings.length === 0) return [];
      
      // Fetch profiles for all passengers
      const passengerIds = bookings.map(b => b.passenger_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, department")
        .in("user_id", passengerIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return bookings.map(b => ({
        ...b,
        profiles: profileMap.get(b.passenger_id) || null,
      }));
    },
    enabled: !!rideId,
  });

  const startRideMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rides")
        .update({ ride_status: "in_progress" })
        .eq("id", rideId!)
        .eq("driver_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-ride", rideId] });
      toast.success("Ride started! Passengers have been notified.");
    },
    onError: () => toast.error("Failed to start ride"),
  });

  const completeRideMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rides")
        .update({ ride_status: "completed", is_active: false })
        .eq("id", rideId!)
        .eq("driver_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-ride", rideId] });
      toast.success("Ride completed!");
    },
    onError: () => toast.error("Failed to complete ride"),
  });

  if (rideLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Ride not found</p>
        <button onClick={() => navigate("/my-rides")} className="text-primary text-sm font-semibold">Go back</button>
      </div>
    );
  }

  const rideStatus = (ride as any).ride_status || "awaiting";

  const statusConfig: Record<string, { label: string; color: string }> = {
    awaiting: { label: "Awaiting Departure", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
    in_progress: { label: "In Progress", color: "bg-primary/10 text-primary border-primary/30" },
    completed: { label: "Completed", color: "bg-muted text-muted-foreground border-border" },
  };

  const status = statusConfig[rideStatus] || statusConfig.awaiting;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/my-rides")}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <span className="text-sm text-muted-foreground">Manage Ride</span>
        <img src={nedLogo} alt="NED" className="w-8 h-8 object-contain" />
      </div>

      <div className="px-6 flex-1">
        {/* Status */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold mb-6 ${status.color}`}>
          <Clock className="w-4 h-4" />
          {status.label}
        </div>

        {/* Ride Summary */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ride Info</h3>
          <div className="space-y-1 text-sm">
            <p className="text-card-foreground font-semibold">{ride.vehicle_model}</p>
            <p className="text-muted-foreground font-mono text-xs">{ride.plate_number}</p>
            <p className="text-muted-foreground mt-2">{ride.origin} → {ride.destination}</p>
            <p className="text-muted-foreground">Departure: {ride.departure_time}</p>
            <p className="text-muted-foreground">{ride.available_seats}/{ride.total_seats} seats available</p>
          </div>
        </div>

        {/* Passengers List */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Passengers ({passengers.length})
            </h3>
          </div>

          {passengersLoading ? (
            <p className="text-sm text-muted-foreground">Loading passengers...</p>
          ) : passengers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No passengers yet</p>
          ) : (
            <div className="space-y-3">
              {passengers.map((booking: any) => {
                const profile = booking.profiles as { full_name: string; department: string } | null;
                return (
                  <div key={booking.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/30">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <span className="font-bold text-xs text-secondary-foreground">
                        {(profile?.full_name || "P").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-card-foreground">{profile?.full_name || "Faculty Member"}</p>
                      <p className="text-xs text-muted-foreground">{profile?.department || "Department"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {rideStatus === "awaiting" && (
          <button
            onClick={() => startRideMutation.mutate()}
            disabled={startRideMutation.isPending}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <Play className="w-4 h-4" />
            {startRideMutation.isPending ? "Starting..." : "Start Ride"}
          </button>
        )}

        {rideStatus === "in_progress" && (
          <button
            onClick={() => completeRideMutation.mutate()}
            disabled={completeRideMutation.isPending}
            className="w-full h-12 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <CheckCircle className="w-4 h-4" />
            {completeRideMutation.isPending ? "Completing..." : "Complete Ride"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ManageRide;
