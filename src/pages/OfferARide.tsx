import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChevronDown, Car, Bike, ArrowUpDown, MapPin } from "lucide-react";
import unigoIcon from "@/assets/unigo-icon.png";
import nedLogo from "@/assets/ned-logo.png";
import LocationSearch from "@/components/LocationSearch";
import MapPicker from "@/components/MapPicker";
import { calculateDistance, calculateRidePrice, formatPrice, FUEL_PRICES } from "@/utils/pricing";
import { ALL_LOCATIONS } from "@/constants/landmarks";

const OfferARide = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicleType, setVehicleType] = useState<"car" | "bike">("car");
  const [vehicleModel, setVehicleModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState("NED University");
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState("");
  
  // Set reasonable default price based on vehicle type
  useEffect(() => {
    const defaultPrice = vehicleType === "car" ? "150" : "80";
    setPrice(defaultPrice);
  }, [vehicleType]);
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);

  // Auto-set seats to 1 for bikes and calculate suggested price
  useEffect(() => {
    if (vehicleType === "bike") {
      setSeats(1);
    }
    calculateSuggestedPrice();
  }, [vehicleType, pickupCoords, destinationCoords]);

  // Swap pickup and destination
  const swapLocations = () => {
    const tempLocation = pickupLocation;
    const tempCoords = pickupCoords;
    setPickupLocation(destination);
    setPickupCoords(destinationCoords);
    setDestination(tempLocation);
    setDestinationCoords(tempCoords);
  };

  const calculateSuggestedPrice = () => {
    console.log('calculateSuggestedPrice called', { pickupCoords, destinationCoords, vehicleType });
    
    if (!pickupCoords || !destinationCoords) {
      console.log('Missing coordinates:', { pickupCoords, destinationCoords });
      return;
    }
    
    // Calculate actual distance between pickup and destination
    const distance = calculateDistance(pickupCoords, destinationCoords);
    console.log('Calculated distance:', distance);
    
    const pricing = calculateRidePrice(
      distance,
      vehicleType,
      'petrol' // Default fuel type
    );
    
    console.log('Calculated pricing:', pricing);
    const formattedPrice = formatPrice(pricing.suggestedPrice);
    console.log('Formatted price:', formattedPrice);
    
    setSuggestedPrice(formattedPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate that coordinates are available
    if (!pickupCoords || !destinationCoords) {
      toast.error("Please select both pickup and destination locations");
      return;
    }

    setLoading(true);
    
    const rideData = {
      driver_id: user.id,
      vehicle_type: vehicleType,
      vehicle_model: vehicleModel,
      plate_number: plateNumber,
      origin: pickupLocation,
      destination: destination,
      departure_time: departureTime,
      total_seats: seats,
      available_seats: seats,
      price: parseFloat(price) || 0,
      is_active: true, // Mark ride as active immediately
      is_recurring: isRecurring,
      recurring_days: recurringDays,
      recurring_time: departureTime,
    };

    const { data, error } = await supabase.from("rides").insert(rideData).select().single();

    setLoading(false);

    if (error) {
      toast.error("Failed to offer ride: " + error.message);
    } else {
      toast.success("Ride offered successfully with location data!");
      // Redirect to active ride page instead of homepage
      if (data?.id) {
        navigate(`/ride-active/${data.id}`);
      } else {
        navigate("/home");
      }
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/home")}>
          <img src={unigoIcon} alt="UniGo" className="w-8 h-8 object-contain" />
        </button>
        <span className="text-sm text-muted-foreground">Offer a Ride</span>
        <img src={nedLogo} alt="NED University" className="w-8 h-8 object-contain" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 mt-4 flex-1 flex flex-col">
        <h2 className="text-xl font-bold text-foreground mb-1">Share Your Ride</h2>
        <p className="text-muted-foreground text-sm mb-6">Help your colleagues commute to NED University</p>

        <div className="space-y-4 flex-1">
          {/* Vehicle Type Toggle */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Vehicle Type</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setVehicleType("car");
                  setSeats(2);
                }}
                className={`flex-1 h-12 rounded-xl border-2 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  vehicleType === "car"
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-slate-700 hover:border-primary/50"
                }`}
              >
                <Car className="w-4 h-4" />
                Car
              </button>
              <button
                type="button"
                onClick={() => {
                  setVehicleType("bike");
                  setSeats(1);
                }}
                className={`flex-1 h-12 rounded-xl border-2 font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  vehicleType === "bike"
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-background text-slate-700 hover:border-primary/50"
                }`}
              >
                <Bike className="w-4 h-4" />
                Bike
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder={vehicleType === "car" ? "Toyota Corolla 2020" : "Honda CD70"}
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            type="text"
            placeholder="ABC-123"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />

          {/* Pickup Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Pickup Location</label>
            <LocationSearch
              placeholder="Enter pickup location..."
              value={pickupLocation}
              onSelect={(location) => {
                console.log('Pickup location selected:', location);
                setPickupLocation(location.name);
                setPickupCoords({ lat: location.lat, lng: location.lng });
                console.log('Pickup coords set:', { lat: location.lat, lng: location.lng });
              }}
              suggestions={ALL_LOCATIONS}
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swapLocations}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Destination</label>
            <LocationSearch
              placeholder="Enter destination..."
              value={destination}
              onSelect={(location) => {
                console.log('Destination location selected:', location);
                setDestination(location.name);
                setDestinationCoords({ lat: location.lat, lng: location.lng });
                console.log('Destination coords set:', { lat: location.lat, lng: location.lng });
              }}
              suggestions={ALL_LOCATIONS}
            />
          </div>

          {/* Pickup Location Map */}
          {pickupCoords && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Pickup Location Map (Click to set pickup)</label>
              <MapPicker
                initialLocation={pickupCoords}
                onLocationSelect={async (location) => {
                  console.log('Pickup location updated from map:', location);
                  setPickupCoords(location);
                  
                  // Perform reverse geocoding to get location name
                  try {
                    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`;
                    const res = await fetch(reverseUrl);
                    
                    if (res.ok) {
                      const data = await res.json();
                      const locationName = data.display_name?.split(",").slice(0, 3).join(", ") || `Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
                      setPickupLocation(locationName);
                    } else {
                      // Fallback to coordinates if reverse geocoding fails
                      setPickupLocation(`Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
                    }
                  } catch (error) {
                    console.error('Reverse geocoding error:', error);
                    setPickupLocation(`Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
                  }
                }}
                height="200px"
              />
            </div>
          )}

          {/* Destination Location Map */}
          {destinationCoords && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Destination Location Map (Click to set destination)</label>
              <MapPicker
                initialLocation={destinationCoords}
                onLocationSelect={async (location) => {
                  console.log('Destination location updated from map:', location);
                  setDestinationCoords(location);
                  
                  // Perform reverse geocoding to get location name
                  try {
                    const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`;
                    const res = await fetch(reverseUrl);
                    
                    if (res.ok) {
                      const data = await res.json();
                      const locationName = data.display_name?.split(",").slice(0, 3).join(", ") || `Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
                      setDestination(locationName);
                    } else {
                      // Fallback to coordinates if reverse geocoding fails
                      setDestination(`Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
                    }
                  } catch (error) {
                    console.error('Reverse geocoding error:', error);
                    setDestination(`Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
                  }
                }}
                height="200px"
              />
            </div>
          )}

          <input
            type="text"
            placeholder="8:00 AM"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />

          <div className="space-y-2">
            <input
              type="number"
              placeholder="Set your fare for per seat"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ color: 'black !important' }}
              min="0"
              step="0.5"
              required
            />
            
            {suggestedPrice && (
              <div className="text-xs text-green-600 font-medium">
                Suggested: {suggestedPrice}
              </div>
            )}
          </div>

          {/* Recurring Ride Option */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">Recurring Ride</h3>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isRecurring 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                  isRecurring 
                    ? "bg-primary/20 border-primary" 
                    : "bg-background border-border"
                }`}>
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    isRecurring ? "translate-x-1" : "translate-x-0"
                  }`} />
                </div>
                <span className="text-sm font-medium">
                  {isRecurring ? "Enabled" : "Disabled"}
                </span>
              </button>
            </div>
          </div>

          {isRecurring && (
            <div className="rounded-xl border border-border bg-card p-4 mb-6">
              <h4 className="font-semibold text-white mb-3">Set Weekly Schedule</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Select Days
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setRecurringDays(prev => 
                            prev.includes(day) 
                              ? prev.filter(d => d !== day)
                              : [...prev, day]
                          );
                        }}
                        className={`p-3 rounded-lg border transition-colors ${
                          recurringDays.includes(day)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-sm">{day.slice(0, 3)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecurring(false);
                      toast.success("Recurring ride schedule saved!");
                    }}
                    className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    Save Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecurring(false);
                      setRecurringDays([]);
                      setDepartureTime("");
                    }}
                    className="flex-1 h-12 rounded-xl border-2 border-border bg-background text-foreground font-semibold text-sm hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Available Seats */}
          <div>
            <p className="text-sm font-medium text-white mb-2">
              Available Seats {vehicleType === "bike" && "(Fixed for bikes)"}
            </p>
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSeats(num)}
                  disabled={vehicleType === "bike"}
                  className={`w-12 h-12 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    seats === num
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-white hover:border-primary/50"
                  } ${
                    vehicleType === "bike" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            {vehicleType === "bike" && (
              <p className="text-xs text-gray-400 mt-2">
                Bikes can only accommodate 1 passenger
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 mt-6 mb-2"
        >
          {loading ? "Offering..." : "Offer Ride"}
        </button>

        <p className="text-xs text-muted-foreground text-center pb-6">
          Your ride will be visible to NED faculty members in your area
        </p>
      </form>
    </div>
  );
};

export default OfferARide;
