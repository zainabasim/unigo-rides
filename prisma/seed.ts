import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample users
  const users = [
    {
      email: 'bilal.khan@neduet.edu.pk',
      full_name: 'Bilal Khan',
      phone: '03123456789',
      whatsapp: '+923123456789',
      password: 'password123',
      user_role: 'DRIVER' as const,
      department: 'Computer Science'
    },
    {
      email: 'arfa.rahim@neduet.edu.pk',
      full_name: 'Arfa Rahim',
      phone: '03234567890',
      whatsapp: '+923234567890',
      password: 'password123',
      user_role: 'DRIVER' as const,
      department: 'Electrical Engineering'
    },
    {
      email: 'ahmed.ali@neduet.edu.pk',
      full_name: 'Ahmed Ali',
      phone: '03345678901',
      whatsapp: '+923345678901',
      password: 'password123',
      user_role: 'DRIVER' as const,
      department: 'Mechanical Engineering'
    },
    {
      email: 'sara.nadeem@neduet.edu.pk',
      full_name: 'Sara Nadeem',
      phone: '03456789012',
      whatsapp: '+923456789012',
      password: 'password123',
      user_role: 'PASSENGER' as const,
      department: 'Computer Science'
    },
    {
      email: 'umar.farooq@neduet.edu.pk',
      full_name: 'Umar Farooq',
      phone: '03567890123',
      whatsapp: '+923567890123',
      password: 'password123',
      user_role: 'PASSENGER' as const,
      department: 'Civil Engineering'
    }
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
    
    // Create profile for each user
    await prisma.profile.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        full_name: userData.full_name,
        department: userData.department,
        phone_number: userData.phone,
      },
    })
    
    console.log(`✅ Created user: ${userData.full_name}`)
  }

  // Create sample rides
  const drivers = await prisma.user.findMany({
    where: { user_role: 'DRIVER' }
  })

  const rides = [
    {
      driver_id: drivers[0]?.id || '',
      vehicle_type: 'CAR' as const,
      vehicle_model: 'Toyota Corolla 2020',
      plate_number: 'ABC-123',
      origin: 'Gulshan-e-Iqbal',
      destination: 'NED University',
      origin_lat: 24.9339,
      origin_lng: 67.1124,
      destination_lat: 24.9340,
      destination_lng: 67.1113,
      departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      total_seats: 4,
      available_seats: 4,
      price: 150.0,
    },
    {
      driver_id: drivers[1]?.id || '',
      vehicle_type: 'BIKE' as const,
      vehicle_model: 'Honda CD70',
      plate_number: 'XYZ-456',
      origin: 'North Nazimabad',
      destination: 'NED University',
      origin_lat: 24.9375,
      origin_lng: 67.0672,
      destination_lat: 24.9340,
      destination_lng: 67.1113,
      departure_time: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      total_seats: 1,
      available_seats: 1,
      price: 80.0,
    },
    {
      driver_id: drivers[2]?.id || '',
      vehicle_type: 'CAR' as const,
      vehicle_model: 'Honda Civic 2019',
      plate_number: 'DEF-789',
      origin: 'Clifton',
      destination: 'NED University',
      origin_lat: 24.8270,
      origin_lng: 67.0348,
      destination_lat: 24.9340,
      destination_lng: 67.1113,
      departure_time: new Date(Date.now() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
      total_seats: 3,
      available_seats: 3,
      price: 200.0,
    }
  ]

  for (const rideData of rides) {
    const ride = await prisma.ride.create({
      data: rideData,
    })
    console.log(`🚗 Created ride: ${rideData.vehicle_model} from ${rideData.origin} to ${rideData.destination}`)
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
