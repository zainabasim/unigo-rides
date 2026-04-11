# UniGo Database Schema Updates

This document outlines the required database schema changes to support the new UniGo features.

## New Tables to Add

### 1. `ride_messages` Table
For in-app route chat functionality:

```sql
CREATE TABLE ride_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'location', 'time')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT ride_messages_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES rides(id),
  CONSTRAINT ride_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(user_id)
);
```

### 2. `user_savings` Table
For tracking user environmental impact and savings:

```sql
CREATE TABLE user_savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  total_rides INTEGER DEFAULT 0,
  total_distance DECIMAL(10,2) DEFAULT 0,
  fuel_saved DECIMAL(10,2) DEFAULT 0,
  cost_saved DECIMAL(10,2) DEFAULT 0,
  co2_saved DECIMAL(10,2) DEFAULT 0,
  green_score INTEGER DEFAULT 0,
  weekly_savings DECIMAL(10,2) DEFAULT 0,
  monthly_savings DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT user_savings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id)
);
```

### 3. `quick_routes` Table
For user's saved quick routes:

```sql
CREATE TABLE quick_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  origin_lat DECIMAL(10,6),
  origin_lng DECIMAL(10,6),
  destination_lat DECIMAL(10,6),
  destination_lng DECIMAL(10,6),
  departure_time VARCHAR(10) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT quick_routes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id)
);
```

## Existing Tables to Update

### 1. `profiles` Table
Add designation field for faculty titles:

```sql
ALTER TABLE profiles ADD COLUMN designation VARCHAR(100);
```

### 2. `rides` Table
Add coordinate fields for precise pickup/drop-off locations:

```sql
ALTER TABLE rides 
ADD COLUMN origin_lat DECIMAL(10,6),
ADD COLUMN origin_lng DECIMAL(10,6),
ADD COLUMN destination_lat DECIMAL(10,6),
ADD COLUMN destination_lng DECIMAL(10,6),
ADD COLUMN drop_off_landmark VARCHAR(100);
```

### 3. `bookings` Table
Add payment tracking fields:

```sql
ALTER TABLE bookings 
ADD COLUMN contribution_amount DECIMAL(10,2),
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN settled_at TIMESTAMP WITH TIME ZONE;
```

## Indexes to Add

```sql
-- For ride messages
CREATE INDEX ride_messages_ride_id_idx ON ride_messages(ride_id);
CREATE INDEX ride_messages_created_at_idx ON ride_messages(created_at);

-- For user savings
CREATE INDEX user_savings_user_id_idx ON user_savings(user_id);
CREATE INDEX user_savings_green_score_idx ON user_savings(green_score);

-- For quick routes
CREATE INDEX quick_routes_user_id_idx ON quick_routes(user_id);
CREATE INDEX quick_routes_is_default_idx ON quick_routes(is_default);
```

## Triggers to Create

### 1. Update User Savings Trigger
Automatically update user savings when rides are completed:

```sql
CREATE OR REPLACE FUNCTION update_user_savings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total rides, distance, fuel saved, cost saved, CO2 saved
  UPDATE user_savings SET
    total_rides = (
      SELECT COUNT(*) FROM rides WHERE driver_id = NEW.driver_id AND is_active = TRUE
    ) + (
      SELECT COUNT(*) FROM bookings WHERE passenger_id = NEW.driver_id AND status = 'confirmed'
    ),
    total_distance = COALESCE((
      SELECT SUM(15) FROM rides WHERE driver_id = NEW.driver_id AND is_active = TRUE
    ) + (
      SELECT SUM(15) FROM bookings b 
      JOIN rides r ON b.ride_id = r.id 
      WHERE b.passenger_id = NEW.driver_id AND b.status = 'confirmed'
    ), 0),
    fuel_saved = total_distance / 12, -- Average fuel efficiency
    cost_saved = fuel_saved * 305, -- Karachi petrol price
    co2_saved = fuel_saved * 2.31, -- CO2 per liter
    green_score = LEAST(100, (total_rides * 5) + (co2_saved * 2)),
    weekly_savings = (cost_saved / 30) * 7,
    monthly_savings = cost_saved,
    updated_at = NOW()
  WHERE user_id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_savings
AFTER INSERT OR UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION update_user_savings();
```

## Data Migration Script

```sql
-- Step 1: Add new columns to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation VARCHAR(100);

ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS origin_lat DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS origin_lng DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS drop_off_landmark VARCHAR(100);

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS contribution_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Create new tables
-- (Run the CREATE TABLE statements from above)

-- Step 3: Create indexes
-- (Run the CREATE INDEX statements from above)

-- Step 4: Initialize user savings for existing users
INSERT INTO user_savings (user_id, total_rides, green_score)
SELECT user_id, 0, 0
FROM profiles
WHERE user_id NOT IN (SELECT DISTINCT user_id FROM user_savings);
```

## Notes

1. **Backup**: Always create a backup before running schema changes
2. **Testing**: Test schema changes in development environment first
3. **Rollback Plan**: Have rollback scripts ready in case of issues
4. **Performance**: Monitor query performance after adding new indexes
5. **Data Integrity**: Ensure foreign key constraints are properly maintained

## Supabase Considerations

- Use Supabase migrations for schema changes
- Enable Row Level Security (RLS) for new tables
- Consider using Supabase Edge Functions for complex calculations
- Set up proper database triggers for automatic updates
- Configure real-time subscriptions for chat messages
