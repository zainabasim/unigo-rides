// Pricing calculation utilities

export interface FuelPrices {
  petrol: number;
  diesel: number;
  cng: number;
}

export interface PricingCalculation {
  basePrice: number;
  fuelCost: number;
  totalPrice: number;
  suggestedPrice: number;
}

// Current fuel prices in Pakistan (approximate)
export const FUEL_PRICES: FuelPrices = {
  petrol: 280, // PKR per liter
  diesel: 300,  // PKR per liter
  cng: 200,  // PKR per kg
};

// Average fuel consumption rates (km per liter)
export const FUEL_EFFICIENCY = {
  car: 0.08,  // 8 km per liter
  bike: 0.03,  // 33 km per liter
};

// Calculate distance between two coordinates
export const calculateDistance = (
  originCoords: { lat: number; lng: number },
  destinationCoords: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (destinationCoords.lat - originCoords.lat) * Math.PI / 180;
  const dLng = (destinationCoords.lng - originCoords.lng) * Math.PI / 180;
  
  const lat1 = originCoords.lat * Math.PI / 180;
  const lat2 = destinationCoords.lat * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2);
  const b = Math.cos(lat1) * Math.cos(lat2);
  const c = Math.sin(dLat/2) * Math.sin(dLat/2) + b * b * Math.cos(dLng);
  
  const angleC = Math.acos(c);
  const distance = R * angleC;

  return Math.round(distance * 100) / 100; // Convert to km and round
};

// Calculate fuel cost based on vehicle type and distance
export const calculateFuelCost = (
  distance: number,
  vehicleType: 'car' | 'bike',
  fuelType: 'petrol' | 'diesel' | 'cng' = 'petrol'
): number => {
  const efficiency = FUEL_EFFICIENCY[vehicleType];
  const fuelPrice = FUEL_PRICES[fuelType];
  const fuelNeeded = (distance / 1000) * efficiency; // liters needed
  
  return Math.round(fuelNeeded * fuelPrice);
};

// Calculate total ride cost with Yango-style dynamic pricing
export const calculateRidePrice = (
  distance: number,
  vehicleType: 'car' | 'bike',
  fuelType: 'petrol' | 'diesel' | 'cng' = 'petrol'
): PricingCalculation => {
  // Base Price: 50 PKR
  let totalPrice = 50;
  
  // Vehicle Multiplier: Add 20 PKR if Car, 0 PKR if Bike
  if (vehicleType === 'car') {
    totalPrice += 20;
  }
  
  // Distance Factor: Add random variation between 10-100 PKR to simulate different distances from campus
  const distanceFactor = Math.floor(Math.random() * 91) + 10; // Random between 10-100
  totalPrice += distanceFactor;
  
  // Add 20% commission for platform
  const commission = totalPrice * 0.2;
  totalPrice += commission;

  return {
    basePrice: 50 + (vehicleType === 'car' ? 20 : 0),
    fuelCost: distanceFactor,
    totalPrice: Math.round(totalPrice),
    suggestedPrice: Math.round(totalPrice) // Direct price without extra margin
  };
};

// Format price display
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  }).format(amount);
};
