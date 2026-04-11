import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Car, Users, MapPin, Clock, Phone, MessageCircle, CheckCircle, XCircle } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { rideId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"upcoming" | "active" | "completed">("upcoming");

  const { data: myRides = [], isLoading } = useQuery({
    queryKey: ["my-rides", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("rides")
        .select(`
          *,
          bookings (
            id,
            status,
            passenger_id,
            profiles!bookings_passenger_id_fkey(full_name, department, phone)
          )
        `)
        .eq("driver_id", user.id)
        .order("departure_time", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
      return bookingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-rides"] });
      toast.success("Booking status updated successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update booking");
    },
  });

  const getRideStatus = (ride: any) => {
    const departureTime = new Date(ride.departure_time);
    const now = new Date();
    const timeDiff = departureTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff > 2) return "upcoming";
    if (hoursDiff > -2) return "active";
    return "completed";
  };

  const filteredRides = myRides.filter(ride => getRideStatus(ride) === activeTab);

  const getInitialColor = (name: string) => {
    const colors = ["bg-primary", "bg-secondary"];
    return colors[name.length % 2];
  };

  const handleAcceptPassenger = (bookingId: string) => {
    updateBookingStatus.mutate({ bookingId, status: "confirmed" });
  };

  const handleRejectPassenger = (bookingId: string) => {
    updateBookingStatus.mutate({ bookingId, status: "cancelled" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your rides...</p>
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
        <span className="text-sm text-muted-foreground">Ride Partners</span>
        <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain" />
      </div>

      {/* Tabs */}
      <div className="px-6 mt-4">
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {["upcoming", "active", "completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Rides List */}
      <div className="flex-1 px-6 py-4 space-y-4 pb-6">
        {filteredRides.length === 0 ? (
          <div className="text-center py-8">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No {activeTab} rides</p>
          </div>
        ) : (
          filteredRides.map((ride: any) => {
            const bookings = ride.bookings || [];
            const confirmedPassengers = bookings.filter((b: any) => b.status === "confirmed");
            const pendingPassengers = bookings.filter((b: any) => b.status === "pending");

            return (
              <div key={ride.id} className="rounded-2xl border border-border bg-card p-4">
                {/* Ride Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{ride.origin} → {ride.destination}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ride.departure_time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {ride.vehicle_model}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {confirmedPassengers.length}/{ride.total_seats} seats
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">${Number(ride.price)}</p>
                    <p className="text-xs text-muted-foreground">per seat</p>
                  </div>
                </div>

                {/* Pending Passengers */}
                {pendingPassengers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Pending Requests</h4>
                    <div className="space-y-2">
                      {pendingPassengers.map((booking: any) => {
                        const passenger = booking.profiles as any;
                        const passengerInitial = passenger?.full_name?.charAt(0).toUpperCase() || "P";

                        return (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${getInitialColor(passenger?.full_name || "Passenger")} flex items-center justify-center`}>
                                <span className="font-bold text-xs text-primary-foreground">{passengerInitial}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-card-foreground">{passenger?.full_name || "Passenger"}</p>
                                <p className="text-xs text-muted-foreground">{passenger?.department || "Department"}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptPassenger(booking.id)}
                                className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectPassenger(booking.id)}
                                className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Confirmed Passengers */}
                {confirmedPassengers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Confirmed Passengers</h4>
                    <div className="space-y-2">
                      {confirmedPassengers.map((booking: any) => {
                        const passenger = booking.profiles as any;
                        const passengerInitial = passenger?.full_name?.charAt(0).toUpperCase() || "P";

                        return (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full ${getInitialColor(passenger?.full_name || "Passenger")} flex items-center justify-center`}>
                                <span className="font-bold text-xs text-primary-foreground">{passengerInitial}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-card-foreground">{passenger?.full_name || "Passenger"}</p>
                                <p className="text-xs text-muted-foreground">{passenger?.department || "Department"}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {passenger?.phone && (
                                <button className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                                  <Phone className="w-4 h-4 text-foreground" />
                                </button>
                              )}
                              <button className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                                <MessageCircle className="w-4 h-4 text-foreground" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Seats */}
                {confirmedPassengers.length === 0 && pendingPassengers.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No passengers yet for this ride
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
