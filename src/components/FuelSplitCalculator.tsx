import { useState, useEffect } from "react";
import { Calculator, Users, Fuel, TrendingUp, Info } from "lucide-react";

// Karachi current petrol price (should be updated from API)
const KARACHI_PETROL_PRICE_PER_LITER = 305; // PKR
const AVG_FUEL_EFFICIENCY = 12; // km per liter
const MAINTENANCE_COST_PER_KM = 2; // PKR per km for maintenance

interface SplitCalculation {
  totalDistance: number;
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
  costPerPerson: number;
  suggestedContribution: number;
  savingsPerPerson: number;
}

interface FuelSplitCalculatorProps {
  distance?: number;
  passengers?: number;
  onContributionChange?: (amount: number) => void;
  showDetailed?: boolean;
}

const FuelSplitCalculator = ({ 
  distance = 15, 
  passengers = 2, 
  onContributionChange,
  showDetailed = false 
}: FuelSplitCalculatorProps) => {
  const [calculation, setCalculation] = useState<SplitCalculation>({
    totalDistance: distance,
    fuelCost: 0,
    maintenanceCost: 0,
    totalCost: 0,
    costPerPerson: 0,
    suggestedContribution: 0,
    savingsPerPerson: 0,
  });

  const [customContribution, setCustomContribution] = useState<number>(0);

  useEffect(() => {
    const fuelNeeded = distance / AVG_FUEL_EFFICIENCY;
    const fuelCost = fuelNeeded * KARACHI_PETROL_PRICE_PER_LITER;
    const maintenanceCost = distance * MAINTENANCE_COST_PER_KM;
    const totalCost = fuelCost + maintenanceCost;
    
    // Calculate fair split
    const costPerPerson = totalCost / (passengers + 1); // +1 for driver
    const suggestedContribution = Math.ceil(costPerPerson / 10) * 10; // Round to nearest 10
    
    // Calculate individual savings (what they'd pay if traveling alone)
    const individualCost = fuelCost + maintenanceCost;
    const savingsPerPerson = individualCost - costPerPerson;

    setCalculation({
      totalDistance: distance,
      fuelCost,
      maintenanceCost,
      totalCost,
      costPerPerson,
      suggestedContribution,
      savingsPerPerson,
    });

    setCustomContribution(suggestedContribution);
  }, [distance, passengers]);

  const handleContributionChange = (amount: number) => {
    setCustomContribution(amount);
    onContributionChange?.(amount);
  };

  const getContributionLevel = (amount: number) => {
    const percentage = (amount / calculation.suggestedContribution) * 100;
    
    if (percentage >= 120) return { level: "Generous", color: "text-green-600", bg: "bg-green-100" };
    if (percentage >= 100) return { level: "Fair", color: "text-blue-600", bg: "bg-blue-100" };
    if (percentage >= 80) return { level: "Acceptable", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "Low", color: "text-orange-600", bg: "bg-orange-100" };
  };

  const contributionInfo = getContributionLevel(customContribution);

  return (
    <div className="space-y-4">
      {/* Quick Summary */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Fuel Split Calculator
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            Fair split
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">PKR {calculation.suggestedContribution}</p>
            <p className="text-xs text-muted-foreground">Suggested per person</p>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">PKR {calculation.savingsPerPerson}</p>
            <p className="text-xs text-muted-foreground">You save</p>
          </div>
        </div>
      </div>

      {/* Contribution Input */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Your Contribution
        </label>
        
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={customContribution}
            onChange={(e) => handleContributionChange(Number(e.target.value))}
            className="flex-1 h-12 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            min="0"
            step="10"
          />
          
          <div className={`px-3 py-2 rounded-lg text-sm font-medium ${contributionInfo.bg} ${contributionInfo.color}`}>
            {contributionInfo.level}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">PKR {customContribution} per person</span>
          <span className="text-xs text-muted-foreground">
            {passengers + 1} people sharing
          </span>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[50, 100, 150, 200].map((amount) => (
          <button
            key={amount}
            onClick={() => handleContributionChange(amount)}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              customContribution === amount
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            PKR {amount}
          </button>
        ))}
      </div>

      {showDetailed && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Fuel className="w-4 h-4 text-primary" />
            Cost Breakdown
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance</span>
              <span className="font-medium">{calculation.totalDistance} km</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuel Needed</span>
              <span className="font-medium">
                {(calculation.totalDistance / AVG_FUEL_EFFICIENCY).toFixed(2)} liters
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuel Cost</span>
              <span className="font-medium">PKR {calculation.fuelCost}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maintenance</span>
              <span className="font-medium">PKR {calculation.maintenanceCost}</span>
            </div>
            
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total Cost</span>
                <span className="text-primary">PKR {calculation.totalCost}</span>
              </div>
            </div>
            
            <div className="flex justify-between mt-2">
              <span className="text-muted-foreground">Cost per person</span>
              <span className="font-medium">PKR {calculation.costPerPerson.toFixed(1)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Individual cost (solo)</span>
              <span className="font-medium line-through text-muted-foreground">
                PKR {calculation.fuelCost + calculation.maintenanceCost}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rate Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Current rates (Karachi)</span>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Petrol: PKR {KARACHI_PETROL_PRICE_PER_LITER}/L
            </span>
            <span className="text-muted-foreground">
              Maintenance: PKR {MAINTENANCE_COST_PER_KM}/km
            </span>
          </div>
        </div>
      </div>

      {/* Savings Comparison */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-accent/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground">Your Weekly Savings</h4>
        </div>
        
        <div className="text-center">
          <p className="text-3xl font-bold text-primary">
            PKR {(calculation.savingsPerPerson * 5).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            If you carpool 5 days a week
          </p>
        </div>
      </div>
    </div>
  );
};

export default FuelSplitCalculator;
