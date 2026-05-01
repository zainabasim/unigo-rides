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
    // Convert frontend vehicle_type to Prisma enum
    const vehicleType = data.vehicle_type === "car" ? VehicleType.CAR : VehicleType.BIKE;
    
    return await prisma.ride.create({
      data: {
        ...data,
        vehicle_type: vehicleType,
        departure_time: new Date(data.departure_time),
        status: RideStatus.WAITING,
        is_active: true,
      },
      include: {
        driver: {
          include: {
            profile: true
          }
        },
        bookings: {
          include: {
            passenger: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })
  },

  // Get all available rides (for passengers to see)
  async getAvailableRides() {
    const currentTime = new Date()
    
    return await prisma.ride.findMany({
      where: {
        is_active: true,
        status: RideStatus.WAITING,
        available_seats: {
          gt: 0
        },
        // Filter out expired rides (15 minutes past departure time)
        departure_time: {
          gt: new Date(currentTime.getTime() - 15 * 60 * 1000)
        }
      },
      include: {
        driver: {
          include: {
            profile: true
          }
        },
        bookings: {
          include: {
            passenger: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: {
        departure_time: 'asc'
      }
    })
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
    // Use mock service instead of Prisma
    const { mockSupabase } = await import('../mock/mockService');
    
    try {
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
        .eq('id', rideId)
        .select('*')
        .single();
      
      const { data, error } = result;
      
      if (error || !data) {
        throw new Error(error?.message || 'Failed to update ride status');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating ride status:', error);
      throw error;
    }
  },

  // Update available seats (when someone joins/leaves)
  async updateAvailableSeats(rideId: string, seatsChange: number) {
    return await prisma.ride.update({
      where: { id: rideId },
      data: {
        available_seats: {
          increment: seatsChange
        }
      },
      include: {
        driver: {
          include: {
            profile: true
          }
        },
        bookings: {
          include: {
            passenger: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })
  },

  // Get rides for a specific driver
  async getDriverRides(driverId: string) {
    return await prisma.ride.findMany({
      where: { driver_id: driverId },
      include: {
        driver: {
          include: {
            profile: true
          }
        },
        bookings: {
          include: {
            passenger: {
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

  // Cancel ride
  async cancelRide(rideId: string) {
    return await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: RideStatus.CANCELLED,
        is_active: false
      },
      include: {
        driver: {
          include: {
            profile: true
          }
        },
        bookings: {
          include: {
            passenger: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })
  }
}

// User operations
export const userService = {
  // Create user
  async createUser(data: CreateUserData) {
    const user = await prisma.user.create({
      data: {
        ...data,
        user_role: data.user_role || UserRole.DRIVER
      }
    })

    // Create profile
    await prisma.profile.create({
      data: {
        user_id: user.id,
        full_name: data.full_name,
        department: data.department,
        phone_number: data.phone,
      }
    })

    return user
  },

  // Get user by email
  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    })
  },

  // Get user by ID
  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true
      }
    })
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
