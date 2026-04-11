import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Car, Search } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";

const MyRides = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: offeredRides = [], isLoading: offeredLoading } = useQuery({
    queryKey: ["my-offered-rides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: bookedRides = [], isLoading: bookedLoading } = useQuery({
    queryKey: ["my-booked-rides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, rides(*, profiles!rides_driver_id_fkey(full_name))")
        .eq("passenger_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = offeredLoading || bookedLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/home")}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <span className="text-sm text-muted-foreground">My Rides</span>
        <img src={nedLogo} alt="NED" className="w-8 h-8 object-contain" />
      </div>

      <div className="px-6 flex-1 pb-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : (
          <>
            {/* Offered Rides */}
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Car className="w-5 h-5" /> Rides I Offered
            </h2>
            {offeredRides.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-6">No rides offered yet</p>
            ) : (
              <div className="space-y-3 mb-6">
                {offeredRides.map((ride) => (
                  <button
                    key={ride.id}
                    onClick={() => navigate(`/manage-ride/${ride.id}`)}
                    className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-card-foreground">{ride.origin} → {ride.destination}</p>
                        <p className="text-xs text-muted-foreground mt-1">{ride.departure_time} · {ride.vehicle_model}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                        (ride as any).ride_status === "in_progress"
                          ? "bg-primary/10 text-primary border-primary/30"
                          : (ride as any).ride_status === "completed"
                          ? "bg-muted text-muted-foreground border-border"
                          : "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                      }`}>
                        {(ride as any).ride_status === "in_progress" ? "In Progress" : (ride as any).ride_status === "completed" ? "Completed" : "Awaiting"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Booked Rides */}
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Search className="w-5 h-5" /> Rides I Booked
            </h2>
            {bookedRides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rides booked yet</p>
            ) : (
              <div className="space-y-3">
                {bookedRides.map((booking: any) => {
                  const ride = booking.rides;
                  const driverName = ride?.profiles?.full_name || "Faculty Member";
                  return (
                    <button
                      key={booking.id}
                      onClick={() => navigate(`/ride-partner/${booking.id}`)}
                      className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/30"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-card-foreground">{ride?.origin} → {ride?.destination}</p>
                          <p className="text-xs text-muted-foreground mt-1">Driver: {driverName} · {ride?.departure_time}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                          booking.status === "cancelled"
                            ? "bg-destructive/10 text-destructive border-destructive/30"
                            : "bg-primary/10 text-primary border-primary/30"
                        }`}>
                          {booking.status === "cancelled" ? "Cancelled" : "Booked"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyRides;
