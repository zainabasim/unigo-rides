import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Car, Bike, Phone, MessageCircle, Users, Clock, MapPin, X, Play, Trash2 } from 'lucide-react';
import { rideService } from '../lib/database';

// Ride status enum for frontend - NO PRISMA IMPORTS
type RideStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'expired';

interface RidePartner {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  avatar?: string;
  joined_at: string;
}

interface RideData {
  id: string;
  driver_id: string;
  driver_name?: string;
  driver_phone?: string;
  origin: string;
  destination: string;
  area?: string;
  departure_time: string;
  price: number;
  fuel_price?: number;
  total_seats: number;
  available_seats: number;
  vehicle_model: string;
  plate_number: string;
  is_active: boolean;
  ride_status: string;
  created_at: string;
  vehicle_type?: string;
  // Computed properties
  filled_seats?: number;
  seats?: number;
  // Additional properties for compatibility
  driver?: {
    profile: {
      id: string;
      created_at: Date;
      updated_at: Date;
      full_name: string;
      department: string;
      avatar: string;
      user_id: string;
      phone_number: string;
    };
  };
  bookings?: RidePartner[];
}

export default function RideActive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<RideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        setLoading(true);
        let rideData = null;
        
        // First try to get from localStorage
        const storedRide = localStorage.getItem('activeRide');
        if (storedRide) {
          const parsedRide = JSON.parse(storedRide);
          if (parsedRide.id === id) {
            rideData = parsedRide;
          }
        }
        
        // If not found in localStorage, try database
        if (!rideData) {
          try {
            rideData = await rideService.getRide(id);
          } catch (dbError) {
            console.log('Database fetch failed, using localStorage fallback');
          }
        }
        
        // If still no ride data, create mock data for demo
        if (!rideData) {
          rideData = {
            id: id,
            driver_id: "4",
            driver_name: "Zainab Asim",
            driver_phone: "03456789012",
            origin: "Gulshan",
            destination: "NED University",
            departure_time: new Date().toISOString(),
            price: 150,
            total_seats: 4,
            available_seats: 3,
            vehicle_model: "Toyota Corolla",
            plate_number: "ABC-123",
            is_active: true,
            ride_status: "waiting",
            created_at: new Date().toISOString(),
            vehicle_type: "car"
          };
        }
        
        // Calculate missing properties for compatibility
        const processedRide = {
          ...rideData,
          filled_seats: rideData.total_seats - rideData.available_seats,
          seats: rideData.total_seats,
          status: rideData.ride_status,
          departure_time: new Date(rideData.departure_time),
          driver: {
            profile: {
              id: rideData.driver_id,
              created_at: new Date(),
              updated_at: new Date(),
              full_name: rideData.driver_name || 'Unknown Driver',
              department: 'Computer Science',
              avatar: '',
              user_id: rideData.driver_id,
              phone_number: rideData.driver_phone || ''
            }
          },
          bookings: []
        };
        setRide(processedRide);
      } catch (error) {
        console.error('Error fetching ride:', error);
        toast.error('Failed to load ride details');
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [id]);

  const handleStartRide = async () => {
    if (!ride) return;
    
    try {
      await rideService.updateRideStatus(ride.id, 'in_progress');
      setRide({ ...ride, status: 'in_progress' });
      toast.success('Ride started successfully!');
    } catch (error) {
      console.error('Error starting ride:', error);
      toast.error('Failed to start ride');
    }
  };

  const handleCancelRide = async () => {
    if (!ride) return;
    
    try {
      await rideService.updateRideStatus(ride.id, 'cancelled');
      setRide({ ...ride, status: 'cancelled' });
      toast.success('Ride cancelled successfully!');
      setTimeout(() => navigate('/home'), 2000);
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error('Failed to cancel ride');
    }
  };

  const makePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_blank');
  };

  const sendWhatsApp = (phone: string, name: string) => {
    const message = `Hi ${name}, I'm your ride partner for the trip from ${ride?.origin} to ${ride?.destination}.`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': 
      case 'waiting':
      case 'active': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'IN_PROGRESS': 
      case 'in_progress': return 'text-green-600 bg-green-50 border-green-200';
      case 'COMPLETED': 
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'CANCELLED': 
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'EXPIRED': 
      case 'expired': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'WAITING': 
      case 'waiting':
      case 'active': return 'Waiting for passengers';
      case 'IN_PROGRESS': 
      case 'in_progress': return 'Ride in progress';
      case 'COMPLETED': 
      case 'completed': return 'Completed';
      case 'CANCELLED': 
      case 'cancelled': return 'Cancelled';
      case 'EXPIRED': 
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Ride Not Found</h2>
          <p className="text-slate-600">The ride you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/home')}
            className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = ride.status === 'EXPIRED' || ride.status === 'expired';
  const isCancelled = ride.status === 'CANCELLED' || ride.status === 'cancelled';
  const isCompleted = ride.status === 'COMPLETED' || ride.status === 'completed';
  const canStart = (ride.status === 'WAITING' || ride.status === 'waiting' || ride.status === 'active') && !isExpired;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto">
        {/* Green Pill Banner */}
        <div className="bg-green-500 text-white px-4 py-3 rounded-full mx-auto mt-6 mb-6 text-center font-semibold">
          Ride Active: {ride.id} (In Progress)
        </div>

        {/* Driver Info Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
              {ride.driver.profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">{ride.driver.profile.full_name}</h3>
              <p className="text-sm text-gray-600">{ride.driver.profile.department}</p>
              <p className="text-sm text-gray-600">{ride.driver.profile.phone_number}</p>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-center gap-3 mb-4">
            {ride.vehicle_type === 'CAR' ? (
              <Car className="w-6 h-6 text-gray-600" />
            ) : (
              <Bike className="w-6 h-6 text-gray-600" />
            )}
            <div>
              <p className="font-medium text-gray-900">{ride.vehicle_model}</p>
              <p className="text-sm text-gray-600">{ride.plate_number}</p>
            </div>
          </div>

          {/* Route Info */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-600 mt-1" />
            <div>
              <p className="font-medium text-gray-900">{ride?.origin || 'N/A'}</p>
              <p className="text-sm text-gray-600">to</p>
              <p className="font-medium text-gray-900">{ride?.destination || 'N/A'}</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(ride.departure_time).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Communication Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => makeCall(ride.driver.profile.phone_number)}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Dial Number
          </button>
          <button
            onClick={() => sendWhatsApp(ride.driver.profile.phone_number, ride.driver.profile.full_name)}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
          </button>
        </div>

        {/* Seat Status */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seat Status</h3>
          <div className="flex gap-2 mb-4">
            {Array.from({ length: ride?.total_seats || 0 }).map((_, index) => (
              <div
                key={index}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                  index < (ride?.filled_seats || 0) ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                }`}
              >
                {index < (ride?.filled_seats || 0) ? (
                  <Users className="w-5 h-5" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{ride?.filled_seats || 0}/{ride?.total_seats || 0} seats filled</span>
            <span className="text-lg font-semibold text-green-600">
              PKR {ride.price}
            </span>
          </div>
        </div>

        {/* Finish Button */}
        <button
          onClick={async () => {
            try {
              // End the ride
              await rideService.updateRideStatus(ride.id, 'completed');
              toast.success('Ride completed successfully!');
              navigate('/home');
            } catch (error) {
              console.error('Error ending ride:', error);
              toast.error('Failed to end ride');
            }
          }}
          className="w-full bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors"
        >
          Arrived at NED (End Ride)
        </button>
      </div>
    </div>
  );
}
