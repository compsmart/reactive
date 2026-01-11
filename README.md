# ConnectTeam Clone

A comprehensive workforce management platform for managing direct employees, subcontractors, and customer jobs. Built with React (Next.js), Node.js, Express, and PostgreSQL.

## Features

### User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full system access - manage staff, approve contractors, assign jobs, view reports |
| **Customer (Residential)** | Post jobs, track status, provide feedback, pay per job |
| **Customer (Commercial)** | Same as residential + account-based billing options |
| **Contractor/Subcontractor** | Browse available jobs, place bids, complete assigned work, log timesheets |
| **Employee** | Internal staff assigned to jobs by admin |

### Core Functionality

#### Job Management
- **Post Jobs**: Customers create jobs with title, description, budget, and location
- **Smart Matching**: Admin can find contractors based on proximity (distance calculation) and skills
- **Bidding System**: Contractors can bid on open jobs
- **Job Assignment**: Admin assigns jobs to contractors or employees
- **Status Tracking**: Jobs flow through OPEN → ASSIGNED → IN_PROGRESS → COMPLETED

#### Contractor Management
- **Registration & Approval**: Contractors register with skills and location
- **Profile Management**: Skills, hourly rate, location (lat/long), verification status
- **Rating System**: Customer feedback contributes to contractor ratings
- **Distance-Based Matching**: Haversine formula calculates distance for job recommendations

#### Security Features
- **JWT Authentication** with proper secret management (no hardcoded fallbacks)
- **Input Validation** using Zod for all API endpoints
- **Rate Limiting** to prevent brute force attacks
- **Role-Based Access Control (RBAC)** with proper authorization checks
- **CORS Configuration** with allowlist-based origin control
- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, and numbers

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **Validation** | Zod |
| **Authentication** | JWT with Role-Based Access Control (RBAC) |

## Project Structure

```
connectteam.com/
├── client/                 # Next.js Frontend
│   └── src/
│       ├── app/            # App Router pages
│       │   ├── auth/       # Login & Register
│       │   └── dashboard/  # Role-based dashboards
│       │       ├── admin/
│       │       ├── customer/
│       │       └── contractor/
│       ├── components/ui/  # Reusable UI components
│       ├── context/        # React Context (Auth)
│       └── lib/            # API client & utilities
│
├── server/                 # Express Backend
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Demo data seeder
│   └── src/
│       ├── controllers/    # Route handlers
│       ├── middleware/     # Auth, RBAC, Rate limiting
│       ├── routes/         # API route definitions
│       ├── types/          # TypeScript type definitions
│       └── utils/          # Config, Prisma client, validation
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd connectteam.com
   ```

2. **Install dependencies**
   ```bash
   # Server
   cd server
   npm install

   # Client
   cd ../client
   npm install
   ```

3. **Configure environment**
   
   Create `.env` file in `server/` directory:
   ```env
   # REQUIRED
   DATABASE_URL="postgresql://username:password@localhost:5432/connectteam"
   JWT_SECRET="your-secret-key-at-least-64-characters-long-generate-with-openssl"
   
   # OPTIONAL
   PORT=5001
   NODE_ENV=development
   JWT_EXPIRES_IN=1d
   ALLOWED_ORIGINS=http://localhost:3000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   Create `.env.local` file in `client/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Setup database**
   ```bash
   cd server
   npm run db:generate
   npm run db:push
   ```

5. **Seed demo data** (optional)
   ```bash
   npm run db:seed
   ```

6. **Start the applications**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:5001

## Demo Accounts

After running the seed script:

| Email | Password | Role |
|-------|----------|------|
| admin@connectteam.com | Password123 | Admin |
| john.homeowner@example.com | Password123 | Residential Customer |
| manager@bigcorp.com | Password123 | Commercial Customer |
| bob.builder@example.com | Password123 | Contractor |
| alice.plumber@example.com | Password123 | Contractor |
| charlie.sparky@example.com | Password123 | Contractor |
| diana.painter@example.com | Password123 | Contractor |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (rate limited) |
| POST | `/api/auth/login` | Login and get JWT token (rate limited) |
| GET | `/api/auth/me` | Get current user profile |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (filtered by role) |
| POST | `/api/jobs` | Create new job (Customer/Admin) |
| GET | `/api/jobs/:id` | Get job details (authorized users only) |
| GET | `/api/jobs/:id/matches` | Get matching contractors (Admin) |
| POST | `/api/jobs/:id/bid` | Place bid on job (Contractor) |
| POST | `/api/jobs/:id/assign` | Assign job to contractor (Admin) |

## Database Schema

### Key Models

- **User**: Core user with role (ADMIN, EMPLOYEE, SUBCONTRACTOR, CUST_RESIDENTIAL, CUST_COMMERCIAL)
- **ContractorProfile**: Skills, location, hourly rate, rating
- **CustomerProfile**: Address, billing info, customer type
- **Job**: Title, description, budget, location, status
- **Assignment**: Links jobs to contractors/employees
- **Bid**: Contractor bids on jobs
- **Timesheet**: Time tracking for job work

### Data Integrity
- Cascade delete rules ensure referential integrity
- Indexes on frequently queried fields for performance
- Decimal precision for monetary values

## Smart Matching Algorithm

The system recommends contractors based on:

1. **Proximity**: Calculates distance using the Haversine formula with bounding box pre-filtering for performance
2. **Skills**: Matches job requirements to contractor skills (future enhancement)
3. **Rating**: Higher-rated contractors prioritized (future enhancement)
4. **Availability**: Excludes contractors with conflicting assignments (future enhancement)

## Security Considerations

- **Never hardcode secrets** - JWT_SECRET must be set via environment variable
- **Input validation** - All endpoints validate input with Zod schemas
- **Rate limiting** - Auth endpoints limited to 10 requests per 15 minutes
- **Authorization** - Every endpoint checks user permissions
- **CORS** - Only configured origins can make requests
- **Password policy** - Minimum 8 chars with mixed case and numbers

## Scripts Reference

### Server
```bash
npm run dev        # Start development server with hot reload
npm run build      # Compile TypeScript
npm run start      # Run production build
npm run db:generate # Generate Prisma client
npm run db:push    # Push schema to database
npm run db:migrate # Run migrations
npm run db:seed    # Seed demo data
npm run db:studio  # Open Prisma Studio
```

### Client
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Run production build
npm run lint       # Run ESLint
```

## Future Enhancements

- [ ] Real-time notifications (WebSocket)
- [ ] Invoice generation & payment processing
- [ ] Mobile app (React Native)
- [ ] Calendar integration
- [ ] Document management (contracts, certifications)
- [ ] Advanced reporting & analytics
- [ ] Customer feedback & review system
- [ ] Chat/messaging between users
- [ ] Skills-based matching algorithm
- [ ] Availability calendar for contractors
- [ ] Email notifications
- [ ] Two-factor authentication

## License

MIT
