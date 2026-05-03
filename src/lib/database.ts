// Database service using mock implementation

export interface CreateRideData {
  driver_id: string
  vehicle_type: string // Accept both "car" and "CAR" from frontend
  vehicle_model: string
  plate_number: string
  origin: string
  destination: string
  origin_lat?: number
  origin_lng?: number
  destination_lat?: number
  destination_lng?: number
  departure_time: Date
  total_seats: number
  available_seats: number
  price: number
  is_recurring?: boolean
  recurring_days?: string[]
  recurring_time?: string
}

export interface CreateUserData {
  email: string
  full_name: string
  phone: string
  whatsapp: string
  password: string
  user_role?: string
  department?: string
}

export interface CreateBookingData {
  ride_id: string
  passenger_id: string
  pickup_time?: Date
}

// Ride operations
export const rideService = {
  // Create a new ride
  async createRide(data: CreateRideData) {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      const rideData = {
        driver_id: data.driver_id,
        vehicle_type: data.vehicle_type,
        vehicle_model: data.vehicle_model,
        plate_number: data.plate_number,
        origin: data.origin,
        destination: data.destination,
        origin_lat: data.origin_lat,
        origin_lng: data.origin_lng,
        destination_lat: data.destination_lat,
        destination_lng: data.destination_lng,
        departure_time: data.departure_time.toISOString(),
        total_seats: data.total_seats,
        available_seats: data.available_seats,
        price: data.price,
        is_active: true,
        ride_status: 'active',
        created_at: new Date().toISOString()
      };

      const result = await mockSupabase
        .from('rides')
        .insert(rideData);
      
      const { data: insertedData, error } = result;
      
      if (error || !insertedData) {
        throw new Error(error?.message || 'Failed to create ride');
      }
      
      return insertedData;
    } catch (error) {
      console.error('Error creating ride:', error);
      throw error;
    }
  },

  // Get all available rides (for passengers to see)
  async getAvailableRides() {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      const result = await mockSupabase
        .from('rides')
        .select('*')
        .eq('is_active', true)
        .eq('ride_status', 'active')
        .order('created_at', { ascending: true });
      
      const { data, error } = result;
      
      if (error) {
        throw new Error(error?.message || 'Failed to fetch available rides');
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching available rides:', error);
      throw error;
    }
  },

  // Get ride by ID
  async getRide(rideId: string) {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      const result = await mockSupabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();
      
      const { data, error } = result;
      
      if (error || !data) {
        throw new Error(error?.message || 'Ride not found');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching ride:', error);
      throw error;
    }
  },

  // Get ride by ID (alias for backward compatibility)
  async getRideById(rideId: string) {
    return this.getRide(rideId);
  },

  // Update ride status
  async updateRideStatus(rideId: string, status: string) {
    try {
      // First try localStorage for immediate response
      const storedRide = localStorage.getItem('activeRide');
      if (storedRide) {
        const ride = JSON.parse(storedRide);
        if (ride.id === rideId) {
          // Update ride status
          ride.ride_status = status;
          ride.is_active = false;
          
          // Save back to localStorage
          localStorage.setItem('activeRide', JSON.stringify(ride));
          
          // Show success toast
          console.log('Ride status updated in localStorage:', status);
          return ride;
        }
      }
      
      // Fallback to mock service
      const { mockSupabase } = await import('../mock/mockService');
      
      const updateData: any = { ride_status: status }
      
      // If starting ride, mark as inactive in search results
      if (status === 'in_progress' || status === 'IN_PROGRESS') {
        updateData.is_active = false
      }
      
      // If cancelling or completing, mark as inactive
      if (status === 'cancelled' || status === 'CANCELLED' || 
          status === 'completed' || status === 'COMPLETED') {
        updateData.is_active = false
      }

      const result = await mockSupabase
        .from('rides')
        .update(updateData)
        .eq('id', rideId);
      
      const { data, error } = result;
      
      if (error || !data) {
        // If mock service fails, return mock success for demo
        console.log('Mock service update failed, returning mock success');
        return { id: rideId, ride_status: status, is_active: false };
      }
      
      return data;
    } catch (error) {
      console.error('Error updating ride status:', error);
      // Return mock success for demo purposes
      return { id: rideId, ride_status: status, is_active: false };
    }
  },

  // Update available seats (when someone joins/leaves)
  async updateAvailableSeats(rideId: string, seatsChange: number) {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      // First get current ride data
      const getResult = await mockSupabase
        .from('rides')
        .select('available_seats')
        .eq('id', rideId)
        .single();
      
      if (getResult.error) {
        throw new Error(getResult.error.message);
      }
      
      const currentSeats = getResult.data.available_seats;
      const newSeats = Math.max(0, currentSeats + seatsChange);
      
      // Update with new seat count
      const result = await mockSupabase
        .from('rides')
        .update({ available_seats: newSeats })
        .eq('id', rideId);
      
      const { data, error } = result;
      
      if (error || !data) {
        throw new Error(error?.message || 'Failed to update available seats');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating available seats:', error);
      throw error;
    }
  },

  // Get rides for a specific driver
  async getDriverRides(driverId: string) {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      const result = await mockSupabase
        .from('rides')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });
      
      const { data, error } = result;
      
      if (error) {
        throw new Error(error?.message || 'Failed to fetch driver rides');
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching driver rides:', error);
      throw error;
    }
  },

  // Cancel ride
  async cancelRide(rideId: string) {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      const result = await mockSupabase
        .from('rides')
        .update({ 
          ride_status: 'cancelled',
          is_active: false 
        })
        .eq('id', rideId);
      
      const { data, error } = result;
      
      if (error || !data) {
        throw new Error(error?.message || 'Failed to cancel ride');
      }
      
      return data;
    } catch (error) {
      console.error('Error cancelling ride:', error);
      throw error;
    }
  },
}

// User operations
export const userService = {
  // Create user
  async createUser(data: CreateUserData) {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      const userData = {
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        whatsapp: data.whatsapp,
        password: data.password,
        user_role: data.user_role || "driver",
        created_at: new Date().toISOString()
      };

      const result = await mockSupabase
        .from('users')
        .insert(userData);
      
      const { data: insertedUser, error } = result;
      
      if (error || !insertedUser) {
        throw new Error(error?.message || 'Failed to create user');
      }
      
      return insertedUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email: string) {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      const result = await mockSupabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      const { data, error } = result;
      
      if (error) {
        throw new Error(error?.message || 'Failed to fetch user by email');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUserById(userId: string) {
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
      const result = await mockSupabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error } = result;
      
      if (error) {
        throw new Error(error?.message || 'Failed to fetch user by ID');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }
}

// Booking operations
export const bookingService = {
  // Create booking
  async createBooking(data: CreateBookingData) {
    return await prisma.booking.create({
      data: {
        ...data,
        pickup_time: data.pickup_time ? new Date(data.pickup_time) : undefined
      },
      include: {
        ride: {
          include: {
            driver: {
              include: {
                profile: true
              }
            }
          }
        },
        passenger: {
          include: {
            profile: true
          }
        }
      }
    })
  },

  // Get bookings for a user
  async getUserBookings(userId: string) {
    return await prisma.booking.findMany({
      where: { passenger_id: userId },
      include: {
        ride: {
          include: {
            driver: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  },

  // Get bookings for a ride
  async getRideBookings(rideId: string) {
    return await prisma.booking.findMany({
      where: { ride_id: rideId },
      include: {
        passenger: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    })
  }
}
