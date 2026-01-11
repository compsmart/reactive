import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // Password that meets validation requirements:
  // - At least 8 characters
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  const demoPassword = 'Password123';
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@connectteam.com' },
    update: {},
    create: {
      email: 'admin@connectteam.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Created Admin:', admin.email);

  // 2. Create Contractors with realistic data
  const contractorsData = [
    {
      email: 'bob.builder@example.com',
      skills: ['General Construction', 'Bricklaying', 'Carpentry'],
      lat: 51.5074, // Central London
      lon: -0.1278,
      rate: 45.0
    },
    {
      email: 'alice.plumber@example.com',
      skills: ['Plumbing', 'Heating Systems', 'Boiler Repair'],
      lat: 51.515, // Slightly North
      lon: -0.13,
      rate: 60.0
    },
    {
      email: 'charlie.sparky@example.com',
      skills: ['Electrical', 'Rewiring', 'Smart Home Installation'],
      lat: 51.45, // South London
      lon: -0.10,
      rate: 55.0
    },
    {
      email: 'diana.painter@example.com',
      skills: ['Interior Painting', 'Exterior Painting', 'Wallpapering'],
      lat: 51.52, // North London
      lon: -0.15,
      rate: 40.0
    }
  ];

  for (const c of contractorsData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        passwordHash,
        role: 'SUBCONTRACTOR',
        status: 'ACTIVE',
        contractorProfile: {
          create: {
            skills: c.skills,
            latitude: c.lat,
            longitude: c.lon,
            hourlyRate: c.rate,
            isVerified: true,
            rating: 4.0 + Math.random() * 1.0 // Random rating between 4.0-5.0
          }
        }
      },
    });
    console.log(`✅ Created Contractor: ${user.email}`);
  }

  // 3. Create Customers
  const residentialCustomer = await prisma.user.upsert({
    where: { email: 'john.homeowner@example.com' },
    update: {},
    create: {
      email: 'john.homeowner@example.com',
      passwordHash,
      role: 'CUST_RESIDENTIAL',
      status: 'ACTIVE',
      customerProfile: {
        create: {
          address: '10 Downing Street, London',
          type: 'Residential'
        }
      }
    },
  });
  console.log('✅ Created Residential Customer:', residentialCustomer.email);

  const commercialCustomer = await prisma.user.upsert({
    where: { email: 'manager@bigcorp.com' },
    update: {},
    create: {
      email: 'manager@bigcorp.com',
      passwordHash,
      role: 'CUST_COMMERCIAL',
      status: 'ACTIVE',
      customerProfile: {
        create: {
          address: '1 Canada Square, Canary Wharf, London',
          billingInfo: 'NET-30',
          type: 'Commercial'
        }
      }
    },
  });
  console.log('✅ Created Commercial Customer:', commercialCustomer.email);

  // 4. Create Sample Jobs
  const jobs = [
    {
      title: 'Fix Leaking Kitchen Tap',
      description: 'Kitchen tap has been dripping constantly for a week. Need a plumber to fix or replace it.',
      budget: 150.0,
      location: '10 Downing Street, London',
      latitude: 51.5034,
      longitude: -0.1276,
      customerId: residentialCustomer.id,
      status: 'OPEN'
    },
    {
      title: 'Complete Office Rewiring',
      description: 'Our office building needs complete electrical rewiring. 5000 sq ft space, 3 floors. Need certified electrician.',
      budget: 15000.0,
      location: '1 Canada Square, Canary Wharf, London',
      latitude: 51.5049,
      longitude: -0.0196,
      customerId: commercialCustomer.id,
      status: 'OPEN'
    },
    {
      title: 'Garden Wall Construction',
      description: 'Need a garden wall built, approximately 20 meters long and 1.5 meters high. Brick wall preferred.',
      budget: 3000.0,
      location: '10 Downing Street, London',
      latitude: 51.5034,
      longitude: -0.1276,
      customerId: residentialCustomer.id,
      status: 'OPEN'
    }
  ];

  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: jobData as any
    });
    console.log(`✅ Created Job: ${job.title}`);
  }

  console.log('\n✨ Seeding completed!\n');
  console.log('📋 Demo Accounts:');
  console.log('─────────────────────────────────────────────────');
  console.log(`   Admin:       admin@connectteam.com`);
  console.log(`   Customer 1:  john.homeowner@example.com`);
  console.log(`   Customer 2:  manager@bigcorp.com`);
  console.log(`   Contractor:  bob.builder@example.com`);
  console.log(`   Contractor:  alice.plumber@example.com`);
  console.log(`   Contractor:  charlie.sparky@example.com`);
  console.log(`   Contractor:  diana.painter@example.com`);
  console.log('─────────────────────────────────────────────────');
  console.log(`   Password (all accounts): ${demoPassword}`);
  console.log('─────────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
