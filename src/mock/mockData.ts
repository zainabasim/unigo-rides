import { Database } from "@/integrations/supabase/types";

export type User = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  password: string;
  created_at: string;
};

export type Ride = Database["public"]["Tables"]["rides"]["Row"] & {
  driver_name?: string;
  driver_phone?: string;
  vehicle_type?: "car" | "bike";
};

export const mockUsers: User[] = [
  {
    id: "1",
    email: "ali.khan@cloud.neduet.edu.pk",
    full_name: "Ali Khan",
    phone: "03123456789",
    password: "password123",
    created_at: new Date().toISOString(),
  },
  {
    id: "2", 
    email: "sara.ahmed@cloud.neduet.edu.pk",
    full_name: "Sara Ahmed",
    phone: "03234567890",
    password: "password123",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    email: "umar.farooq@cloud.neduet.edu.pk", 
    full_name: "Umar Farooq",
    phone: "03345678901",
    password: "password123",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    email: "zainab@cloud.neduet.edu.pk", 
    full_name: "Zainab Asim",
    phone: "03456789012",
    password: "password123",
    created_at: new Date().toISOString(),
  },
];

export const mockRides: Ride[] = [
  {
    id: "1",
    driver_id: "1",
    driver_name: "Ali Khan",
    driver_phone: "03123456789",
    origin: "NED University",
    destination: "Gulshan-e-Iqbal",
    area: "Gulshan",
    departure_time: "08:30 AM",
    price: 150,
    total_seats: 4,
    available_seats: 2,
    vehicle_model: "Toyota Corolla",
    plate_number: "ABC-123",
    is_active: true,
    ride_status: "active",
    created_at: new Date().toISOString(),
    vehicle_type: "car",
  },
  {
    id: "2",
    driver_id: "2",
    driver_name: "Sara Ahmed", 
    driver_phone: "03234567890",
    origin: "University of Karachi",
    destination: "Defence DHA",
    area: "DHA",
    departure_time: "09:15 AM",
    price: 200,
    total_seats: 1,
    available_seats: 1,
    vehicle_model: "Honda CD70",
    plate_number: "XYZ-789",
    is_active: true,
    ride_status: "active",
    created_at: new Date().toISOString(),
    vehicle_type: "bike",
  },
  {
    id: "3",
    driver_id: "3",
    driver_name: "Umar Farooq",
    driver_phone: "03345678901", 
    origin: "Institute of Business Administration",
    destination: "Clifton",
    area: "Clifton",
    departure_time: "05:45 PM",
    price: 180,
    total_seats: 3,
    available_seats: 1,
    vehicle_model: "Suzuki Cultus",
    plate_number: "DEF-456",
    is_active: true,
    ride_status: "active",
    created_at: new Date().toISOString(),
    vehicle_type: "car",
  },
  {
    id: "4",
    driver_id: "1",
    driver_name: "Ali Khan",
    driver_phone: "03123456789",
    origin: "North Nazimabad",
    destination: "NED University",
    area: "North Nazimabad",
    departure_time: "07:30 AM",
    price: 120,
    total_seats: 1,
    available_seats: 1,
    vehicle_model: "Yamaha YBR",
    plate_number: "GHI-101",
    is_active: true,
    ride_status: "active",
    created_at: new Date().toISOString(),
    vehicle_type: "bike",
  },
];
