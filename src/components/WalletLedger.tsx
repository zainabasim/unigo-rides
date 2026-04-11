import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, ArrowUpRight, ArrowDownLeft, Calendar, TrendingUp, Users } from "lucide-react";

interface WalletTransaction {
  id: string;
  type: "owe" | "owed" | "paid" | "received";
  amount: number;
  description: string;
  person: string;
  date: string;
  rideId?: string;
  status: "pending" | "completed";
}

interface WalletBalance {
  totalOwed: number;
  totalOwe: number;
  netBalance: number;
  weeklyOwed: number;
  weeklyOwe: number;
}

const WalletLedger = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletBalance>({
    totalOwed: 0,
    totalOwe: 0,
    netBalance: 0,
    weeklyOwed: 0,
    weeklyOwe: 0,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get recent bookings as passenger
      const { data: passengerBookings } = await supabase
        .from("bookings")
        .select(`
          *,
          rides!inner (
            *,
            profiles!rides_driver_id_fkey(full_name, department)
          )
        `)
        .eq("passenger_id", user.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      // Get recent bookings where user is driver
      const { data: driverBookings } = await supabase
        .from("rides")
        .select(`
          *,
          bookings (
            id,
            status,
            passenger_id,
            profiles!bookings_passenger_id_fkey(full_name, department)
          )
        `)
        .eq("driver_id", user.id)
        .eq("is_active", true);

      return { passengerBookings: passengerBookings || [], driverBookings: driverBookings || [] };
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (transactions.passengerBookings || transactions.driverBookings) {
      const calculatedBalance = calculateBalance(transactions);
      setBalance(calculatedBalance);
    }
  }, [transactions]);

  const calculateBalance = (data: any): WalletBalance => {
    const passengerBookings = data.passengerBookings || [];
    const driverBookings = data.driverBookings || [];
    
    let totalOwe = 0;
    let totalOwed = 0;
    let weeklyOwe = 0;
    let weeklyOwed = 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Calculate amounts owed (as passenger)
    passengerBookings.forEach((booking: any) => {
      const ride = booking.rides as any;
      const amount = ride.price || 0;
      totalOwe += amount;
      
      const bookingDate = new Date(booking.created_at);
      if (bookingDate > oneWeekAgo) {
        weeklyOwe += amount;
      }
    });

    // Calculate amounts owed to user (as driver)
    driverBookings.forEach((ride: any) => {
      const confirmedBookings = ride.bookings?.filter((b: any) => b.status === "confirmed") || [];
      confirmedBookings.forEach((booking: any) => {
        const amount = ride.price || 0;
        totalOwed += amount;
        
        const bookingDate = new Date(booking.created_at);
        if (bookingDate > oneWeekAgo) {
          weeklyOwed += amount;
        }
      });
    });

    return {
      totalOwed,
      totalOwe,
      netBalance: totalOwed - totalOwe,
      weeklyOwed,
      weeklyOwe,
    };
  };

  const getRecentTransactions = (): WalletTransaction[] => {
    const allTransactions: WalletTransaction[] = [];
    
    // Add passenger transactions
    transactions.passengerBookings?.forEach((booking: any) => {
      const ride = booking.rides as any;
      const driver = ride.profiles as any;
      
      allTransactions.push({
        id: booking.id,
        type: "owe",
        amount: ride.price || 0,
        description: `Ride to ${ride.destination}`,
        person: driver?.full_name || "Driver",
        date: booking.created_at,
        rideId: ride.id,
        status: "pending",
      });
    });

    // Add driver transactions
    transactions.driverBookings?.forEach((ride: any) => {
      const confirmedBookings = ride.bookings?.filter((b: any) => b.status === "confirmed") || [];
      confirmedBookings.forEach((booking: any) => {
        const passenger = booking.profiles as any;
        
        allTransactions.push({
          id: `${ride.id}-${booking.id}`,
          type: "owed",
          amount: ride.price || 0,
          description: `Ride from ${ride.origin}`,
          person: passenger?.full_name || "Passenger",
          date: booking.created_at,
          rideId: ride.id,
          status: "pending",
        });
      });
    });

    return allTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 10);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const recentTransactions = getRecentTransactions();

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-6 h-6 text-primary" />
          <h3 className="font-bold text-lg text-foreground">Wallet Balance</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">PKR {balance.totalOwe.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">You Owe</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">PKR {balance.totalOwed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Owed to You</p>
          </div>
        </div>

        <div className={`text-center p-4 rounded-lg ${
          balance.netBalance >= 0 ? "bg-green-100" : "bg-red-100"
        }`}>
          <p className={`text-lg font-bold ${
            balance.netBalance >= 0 ? "text-green-700" : "text-red-700"
          }`}>
            {balance.netBalance >= 0 ? "Net Positive" : "Net Negative"}
          </p>
          <p className={`text-2xl font-bold ${
            balance.netBalance >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            PKR {Math.abs(balance.netBalance).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-foreground">This Week</h4>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">You'll spend</span>
            <span className="font-semibold text-red-600">PKR {balance.weeklyOwe}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">You'll receive</span>
            <span className="font-semibold text-green-600">PKR {balance.weeklyOwed}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Weekly net</span>
            <span className={balance.weeklyOwed - balance.weeklyOwe >= 0 ? "text-green-600" : "text-red-600"}>
              PKR {Math.abs(balance.weeklyOwed - balance.weeklyOwe)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="font-semibold text-foreground mb-3">Recent Activity</h4>
        
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent transactions</p>
            <p className="text-sm">Start carpooling to see your activity!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === "owe" ? "bg-red-100" : "bg-green-100"
                  }`}>
                    {transaction.type === "owe" ? (
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.person} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.type === "owe" ? "text-red-600" : "text-green-600"
                  }`}>
                    {transaction.type === "owe" ? "-" : "+"}PKR {transaction.amount}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === "pending" 
                      ? "bg-yellow-100 text-yellow-700" 
                      : "bg-green-100 text-green-700"
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Reminder */}
      {balance.weeklyOwe > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-orange-800">Payment Reminder</h4>
          </div>
          <p className="text-sm text-orange-700">
            You owe PKR {balance.weeklyOwe} for this week's commute. 
            Please settle with your drivers to maintain good standing.
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletLedger;
