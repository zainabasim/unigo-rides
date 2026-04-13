import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Car, Search, MapPin, Clock, Users } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";
import PhoneContact from "@/components/PhoneContact";

interface SearchingRidesProps {
  pickupLocation?: string;
  destination?: string;
  time?: string;
}

const SearchingRides = ({ pickupLocation = "Your Location", destination = "NED University", time = "8:00 AM" }: SearchingRidesProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchStatus, setSearchStatus] = useState<"searching" | "found" | "none">("searching");
  const [matchedRides, setMatchedRides] = useState<any[]>([]);

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ["rides", "search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*, profiles!rides_driver_id_fkey(full_name, department, phone_number)")
        .eq("is_active", true)
        .gt("available_seats", 0)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!isLoading && rides.length > 0) {
      // Simulate search process
      const timer = setTimeout(() => {
        setMatchedRides(rides.slice(0, 3)); // Show top 3 matches
        setSearchStatus("found");
      }, 3000);

      return () => clearTimeout(timer);
    } else if (!isLoading && rides.length === 0) {
      const timer = setTimeout(() => {
        setSearchStatus("none");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, rides]);

  const handleBookRide = (rideId: string) => {
    navigate(`/ride-partner/${rideId}`);
  };

  const getInitialColor = (name: string) => {
    const colors = ["bg-primary", "bg-secondary"];
    return colors[name.length % 2];
  };

  if (searchStatus === "searching") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate("/need-a-ride")}>
            <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
          </button>
          <span className="text-sm text-muted-foreground">Searching Rides</span>
          <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain" />
        </div>

        {/* Search Animation */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <Search className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-primary animate-ping" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Finding Available Rides</h2>
          <p className="text-muted-foreground text-center mb-8">
            Searching for faculty members heading from {pickupLocation} to {destination}
          </p>

          <div className="space-y-3 w-full max-w-sm">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">{pickupLocation}</span>
            </div>
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">{destination}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">{time}</span>
            </div>
          </div>

          <div className="mt-8 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (searchStatus === "found") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate("/need-a-ride")}>
            <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
          </button>
          <span className="text-sm text-muted-foreground">Available Rides</span>
          <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain" />
        </div>

        {/* Results */}
        <div className="flex-1 px-6 py-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Found {matchedRides.length} Available Rides</h2>
            <p className="text-sm text-muted-foreground">
              Perfect matches for your route to {destination}
            </p>
          </div>

          <div className="space-y-4">
            {matchedRides.map((ride) => {
              const profile = ride.profiles as unknown as { full_name: string; department: string; phone_number?: string } | null;
              const driverName = profile?.full_name || "Faculty Member";
              const department = profile?.department || "Department";
              const phoneNumber = profile?.phone_number;
              const initial = driverName.charAt(0).toUpperCase();

              return (
                <div key={ride.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full ${getInitialColor(driverName)} flex items-center justify-center`}>
                      <span className="font-bold text-sm text-primary-foreground">{initial}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-card-foreground">{driverName}</p>
                      <p className="text-xs text-muted-foreground">{department}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">${Number(ride.price)}</p>
                      <p className="text-xs text-muted-foreground">{ride.available_seats} seats</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3 text-sm">
                    <p className="text-muted-foreground">From: <span className="text-card-foreground">{ride.origin}</span></p>
                    <p className="text-muted-foreground">Time: <span className="text-card-foreground">{ride.departure_time}</span></p>
                    <p className="text-muted-foreground">Car: <span className="text-card-foreground">{ride.vehicle_model}</span></p>
                  </div>

                  {phoneNumber && (
                    <div className="mb-3">
                      <PhoneContact 
                        phoneNumber={phoneNumber} 
                        userName={driverName}
                        compact={true}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleBookRide(ride.id)}
                    className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all transform active:scale-95"
                  >
                    Book This Ride
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // No rides found
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/need-a-ride")}>
          <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
        </button>
        <span className="text-sm text-muted-foreground">No Rides Found</span>
        <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Car className="w-12 h-12 text-muted-foreground" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">No Available Rides</h2>
        <p className="text-muted-foreground text-center mb-8">
          No rides found for your selected route and time. Try adjusting your search criteria or check back later.
        </p>

        <button
          onClick={() => navigate("/offer-a-ride")}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all transform active:scale-95"
        >
          Offer a Ride Instead
        </button>
      </div>
    </div>
  );
};

export default SearchingRides;
