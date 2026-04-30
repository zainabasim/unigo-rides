import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Car, Bike, Phone, MessageCircle, Users, Clock, MapPin, X, Play, Trash2 } from 'lucide-react';
import { rideService } from '../lib/database';
import { RideStatus } from '@prisma/client';

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
  driver_name: string;
  driver_phone: string;
  driver_whatsapp: string;
  vehicle_type: 'car' | 'bike';
  vehicle_model: string;
  plate_number: string;
  pickup_location: string;
  destination: string;
  departure_time: string;
  price: number;
  seats: number;
  filled_seats: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  partners: RidePartner[];
  created_at: string;
}

export default function RideActive() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<RideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load ride data and check for expiration
  useEffect(() => {
    const loadRide = async () => {
      try {
        // Fetch from database
        const rideData = await rideService.getRideById(rideId);

        if (!rideData) {
          toast.error('Ride not found');
          navigate('/');
          return;
        }

        setRide(rideData);
      } catch (error) {
        console.error('Error loading ride:', error);
        toast.error('Failed to load ride');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      loadRide();
    }
  }, [rideId, navigate, currentTime]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Save ride to localStorage whenever it changes
  useEffect(() => {
    if (ride) {
      localStorage.setItem('activeRide', JSON.stringify(ride));
    }
  }, [ride]);

  const handleStartRide = async () => {
    if (!ride) return;

    try {
      const updatedRide = await rideService.updateRideStatus(ride.id, RideStatus.IN_PROGRESS);
      setRide(updatedRide);
      toast.success('Ride started! Partners have been notified.');
    } catch (error) {
      console.error('Error starting ride:', error);
      toast.error('Failed to start ride');
    }
  };

  const handleCancelRide = async () => {
    if (!ride) return;

    if (confirm('Are you sure you want to cancel this ride? This action cannot be undone.')) {
      try {
        const updatedRide = await rideService.updateRideStatus(ride.id, RideStatus.CANCELLED);
        setRide(updatedRide);
        localStorage.removeItem('activeRide');
        toast.success('Ride cancelled successfully');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error) {
        console.error('Error cancelling ride:', error);
        toast.error('Failed to cancel ride');
      }
    }
  };

  const makePhoneCall = (phone: string) => {
    window.location.href = `tel:+92${phone.substring(2)}`;
  };

  const sendWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(`Hi, I'm your UniGo partner. I'm at ${ride?.pickup_location}, are you nearby?`);
    window.open(`https://wa.me/92${phone.substring(2)}?text=${message}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'in_progress': return 'text-green-600 bg-green-50 border-green-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'expired': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Waiting for Partners';
      case 'in_progress': return 'Ride in Progress';
      case 'completed': return 'Ride Completed';
      case 'cancelled': return 'Ride Cancelled';
      case 'expired': return 'Ride Expired';
      default: return 'Unknown Status';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Ride not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = ride.status === 'expired';
  const isCancelled = ride.status === 'cancelled';
  const isCompleted = ride.status === 'completed';
  const canStart = ride.status === 'waiting' && !isExpired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
              <h1 className="text-xl font-semibold text-slate-900">Active Ride</h1>
            </div>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(ride.status)}`}>
              {getStatusText(ride.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Ride Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${ride.vehicle_type === 'car' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {ride.vehicle_type === 'car' ? (
                  <Car className={`w-6 h-6 ${ride.vehicle_type === 'car' ? 'text-blue-600' : 'text-green-600'}`} />
                ) : (
                  <Bike className={`w-6 h-6 ${ride.vehicle_type === 'car' ? 'text-blue-600' : 'text-green-600'}`} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{ride.vehicle_model}</h2>
                <p className="text-sm text-slate-600">{ride.plate_number}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">PKR {ride.price}</p>
              <p className="text-sm text-slate-600">per seat</p>
            </div>
          </div>

          {/* Route */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 mb-1">Pickup</p>
                <p className="font-medium text-slate-900">{ride.pickup_location}</p>
              </div>
            </div>
            <div className="border-l-2 border-dashed border-slate-300 ml-1 h-4"></div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 mb-1">Destination</p>
                <p className="font-medium text-slate-900">{ride.destination}</p>
              </div>
            </div>
          </div>

          {/* Time and Seats */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">{ride.departure_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">{ride.filled_seats}/{ride.seats} seats filled</span>
            </div>
          </div>
        </div>

        {/* Seats Visualization */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Seat Status</h3>
          <div className="flex gap-2">
            {Array.from({ length: ride.seats }).map((_, index) => (
              <div
                key={index}
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${
                  index < ride.filled_seats
                    ? 'bg-primary border-primary text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
                }`}
              >
                {index < ride.filled_seats ? (
                  <Users className="w-5 h-5" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-600 mt-3">
            {ride.seats - ride.filled_seats} seats available
          </p>
        </div>

        {/* Ride Partners */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Ride Partners</h3>
          
          {ride.partners.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No partners yet. Waiting for passengers to join...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ride.partners.map((partner) => (
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
