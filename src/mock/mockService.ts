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

// localStorage keys
const SESSION_KEY = "mock_session";
const USERS_KEY = "mock_users";
const PROFILES_KEY = "mock_profiles";
const RIDES_KEY = "mock_rides";
const BOOKINGS_KEY = "mock_bookings";

// Initialize localStorage with mock data
const initializeLocalStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(PROFILES_KEY)) {
    // Create profiles for existing users
    const profiles = mockUsers.map(user => ({
      id: user.id,
      user_id: user.id,
      full_name: user.full_name,
      department: "Computer Science",
      designation: "Faculty Member",
      green_score: Math.floor(Math.random() * 100),
      total_rides: Math.floor(Math.random() * 50),
      created_at: user.created_at
    }));
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }
  if (!localStorage.getItem(RIDES_KEY)) {
    localStorage.setItem(RIDES_KEY, JSON.stringify(mockRides));
  }
  if (!localStorage.getItem(BOOKINGS_KEY)) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify([]));
  }
};

// Get data from localStorage
const getUsers = (): User[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
};

const getProfiles = (): any[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
};

const getRides = (): Ride[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem(RIDES_KEY) || "[]");
};

const getBookings = (): any[] => {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
};

// Save data to localStorage
const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const saveProfiles = (profiles: any[]) => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

const saveRides = (rides: Ride[]) => {
  localStorage.setItem(RIDES_KEY, JSON.stringify(rides));
};

const saveBookings = (bookings: any[]) => {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
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
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { data: null, error: { message: "Invalid credentials" } };
  }

  const session: MockSession = {
    user,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

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
          order: () => ({ data: profile ? [profile] : [], error: null }),
          single: () => ({ data: profile || null, error: null }),
          limit: (count: number) => ({
            order: () => ({ data: profile ? [profile] : [], error: null })
          })
        };
      }
      
      if (table === "rides") {
        const rides = getRides();
        const filteredRides = rides.filter(r => r[column as keyof Ride] === value);
        return {
          order: () => ({ data: filteredRides, error: null }),
          single: () => ({ data: filteredRides[0] || null, error: null }),
          limit: (count: number) => ({
            order: () => ({ data: filteredRides.slice(0, count), error: null })
          })
        };
      }

      if (table === "bookings") {
        const bookings = getBookings();
        const filteredBookings = bookings.filter((b: any) => b[column] === value);
        return {
          order: () => ({ data: filteredBookings, error: null }),
          single: () => ({ data: filteredBookings[0] || null, error: null }),
          limit: (count: number) => ({
            order: () => ({ data: filteredBookings.slice(0, count), error: null })
          })
        };
      }

      return {
        order: () => ({ data: [], error: null }),
        single: () => ({ data: null, error: null }),
        limit: (count: number) => ({
          order: () => ({ data: [], error: null })
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

    return { data: true, error: null };
  }

  return { data: null, error: { message: "Function not found" } };
};

// Auth state change listener
let authStateChangeCallback: ((event: string, session: MockSession | null) => void) | null = null;

const onAuthStateChange = (callback: (event: string, session: MockSession | null) => void) => {
  authStateChangeCallback = callback;
  
  // Check current session
  getSession().then(({ data }) => {
    if (data?.session) {
      callback("SIGNED_IN", data.session);
    } else {
      callback("SIGNED_OUT", null);
    }
  });

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
