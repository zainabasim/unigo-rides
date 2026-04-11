import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";
import LocationSearch from "@/components/LocationSearch";
import RideMap from "@/components/RideMap";
import DepartmentBadge from "@/components/DepartmentBadge";
import CampusLandmarkSelector from "@/components/CampusLandmarkSelector";
import RouteChat from "@/components/RouteChat";

const NeedARide = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [areaFilter, setAreaFilter] = useState("All Areas");
  const [bookedRides, setBookedRides] = useState<Set<string>>(new Set());
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  const [showLandmarkSelector, setShowLandmarkSelector] = useState(false);
  const [showChat, setShowChat] = useState<string | null>(null);

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ["rides", areaFilter],
    queryFn: async () => {
      let query = supabase
        .from("rides")
        .select("*, profiles!rides_driver_id_fkey(full_name, department)")
        .eq("is_active", true)
        .gt("available_seats", 0)
        .order("created_at", { ascending: false });

      if (areaFilter !== "All Areas") {
        query = query.eq("area", areaFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const bookMutation = useMutation({
    mutationFn: async (rideId: string) => {
      const { data, error } = await supabase.rpc("book_ride", {
        p_ride_id: rideId,
        p_passenger_id: user!.id,
      });
      if (error) throw error;
      if (!data) throw new Error("Could not book ride");
      return rideId;
    },
    onSuccess: (rideId) => {
      setBookedRides((prev) => new Set(prev).add(rideId));
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      toast.success("Redirecting to ride confirmation...");
      // Navigate to searching rides screen first, then to ride confirmed
      navigate("/searching-rides");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to book ride");
    },
  });

  const areas = ["All Areas", "Gulshan", "North Nazimabad", "Clifton", "Saddar", "Korangi"];

  // Area approximate coordinates for map markers
  const areaCoords: Record<string, { lat: number; lng: number }> = {
    Gulshan: { lat: 24.9262, lng: 67.0935 },
    "North Nazimabad": { lat: 24.9425, lng: 67.0325 },
    Clifton: { lat: 24.8138, lng: 67.0300 },
    Saddar: { lat: 24.8607, lng: 67.0100 },
    Korangi: { lat: 24.8350, lng: 67.1310 },
    Defence: { lat: 24.8050, lng: 67.0700 },
  };

  const rideMarkers = rides.map((ride) => {
    const coords = areaCoords[ride.area] || { lat: 24.92, lng: 67.08 };
    return {
      id: ride.id,
      lat: coords.lat + (Math.random() - 0.5) * 0.01,
      lng: coords.lng + (Math.random() - 0.5) * 0.01,
      label: `${ride.origin} → ${ride.destination}`,
    };
  });

  const getInitialColor = (name: string) => {
    const colors = ["bg-primary", "bg-secondary"];
    return colors[name.length % 2];
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/home")}>
          <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
        </button>
        <span className="text-sm text-muted-foreground">Need a Ride</span>
        <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain" />
      </div>

      {/* Location Search */}
      <div className="px-6 mt-2">
        <LocationSearch
          placeholder="Search your pickup location..."
          onSelect={(loc) => setSearchLocation({ lat: loc.lat, lng: loc.lng })}
        />
      </div>

      {/* Live Map */}
      <div className="px-6 mt-3">
        <RideMap markers={rideMarkers} searchLocation={searchLocation} height="180px" />
      </div>

      {/* Campus Landmark Selector Modal */}
      {showLandmarkSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-2xl border border-border max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Select Drop-off Point</h3>
              <button
                onClick={() => setShowLandmarkSelector(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <CampusLandmarkSelector
                onSelect={(landmark) => {
                  setSelectedLandmark(landmark);
                  setShowLandmarkSelector(false);
                }}
                selectedLandmark={selectedLandmark}
              />
            </div>
          </div>
        </div>
      )}

      {/* Route Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Ride Chat</h3>
              <button
                onClick={() => setShowChat(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                ×
              </button>
            </div>
            <div className="h-[60vh]">
              <RouteChat
                rideId={showChat}
                driverId={""} // Will be populated from ride data
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="px-6 mt-3 mb-3">
        <div className="relative">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-4 pr-10 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {areas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Rides List */}
      <div className="px-6 space-y-4 flex-1 pb-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading rides...</div>
        ) : rides.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No rides available</div>
        ) : (
          rides.map((ride) => {
            const profile = ride.profiles as unknown as { full_name: string; department: string } | null;
            const driverName = profile?.full_name || "Faculty Member";
            const department = profile?.department || "Department";
            const isBooked = bookedRides.has(ride.id);
            const initial = driverName.charAt(0).toUpperCase();

            return (
              <div key={ride.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${getInitialColor(driverName)} flex items-center justify-center`}>
                    <span className="font-bold text-sm text-primary-foreground">{initial}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-card-foreground">{driverName}</p>
                    <DepartmentBadge 
                      department={department} 
                      compact={true}
                      trustLevel={ride.total_seats > 2 ? "high" : "medium"}
                    />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {ride.available_seats} seat{ride.available_seats !== 1 ? "s" : ""} available
                      </span>
                      <span className="font-bold text-primary text-sm">${Number(ride.price)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-3 text-sm">
                  <p className="text-muted-foreground">From: <span className="text-card-foreground">{ride.origin}</span></p>
                  <p className="text-muted-foreground">To: <span className="text-card-foreground">{ride.destination}</span></p>
                  <p className="text-muted-foreground">Time: <span className="text-card-foreground">{ride.departure_time}</span></p>
                  <p className="text-muted-foreground">Car: <span className="text-card-foreground">{ride.vehicle_model}</span></p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowLandmarkSelector(true)}
                      className="text-xs px-2 py-1 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      Drop-off Point
                    </button>
                    {selectedLandmark && (
                      <span className="text-xs text-primary font-medium">
                        {selectedLandmark.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <RouteChat
                      rideId={ride.id}
                      driverId={ride.driver_id}
                      compact={true}
                    />
                    <button
                      onClick={() => !isBooked && bookMutation.mutate(ride.id)}
                      disabled={isBooked || bookMutation.isPending}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors btn-press ${
                        isBooked
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isBooked ? "Booked" : "Book"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NeedARide;
