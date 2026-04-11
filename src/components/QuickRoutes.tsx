import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Home, MapPin, Clock, ArrowRight, Star, Plus } from "lucide-react";

interface QuickRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  originCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  departureTime: string;
  isDefault?: boolean;
}

const QuickRoutes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quickRoutes, setQuickRoutes] = useState<QuickRoute[]>([
    {
      id: "morning-rush",
      name: "Morning Rush",
      origin: "Home",
      destination: "NED Main Campus",
      originCoords: { lat: 24.9340, lng: 67.1113 },
      destinationCoords: { lat: 24.9340, lng: 67.1113 },
      departureTime: "8:00 AM",
      isDefault: true,
    },
    {
      id: "evening-departure",
      name: "Evening Departure",
      origin: "NED Main Campus",
      destination: "Home",
      originCoords: { lat: 24.9340, lng: 67.1113 },
      destinationCoords: { lat: 24.8607, lng: 67.0011 }, // Approximate Karachi center
      departureTime: "5:00 PM",
      isDefault: true,
    },
  ]);

  const { data: availableRides = [] } = useQuery({
    queryKey: ["quick-route-rides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*, profiles!rides_driver_id_fkey(full_name, department)")
        .eq("is_active", true)
        .gt("available_seats", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleQuickRoute = (route: QuickRoute) => {
    // Find matching rides for this route
    const matchingRides = availableRides.filter(ride => {
      const isMorningRoute = route.name === "Morning Rush";
      const isEveningRoute = route.name === "Evening Departure";
      
      if (isMorningRoute) {
        return ride.destination.toLowerCase().includes("ned") && 
               ride.departure_time.includes("8:") &&
               ride.available_seats > 0;
      } else if (isEveningRoute) {
        return ride.origin.toLowerCase().includes("ned") && 
               ride.departure_time.includes("5:") &&
               ride.available_seats > 0;
      }
      
      return false;
    });

    if (matchingRides.length > 0) {
      toast.success(`Found ${matchingRides.length} rides for ${route.name}!`);
      navigate("/searching-rides", { 
        state: { 
          pickupLocation: route.origin, 
          destination: route.destination,
          time: route.departureTime,
          preFilteredRides: matchingRides 
        } 
      });
    } else {
      toast.info(`No rides available for ${route.name}. Try offering a ride!`);
      navigate("/offer-a-ride", { 
        state: { 
          origin: route.origin,
          destination: route.destination,
          departureTime: route.departureTime,
          originCoords: route.originCoords
        } 
      });
    }
  };

  const getRouteIcon = (routeName: string) => {
    switch (routeName) {
      case "Morning Rush":
        return <Home className="w-5 h-5 text-primary" />;
      case "Evening Departure":
        return <MapPin className="w-5 h-5 text-primary" />;
      default:
        return <Clock className="w-5 h-5 text-primary" />;
    }
  };

  const getRouteColor = (routeName: string) => {
    switch (routeName) {
      case "Morning Rush":
        return "from-orange-500 to-yellow-500";
      case "Evening Departure":
        return "from-blue-500 to-purple-500";
      default:
        return "from-green-500 to-emerald-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">Quick Routes</h3>
        <button className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
          <Plus className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        {quickRoutes.map((route) => {
          const matchingRides = availableRides.filter(ride => {
            const isMorningRoute = route.name === "Morning Rush";
            const isEveningRoute = route.name === "Evening Departure";
            
            if (isMorningRoute) {
              return ride.destination.toLowerCase().includes("ned") && 
                     ride.departure_time.includes("8:");
            } else if (isEveningRoute) {
              return ride.origin.toLowerCase().includes("ned") && 
                     ride.departure_time.includes("5:");
            }
            return false;
          });

          return (
            <button
              key={route.id}
              onClick={() => handleQuickRoute(route)}
              className="w-full rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getRouteColor(route.name)} text-white`}>
                    {getRouteIcon(route.name)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {route.name}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{route.origin}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{route.destination}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {route.departureTime}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {matchingRides.length > 0 ? (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-green-600 font-medium">
                        {matchingRides.length} available
                      </span>
                      <div className="flex gap-1">
                        {[...Array(Math.min(3, matchingRides.length))].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground">No rides</span>
                      <span className="text-xs text-primary font-medium">Offer one</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Route Stats */}
      <div className="rounded-xl border border-border bg-muted/50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Today's popular routes</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Morning</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Evening</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Route Button */}
      <button
        onClick={() => navigate("/need-a-ride")}
        className="w-full rounded-xl border-2 border-dashed border-border bg-background p-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create Custom Route</span>
        </div>
      </button>
    </div>
  );
};

export default QuickRoutes;
