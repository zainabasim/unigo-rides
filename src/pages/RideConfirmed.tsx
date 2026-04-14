import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Car, MapPin, Clock, Users, Phone, MessageCircle, CheckCircle } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";

const RideConfirmed = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [bookingStatus, setBookingStatus] = useState<"confirmed" | "driver-arriving" | "in-progress" | "completed">("confirmed");
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          rides!bookings_ride_id_fkey(
            *,
            profiles!rides_driver_id_fkey(full_name, department, phone)
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    // Simulate ride status progression
    const statusTimer = setTimeout(() => {
      if (bookingStatus === "confirmed") {
        setBookingStatus("driver-arriving");
      } else if (bookingStatus === "driver-arriving") {
        setBookingStatus("in-progress");
      } else if (bookingStatus === "in-progress") {
        setBookingStatus("completed");
      }
    }, 30000); // Change status every 30 seconds for demo

    return () => clearTimeout(statusTimer);
  }, [bookingStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (bookingStatus) {
      case "confirmed": return "text-blue-600";
      case "driver-arriving": return "text-orange-600";
      case "in-progress": return "text-green-600";
      case "completed": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (bookingStatus) {
      case "confirmed": return "Ride Confirmed";
      case "driver-arriving": return "Driver is Arriving";
      case "in-progress": return "Ride in Progress";
      case "completed": return "Ride Completed";
      default: return "Unknown Status";
    }
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Booking not found</p>
          <button
            onClick={() => navigate("/my-rides")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Back to My Rides
          </button>
        </div>
      </div>
    );
  }

  const ride = booking.rides as any;
  const driver = ride.profiles as any;

  const getInitialColor = (name: string) => {
    const colors = ["bg-primary", "bg-secondary"];
    return colors[name.length % 2];
  };

  const driverInitial = driver?.full_name?.charAt(0).toUpperCase() || "D";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/my-rides")}>
          <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
        </button>
        <span className="text-sm text-muted-foreground">Ride Status</span>
        <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain" />
      </div>

      {/* Status Card */}
      <div className="px-6 mt-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${getStatusColor()}`}>
              {getStatusText()}
            </h2>
            {bookingStatus !== "completed" && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono text-muted-foreground">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          {bookingStatus === "completed" && (
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Trip Completed Successfully</span>
            </div>
          )}

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {["Confirmed", "Arriving", "In Progress", "Completed"].map((step, index) => {
              const stepStatus = index === 0 ? "confirmed" : 
                             index === 1 ? "driver-arriving" : 
                             index === 2 ? "in-progress" : "completed";
              const isActive = bookingStatus === stepStatus || 
                           (stepStatus === "confirmed" && bookingStatus !== "confirmed") ||
                           (stepStatus === "driver-arriving" && bookingStatus !== "confirmed" && bookingStatus !== "driver-arriving") ||
                           (stepStatus === "in-progress" && bookingStatus === "completed");
              
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {isActive ? "✓" : index + 1}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 hidden sm:block">{step}</span>
                </div>
              );
            })}
          </div>

          {/* Driver Info */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full ${getInitialColor(driver?.full_name || "Driver")} flex items-center justify-center`}>
                <span className="font-bold text-primary-foreground">{driverInitial}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-card-foreground">{driver?.full_name || "Faculty Member"}</p>
                <p className="text-sm text-muted-foreground">{driver?.department || "Department"}</p>
              </div>
              <div className="flex gap-2">
                {driver?.phone && (
                  <button 
                    onClick={() => handleCall(driver.phone)}
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                    title="Call driver"
                  >
                    <Phone className="w-4 h-4 text-foreground" />
                  </button>
                )}
                <button 
                  onClick={() => handleWhatsApp(driver?.phone)}
                  className="p-2 rounded-lg bg-green-100 hover:bg-green-200 transition-colors"
                  title="WhatsApp driver"
                >
                  <MessageCircle className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Ride Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Car:</span>
                <span className="text-card-foreground font-medium">{ride.vehicle_model}</span>
                <span className="text-muted-foreground">({ride.plate_number})</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Route:</span>
                <span className="text-card-foreground font-medium">{ride.origin} → {ride.destination}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Time:</span>
                <span className="text-card-foreground font-medium">{ride.departure_time}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Seats:</span>
                <span className="text-card-foreground font-medium">{ride.available_seats} available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 mt-6 space-y-3 pb-6">
        {bookingStatus === "confirmed" && (
          <button
            className="w-full h-12 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm hover:bg-destructive/90 transition-all transform active:scale-95"
          >
            Cancel Booking
          </button>
        )}
        
        {bookingStatus === "in-progress" && (
          <button
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all transform active:scale-95"
          >
            Emergency Contact
          </button>
        )}

        {bookingStatus === "completed" && (
          <>
            <button
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all transform active:scale-95"
            >
              Rate Driver
            </button>
            <button
              onClick={() => navigate("/need-a-ride")}
              className="w-full h-12 rounded-xl border border-border bg-background text-foreground font-semibold text-sm hover:bg-muted transition-all transform active:scale-95"
            >
              Book Another Ride
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RideConfirmed;
