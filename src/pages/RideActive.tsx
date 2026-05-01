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
        const rideData = await rideService.getRide(id);
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>

        {/* Ride Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Active Ride</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ride.status)}`}>
              {getStatusText(ride.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driver Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {ride.driver.profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{ride.driver.profile.full_name}</h3>
                  <p className="text-sm text-slate-600">{ride.driver.profile.department}</p>
                  <p className="text-sm text-slate-600">{ride.driver.profile.phone_number}</p>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {ride.vehicle_type === 'CAR' ? (
                  <Car className="w-8 h-8 text-primary" />
                ) : (
                  <Bike className="w-8 h-8 text-primary" />
                )}
                <div>
                  <p className="font-medium text-slate-900">{ride.vehicle_model}</p>
                  <p className="text-sm text-slate-600">{ride.plate_number}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Route Info */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">{ride?.origin || 'N/A'} - {ride?.destination || 'N/A'}</p>
                <p className="text-sm text-slate-600">
                  {ride.departure_time}
                </p>
              </div>
            </div>
          </div>

          {/* Price and Seats */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">{ride?.filled_seats || 0}/{ride?.total_seats || 0} seats filled</span>
            </div>
            <div className="text-lg font-semibold text-primary">
              ${ride.price}
            </div>
          </div>
        </div>

        {/* Seats Visualization */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Seat Status</h3>
          <div className="flex gap-2">
            {Array.from({ length: ride?.total_seats || 0 }).map((_, index) => (
              <div
                key={index}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                  index < (ride?.filled_seats || 0) ? 'bg-primary border-primary text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
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
          <p className="text-sm text-slate-600 mt-3">
            {(ride?.total_seats || 0) - (ride?.available_seats || 0)} seats available
          </p>
        </div>

        {/* Ride Partners */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Ride Partners</h3>
          
          {ride?.bookings?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No partners yet. Waiting for passengers to join...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ride?.bookings?.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
                      {partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{partner.name}</p>
                      <p className="text-sm text-slate-600">Joined {new Date(partner.joined_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => makePhoneCall(partner.phone)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => sendWhatsApp(partner.phone, partner.name)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {canStart && (
            <button
              onClick={handleStartRide}
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Ride
            </button>
          )}
          
          {!isExpired && !isCancelled && !isCompleted && (
            <button
              onClick={handleCancelRide}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Cancel Ride
            </button>
          )}
        </div>

        {/* Status Messages */}
        {isExpired && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-700 text-center">
              This ride has expired as it was more than 15 minutes past the departure time.
            </p>
          </div>
        )}

        {isCancelled && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-center">
              This ride has been cancelled.
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-center">
              This ride has been completed successfully.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
