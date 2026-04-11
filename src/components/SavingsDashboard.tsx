import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, TrendingUp, Car, DollarSign, Award } from "lucide-react";

// Karachi current petrol price (approximate, should be updated from API)
const KARACHI_PETROL_PRICE_PER_LITER = 305; // PKR
const AVG_FUEL_EFFICIENCY = 12; // km per liter
const CO2_PER_LITER = 2.31; // kg CO2 per liter of petrol

interface SavingsData {
  totalRides: number;
  totalDistance: number;
  fuelSaved: number;
  costSaved: number;
  co2Saved: number;
  greenScore: number;
  weeklySavings: number;
  monthlySavings: number;
}

const SavingsDashboard = () => {
  const { user } = useAuth();
  const [savingsData, setSavingsData] = useState<SavingsData>({
    totalRides: 0,
    totalDistance: 0,
    fuelSaved: 0,
    costSaved: 0,
    co2Saved: 0,
    greenScore: 0,
    weeklySavings: 0,
    monthlySavings: 0,
  });

  const { data: userRides = { driverRides: [], passengerRides: [] } } = useQuery({
    queryKey: ["user-rides-savings", user?.id],
    queryFn: async () => {
      if (!user?.id) return { driverRides: [], passengerRides: [] };
      
      // Get rides as driver
      const { data: driverRides } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", user.id)
        .eq("is_active", true);

      // Get rides as passenger
      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          rides!inner (
            *,
            bookings (
              id,
              passenger_id,
              status
            )
          )
        `)
        .eq("passenger_id", user.id)
        .eq("status", "confirmed");

      return { driverRides: driverRides || [], passengerRides: bookings || [] };
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userRides.driverRides || userRides.passengerRides) {
      const calculations = calculateSavings(userRides);
      setSavingsData(calculations);
    }
  }, [userRides]);

  const calculateSavings = (rides: any): SavingsData => {
    const driverRides = rides.driverRides || [];
    const passengerRides = rides.passengerRides || [];
    
    // Calculate estimated distances (simplified - in real app, use actual route distances)
    const avgDistancePerRide = 15; // km average for Karachi to NED
    const totalDriverRides = driverRides.reduce((sum: number, ride: any) => {
      const passengers = ride.bookings?.filter((b: any) => b.status === "confirmed") || [];
      return sum + passengers.length;
    }, 0);
    
    const totalPassengerRides = passengerRides.length;
    const totalSharedRides = totalDriverRides + totalPassengerRides;
    
    // Calculate savings
    const totalDistance = totalSharedRides * avgDistancePerRide;
    const fuelSaved = totalDistance / AVG_FUEL_EFFICIENCY;
    const costSaved = fuelSaved * KARACHI_PETROL_PRICE_PER_LITER;
    const co2Saved = fuelSaved * CO2_PER_LITER;
    
    // Calculate green score (0-100)
    const greenScore = Math.min(100, Math.round((totalSharedRides * 5) + (co2Saved * 2)));
    
    // Calculate time-based savings
    const weeklySavings = (costSaved / 30) * 7; // Assuming 30-day month
    const monthlySavings = costSaved;

    return {
      totalRides: totalSharedRides,
      totalDistance,
      fuelSaved,
      costSaved,
      co2Saved,
      greenScore,
      weeklySavings,
      monthlySavings,
    };
  };

  const getGreenScoreLevel = (score: number) => {
    if (score >= 80) return { level: "Eco Champion", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { level: "Green Commuter", color: "text-emerald-600", bg: "bg-emerald-100" };
    if (score >= 40) return { level: "Environment Aware", color: "text-lime-600", bg: "bg-lime-100" };
    if (score >= 20) return { level: "Rising Star", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "Getting Started", color: "text-orange-600", bg: "bg-orange-100" };
  };

  const greenScoreInfo = getGreenScoreLevel(savingsData.greenScore);

  return (
    <div className="space-y-6">
      {/* Green Score Badge */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <Award className={`w-6 h-6 ${greenScoreInfo.color}`} />
          <h3 className="font-bold text-lg text-foreground">Your Green Score</h3>
        </div>
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${greenScoreInfo.bg} mb-3`}>
          <span className={`text-3xl font-bold ${greenScoreInfo.color}`}>{savingsData.greenScore}</span>
        </div>
        <p className={`font-semibold ${greenScoreInfo.color}`}>{greenScoreInfo.level}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Keep carpooling to increase your environmental impact!
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Total Savings</h4>
          </div>
          <p className="text-2xl font-bold text-primary">PKR {savingsData.costSaved.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">All time</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Rides Shared</h4>
          </div>
          <p className="text-2xl font-bold text-primary">{savingsData.totalRides}</p>
          <p className="text-xs text-muted-foreground">As driver + passenger</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-foreground">CO₂ Saved</h4>
          </div>
          <p className="text-2xl font-bold text-green-600">{savingsData.co2Saved.toFixed(1)} kg</p>
          <p className="text-xs text-muted-foreground">Environmental impact</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-foreground">Monthly Savings</h4>
          </div>
          <p className="text-2xl font-bold text-primary">PKR {savingsData.monthlySavings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold text-foreground mb-4">Impact Breakdown</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Distance Shared</span>
            <span className="font-semibold text-foreground">{savingsData.totalDistance.toFixed(1)} km</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Fuel Saved</span>
            <span className="font-semibold text-foreground">{savingsData.fuelSaved.toFixed(2)} liters</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Cost per Liter (Karachi)</span>
            <span className="font-semibold text-foreground">PKR {KARACHI_PETROL_PRICE_PER_LITER}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Weekly Average Savings</span>
            <span className="font-semibold text-primary">PKR {savingsData.weeklySavings.toLocaleString()}</span>
          </div>
          
          <div className="border-t border-border pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Equivalent Trees Planted</span>
              <span className="font-semibold text-green-600">
                {Math.round(savingsData.co2Saved / 21)} trees 🌱
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact Visual */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-bold text-foreground mb-4">Your Environmental Impact</h3>
        
        <div className="relative">
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
              style={{ width: `${Math.min(100, savingsData.greenScore)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">0</span>
            <span className="text-xs text-muted-foreground">25</span>
            <span className="text-xs text-muted-foreground">50</span>
            <span className="text-xs text-muted-foreground">75</span>
            <span className="text-xs text-muted-foreground">100</span>
          </div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          You're in the top {Math.max(0, 100 - savingsData.greenScore)}% of eco-friendly commuters at NED!
        </p>
      </div>
    </div>
  );
};

export default SavingsDashboard;
