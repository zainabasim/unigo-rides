import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";
import RouteChat from "@/components/RouteChat";

const Chat = () => {
  const navigate = useNavigate();
  const { rideId } = useParams<{ rideId: string }>();

  const { data: ride, isLoading } = useQuery({
    queryKey: ["ride-chat", rideId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rides")
        .select("*, profiles!rides_driver_id_fkey(full_name)")
        .eq("id", rideId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!rideId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading chat...</p>
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

  const driver = ride.profiles as unknown as { full_name: string } | null;
  const driverId = ride.driver_id;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button onClick={() => navigate("/my-rides")}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">Ride Chat</span>
        </div>
        <img src={nedLogo} alt="NED" className="w-8 h-8 object-contain" />
      </div>

      {/* Chat Component */}
      <div className="flex-1">
        <RouteChat 
          rideId={rideId!} 
          driverId={driverId}
        />
      </div>
    </div>
  );
};

export default Chat;
