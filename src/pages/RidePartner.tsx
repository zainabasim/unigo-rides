import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft, Car, Clock, MapPin, User, XCircle } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";
import PhoneContact from "@/components/PhoneContact";

const RidePartner = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-detail", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, rides(*, profiles!rides_driver_id_fkey(full_name, department, phone_number))")
        .eq("id", bookingId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId!)
        .eq("passenger_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-detail", bookingId] });
      toast.success("Booking cancelled");
      navigate("/my-rides");
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading ride details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Booking not found</p>
        <button onClick={() => navigate("/my-rides")} className="text-primary text-sm font-semibold">Go back</button>
      </div>
    );
  }

  const ride = booking.rides as any;
  const driver = ride?.profiles as { full_name: string; department: string; phone_number?: string } | null;
  const rideStatus = ride?.ride_status || "awaiting";
  const isCancelled = booking.status === "cancelled";

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    awaiting: { label: "Awaiting Departure", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30", icon: Clock },
    in_progress: { label: "In Progress", color: "bg-primary/10 text-primary border-primary/30", icon: Car },
    completed: { label: "Completed", color: "bg-muted text-muted-foreground border-border", icon: Clock },
  };

  const status = isCancelled
    ? { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle }
    : statusConfig[rideStatus] || statusConfig.awaiting;

  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/my-rides")}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <span className="text-sm text-muted-foreground">Ride Details</span>
        <img src={nedLogo} alt="NED" className="w-8 h-8 object-contain" />
      </div>

      <div className="px-6 flex-1">
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold mb-6 ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          {status.label}
        </div>

        {/* Driver Info Card */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Driver</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="font-bold text-lg text-primary-foreground">
                {(driver?.full_name || "D").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-card-foreground">{driver?.full_name || "Faculty Member"}</p>
              <p className="text-xs text-muted-foreground">{driver?.department || "Department"}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className="text-card-foreground">{ride?.vehicle_model}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{ride?.plate_number}</span>
            </div>
            {driver?.phone_number && (
              <PhoneContact 
                phoneNumber={driver.phone_number} 
                userName={driver.full_name}
                compact={true}
              />
            )}
          </div>
        </div>

        {/* Route Info */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Route</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-card-foreground">{ride?.origin}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-card-foreground">{ride?.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-card-foreground">{ride?.departure_time}</span>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        {!isCancelled && rideStatus === "awaiting" && (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="w-full h-12 rounded-xl border-2 border-destructive text-destructive font-semibold text-sm hover:bg-destructive/10 transition-colors disabled:opacity-50 mt-2"
          >
            {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
          </button>
        )}
      </div>
    </div>
  );
};

export default RidePartner;
