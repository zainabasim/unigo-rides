import { User, Ride } from "./mockData";
import { mockUsers, mockRides } from "./mockData";

// Mock session type
export type MockSession = {
  user: User | null;
  expires_at: string | null;
};

// Mock Supabase client interface
export interface MockSupabaseClient {
  auth: {
    signUp: (credentials: { email: string; password: string; options?: { data?: any } }) => Promise<{ data: { user: User } | null; error: any }>;
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data: { session: MockSession; user: User } | null; error: any }>;
    signOut: () => Promise<{ error: any }>;
    getSession: () => Promise<{ data: { session: MockSession } | null; error: any }>;
    onAuthStateChange: (callback: (event: string, session: MockSession | null) => void) => { data: { subscription: { unsubscribe: () => void } } };
  };
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: any) => {
        order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: any[]; error: any }>;
        single: () => Promise<{ data: any; error: any }>;
        limit: (count: number) => {
          order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: any[]; error: any }>;
        };
      };
    };
    insert: (data: any) => Promise<{ data: any; error: any }>;
    update: (data: any) => {
      eq: (column: string, value: any) => Promise<{ data: any; error: any }>;
    };
    delete: () => {
      eq: (column: string, value: any) => Promise<{ data: any; error: any }>;
    };
  };
  rpc: (functionName: string, params: any) => Promise<{ data: any; error: any }>;
}

// localStorage keys (session only - other data is shared globally)
const SESSION_KEY = "mock_session";

// Global shared storage (simulates database)
const getSharedStorage = () => {
  const storageKey = "unigo_shared_data";
  let sharedData = JSON.parse(localStorage.getItem(storageKey) || "{}");
  
  // Initialize shared data if not exists
  if (!sharedData.users) {
    sharedData.users = mockUsers;
  }
  if (!sharedData.profiles) {
    // Create profiles for existing users
    sharedData.profiles = mockUsers.map(user => ({
      id: user.id,
      user_id: user.id,
      full_name: user.full_name || user.email,
      email: user.email,
      department: "Computer Engineering",
      phone: user.phone || "",
      whatsapp: user.whatsapp || "",
      avatar_url: "",
      is_driver: user.user_role === "driver",
      rating: 4.5 + Math.random() * 0.5,
      total_rides: Math.floor(Math.random() * 50),
      created_at: user.created_at
    }));
  }
  if (!sharedData.rides) {
    sharedData.rides = mockRides;
  }
  if (!sharedData.bookings) {
    sharedData.bookings = [];
  }
  
  localStorage.setItem(storageKey, JSON.stringify(sharedData));
  return sharedData;
};

// Save shared storage
const saveSharedStorage = (sharedData: any) => {
  const storageKey = "unigo_shared_data";
  localStorage.setItem(storageKey, JSON.stringify(sharedData));
};

// Get data from shared storage
const getUsers = (): User[] => {
  const sharedData = getSharedStorage();
  return sharedData.users;
};

const getProfiles = (): any[] => {
  const sharedData = getSharedStorage();
  return sharedData.profiles;
};

const getRides = (): Ride[] => {
  const sharedData = getSharedStorage();
  return sharedData.rides;
};

const getBookings = (): any[] => {
  const sharedData = getSharedStorage();
  return sharedData.bookings;
};

// Save data to shared storage
const saveUsers = (users: User[]) => {
  const sharedData = getSharedStorage();
  sharedData.users = users;
  saveSharedStorage(sharedData);
};

const saveProfiles = (profiles: any[]) => {
  const sharedData = getSharedStorage();
  sharedData.profiles = profiles;
  saveSharedStorage(sharedData);
};

const saveRides = (rides: Ride[]) => {
  const sharedData = getSharedStorage();
  sharedData.rides = rides;
  saveSharedStorage(sharedData);
};

const saveBookings = (bookings: any[]) => {
  const sharedData = getSharedStorage();
  sharedData.bookings = bookings;
  saveSharedStorage(sharedData);
};

// Mock auth functions
const signUp = async ({ email, password, options }: { email: string; password: string; options?: { data?: any } }) => {
  const users = getUsers();
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    return { data: null, error: { message: "User already exists" } };
  }

  const newUser: User = {
    id: Date.now().toString(),
    email,
    full_name: options?.data?.full_name || "",
    phone: options?.data?.phone || "",
    whatsapp: options?.data?.whatsapp || "",
    user_role: options?.data?.user_role || "passenger",
    password,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Create profile for new user
  const profiles = getProfiles();
  const newProfile = {
    id: newUser.id,
    user_id: newUser.id,
    full_name: newUser.full_name,
    department: "Computer Science",
    designation: "Faculty Member",
    green_score: 0,
    total_rides: 0,
    created_at: newUser.created_at
  };
  profiles.push(newProfile);
  saveProfiles(profiles);

  // Create session
  const session: MockSession = {
    user: newUser,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  return { data: { user: newUser }, error: null };
};

const signInWithPassword = async ({ email, password }: { email: string; password: string }) => {
  console.log('🔐 signInWithPassword called:', { email, password });
  const users = getUsers();
  console.log('👥 Existing users:', users.map(u => u.email));
  let user = users.find(u => u.email === email);
  console.log('🔍 Found user:', user ? user.email : 'Not found');
  
  // For testing: Auto-create user if they have valid university email but don't exist
  if (!user) {
    // Check if email has valid university domain
    console.log('📧 Checking email domain:', email);
    if (email.endsWith("@neduet.edu.pk") || email.endsWith("@cloud.neduet.edu.pk")) {
      // Extract name from email for display purposes
      const namePart = email.split('@')[0];
      const formattedName = namePart.replace('.', ' ').replace(/_/g, ' ').split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const phoneNumber = "03" + Math.floor(Math.random() * 100000000).toString().padStart(9, '0');
      const whatsappNumber = "+92" + phoneNumber.substring(2);
      
      user = {
        id: Date.now().toString(),
        email,
        full_name: formattedName,
        phone: phoneNumber,
        whatsapp: whatsappNumber,
        password: "any", // Accept any password for testing
        created_at: new Date().toISOString(),
        user_role: "driver"
      };
      
      users.push(user);
      saveUsers(users);
      
      // Create profile for new user
      const profiles = getProfiles();
      const newProfile = {
        id: user.id,
        user_id: user.id,
        full_name: user.full_name,
        department: "Computer Science",
        designation: "Faculty Member",
        green_score: Math.floor(Math.random() * 100),
        total_rides: 0,
        created_at: user.created_at
      };
      profiles.push(newProfile);
      saveProfiles(profiles);
    } else {
      console.log('❌ Invalid email domain:', email);
      return { data: null, error: { message: "Invalid credentials" } };
    }
  }

  // For testing: Accept any password for university emails
  console.log('✅ Creating session for user:', user.email);
  const session: MockSession = {
    user,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  console.log('🎉 Login successful for:', user.email);
  
  // Trigger auth state change callback to update UI
  if (authStateChangeCallback) {
    console.log('🔄 Triggering auth state change callback');
    authStateChangeCallback("SIGNED_IN", session);
  }
  
  return { data: { session, user }, error: null };
};

const signOut = async () => {
  localStorage.removeItem(SESSION_KEY);
  return { error: null };
};

const getSession = async () => {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) {
    return { data: null, error: null };
  }

  const session: MockSession = JSON.parse(sessionData);
  
  // Check if session is expired
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    localStorage.removeItem(SESSION_KEY);
    return { data: null, error: null };
  }

  return { data: { session }, error: null };
};

// Mock database functions
const from = (table: string) => {
  const select = (columns?: string) => {
    const eq = (column: string, value: any) => {
      if (table === "profiles") {
        const profiles = getProfiles();
        const profile = profiles.find(p => p[column] === value);
        return {
          order: () => Promise.resolve({ data: profile ? [profile] : [], error: null }),
          single: () => Promise.resolve({ data: profile || null, error: null }),
          limit: (count: number) => ({
            order: () => Promise.resolve({ data: profile ? [profile] : [], error: null })
          })
        };
      }
      
      if (table === "rides") {
        const rides = getRides();
        const filteredRides = rides.filter(r => r[column as keyof Ride] === value);
        return {
          order: () => Promise.resolve({ data: filteredRides, error: null }),
          single: () => Promise.resolve({ data: filteredRides[0] || null, error: null }),
          limit: (count: number) => ({
            order: () => Promise.resolve({ data: filteredRides.slice(0, count), error: null })
          })
        };
      }

      if (table === "bookings") {
        const bookings = getBookings();
        const filteredBookings = bookings.filter((b: any) => b[column] === value);
        return {
          order: () => Promise.resolve({ data: filteredBookings, error: null }),
          single: () => Promise.resolve({ data: filteredBookings[0] || null, error: null }),
          limit: (count: number) => ({
            order: () => Promise.resolve({ data: filteredBookings.slice(0, count), error: null })
          })
        };
      }

      return {
        order: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        limit: (count: number) => ({
          order: () => Promise.resolve({ data: [], error: null })
        })
      };
    };
  };

  const insert = (data: any) => {
    if (table === "rides") {
      const rides = getRides();
      const newRide: Ride = {
        ...data,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        is_active: true,
        ride_status: "active",
      };
      rides.push(newRide);
      saveRides(rides);
      return { data: newRide, error: null };
    }

    if (table === "bookings") {
      const bookings = getBookings();
      const newBooking = {
        ...data,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        status: "confirmed",
      };
      bookings.push(newBooking);
      saveBookings(bookings);
      
      // Update available seats in ride
      const rides = getRides();
      const rideIndex = rides.findIndex(r => r.id === data.ride_id);
      if (rideIndex !== -1) {
        rides[rideIndex].available_seats -= 1;
        saveRides(rides);
      }
      
      return { data: newBooking, error: null };
    }

    return { data: null, error: { message: "Table not found" } };
  };

  const update = (data: any) => {
    const eq = (column: string, value: any) => {
      if (table === "profiles") {
        const profiles = getProfiles();
        const profileIndex = profiles.findIndex(p => p[column] === value);
        if (profileIndex !== -1) {
          profiles[profileIndex] = { ...profiles[profileIndex], ...data };
          saveProfiles(profiles);
          return { data: profiles[profileIndex], error: null };
        }
        return { data: null, error: { message: "Profile not found" } };
      }

      if (table === "rides") {
        const rides = getRides();
        const rideIndex = rides.findIndex(r => r[column as keyof Ride] === value);
        if (rideIndex !== -1) {
          rides[rideIndex] = { ...rides[rideIndex], ...data };
          saveRides(rides);
          return { data: rides[rideIndex], error: null };
        }
        return { data: null, error: { message: "Ride not found" } };
      }

      return { data: null, error: { message: "Table not found" } };
    };
    return { eq };
  };

  const deleteFunc = () => {
    const eq = (column: string, value: any) => {
      if (table === "rides") {
        const rides = getRides();
        const filteredRides = rides.filter(r => r[column as keyof Ride] !== value);
        saveRides(filteredRides);
        return { data: null, error: null };
      }

      if (table === "bookings") {
        const bookings = getBookings();
        const filteredBookings = bookings.filter((b: any) => b[column] !== value);
        saveBookings(filteredBookings);
        return { data: null, error: null };
      }

      return { data: null, error: { message: "Table not found" } };
    };
    return { eq };
  };

  return { select, insert, update, delete: deleteFunc };
};

const rpc = (functionName: string, params: any) => {
  if (functionName === "book_ride") {
    const bookings = getBookings();
    const rides = getRides();
    
    // Check if already booked
    const existingBooking = bookings.find((b: any) => 
      b.passenger_id === params.p_passenger_id && 
      b.ride_id === params.p_ride_id
    );
    
    if (existingBooking) {
      return { data: false, error: { message: "Already booked" } };
    }

    // Check if seats available
    const ride = rides.find(r => r.id === params.p_ride_id);
    if (!ride || ride.available_seats <= 0) {
      return { data: false, error: { message: "No seats available" } };
    }

    // Create booking
    const newBooking = {
      id: Date.now().toString(),
      passenger_id: params.p_passenger_id,
      ride_id: params.p_ride_id,
      status: "confirmed",
      created_at: new Date().toISOString(),
    };
    
    bookings.push(newBooking);
    saveBookings(bookings);

    // Update ride seats
    const rideIndex = rides.findIndex(r => r.id === params.p_ride_id);
    if (rideIndex !== -1) {
      rides[rideIndex].available_seats -= 1;
      saveRides(rides);
    }

    return Promise.resolve({ data: true, error: null });
  }

  return Promise.resolve({ data: null, error: { message: "Function not found" } });
};

// Auth state change listener
let authStateChangeCallback: ((event: string, session: MockSession | null) => void) | null = null;

const onAuthStateChange = (callback: (event: string, session: MockSession | null) => void) => {
  authStateChangeCallback = callback;
  
  // Check current session from localStorage
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      callback("SIGNED_IN", user);
    } else {
      callback("SIGNED_OUT", null);
    }
  } catch (error) {
    console.error('Error checking session:', error);
    callback("SIGNED_OUT", null);
  }

  return {
    data: {
      subscription: {
        unsubscribe: () => {
          authStateChangeCallback = null;
        }
      }
    }
  };
};

// Create mock Supabase client
export const mockSupabase: MockSupabaseClient = {
  auth: {
    signUp,
    signInWithPassword,
    signOut,
    getSession,
    onAuthStateChange,
  },
  from,
  rpc,
};

// Helper function to simulate auth state changes (for testing)
export const simulateAuthChange = (event: string, session: MockSession | null) => {
  if (authStateChangeCallback) {
    authStateChangeCallback(event, session);
  }
};
