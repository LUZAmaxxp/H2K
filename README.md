# Physiotherapy Appointment Management System

A comprehensive web application built with Next.js for managing physiotherapy appointments and patient care at Hôpital Hassan II - Physiotherapy Department.

## 🌟 Overview

This platform provides a complete solution for managing:
- **Appointment Scheduling**: Book and manage physiotherapy sessions
- **Patient Management**: Maintain patient records and medical history
- **Therapist Management**: Manage therapist profiles and availability
- **Room Management**: Track treatment rooms and equipment
- **Waiting List**: Handle patient queues and priority management
- **Reporting**: Generate and export reports in various formats

## ✨ Features

### 🔐 Authentication & Security
- Secure user authentication with Better Auth
- Email verification and password reset
- Role-based access control (Therapists, Admins)
- Session management with JWT tokens
- Rate limiting and security headers

### 📋 Appointment Management
- Schedule physiotherapy appointments
- Multiple appointment types (initial-assessment, follow-up, rehabilitation, post-operative)
- Duration options (30, 45, 60 minutes)
- Room assignment and equipment tracking
- Status tracking (pending, completed, no-show, cancelled)

### 👥 Patient Management
- Comprehensive patient profiles with medical records
- Insurance information and emergency contacts
- Medical history and allergy tracking
- Appointment history and progress notes
- Phone and email communication

### 👨‍⚕️ Therapist Management
- Therapist profiles with license numbers and specializations
- Role-based permissions (therapist, admin)
- Appointment statistics and workload tracking
- Approval workflow for new therapists

### 🏥 Room Management
- Treatment room inventory and equipment tracking
- Room capacity and availability
- Active/inactive room status

### 📋 Waiting List Management
- Patient queue management with priority numbers
- Desired date and time preferences
- Room preferences and special requirements
- Automatic promotion to appointments

### 📊 Reporting & Analytics
- Generate comprehensive reports
- Export data to Excel and Word formats
- Dashboard with key metrics
- Filter and search capabilities

### 🌐 Internationalization
- Multi-language support (English, French, Spanish, Arabic)
- Localized user interface
- RTL support for Arabic

### 🎨 User Experience
- Modern, responsive design with Tailwind CSS
- Dark/Light theme support
- Mobile-first approach
- Intuitive navigation and user flows

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database
- **Next.js API Routes** - Server-side API endpoints
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Better Auth** - Authentication library

### Additional Libraries
- **Next Intl** - Internationalization
- **UploadThing** - File upload management
- **Cloudinary** - Image hosting and optimization
- **Nodemailer/Resend** - Email services
- **Docx/ExcelJS** - Document generation
- **Zustand** - State management

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── interventions/     # Intervention management
│   │   ├── reclamations/      # Reclamation management
│   │   └── settings/          # User settings
│   ├── components/            # Reusable UI components
│   ├── config/                # Configuration files
│   ├── core/                  # Core utilities and hooks
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Library configurations
│   ├── utils/                 # Utility functions
│   └── validators/            # Form validation schemas
├── messages/                  # Internationalization files
├── public/                    # Static assets
├── k8s/                      # Kubernetes manifests
├── scripts/                  # Database seeding scripts
├── tests/                    # Test files
└── .github/workflows/         # CI/CD pipelines
```

## 🚀 Installation

### Prerequisites
- Node.js 18+
- MongoDB database (local or Atlas)
- npm or yarn package manager
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auth-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

   # Authentication
   BETTER_AUTH_SECRET=your-super-secret-key-here-minimum-32-characters-for-testing
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

   # Email Service (choose one)
   RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   # or SMTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourdomain.com

   # File Upload
   UPLOADTHING_SECRET=sk_live_XXXXXXXXXXXXXXXXXXXX
   UPLOADTHING_APP_ID=your-app-id

   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Optional: Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Database Setup**
   - For local MongoDB: Install MongoDB and start the service
   - For MongoDB Atlas: Create a cluster and get the connection string
   - Run seeding scripts if needed:
     ```bash
     npm run seed:admin
     node scripts/seed-patients.js
     node scripts/seed-therapists.js
     node scripts/seed-rooms.js
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication System

### Overview
The application uses **Better Auth** for secure authentication with the following features:
- Email/password authentication
- Magic link authentication
- Organization support
- Session management
- Email verification

### Configuration (`src/lib/auth.ts`)
```typescript
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { organization, magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  database: mongodbAdapter(client),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [
    organization(),
    magicLink({
      sendMagicLink: async ({ email, token }) => {
        // Send magic link email
      },
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
```

### Authentication Flow
1. User registers with email/password
2. Email verification sent
3. User signs in, session created
4. JWT token stored in cookies
5. Protected routes check authentication status

### API Routes
- `POST /api/auth/sign-in` - Sign in with email/password
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-out` - Sign out user
- `GET /api/auth/session` - Get current session

## 🗄️ Database & ORM

### Database: MongoDB
- **Type**: NoSQL document database
- **Hosting**: MongoDB Atlas (cloud) or local instance
- **Connection**: Via Mongoose ODM

### Connection Setup (`src/lib/db.ts`)
```typescript
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
```

### ORM: Mongoose
Mongoose provides schema-based modeling for MongoDB.

### Models (`src/lib/models.ts`)

#### UserProfile Model (Therapists & Admins)
```typescript
const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User' // Reference to BetterAuth User
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  roles: {
    type: [String],
    enum: ['therapist', 'admin'],
    default: ['therapist']
  },
  role: {
    type: String,
    required: true,
    enum: ['therapist', 'admin'],
    default: 'therapist'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'active', 'inactive'],
    default: 'pending'
  },
  // Therapist-specific fields
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    sparse: true // Only required for therapists
  },
  specialization: {
    type: String,
    sparse: true
  },
  phoneNumber: {
    type: String,
    sparse: true
  },
  lastLogin: {
    type: Date
  },
  totalAppointments: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

#### Patient Model
```typescript
const PatientSchema = new mongoose.Schema({
  medicalRecordNumber: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  insuranceProvider: {
    type: String
  },
  insuranceNumber: {
    type: String
  },
  primaryTherapist: {
    type: String,
    ref: 'UserProfile'
  },
  medicalNotes: {
    type: String
  },
  allergies: [{
    type: String
  }],
  appointmentHistory: [{
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    date: {
      type: Date,
      required: true
    },
    therapist: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

#### Appointment Model
```typescript
const AppointmentSchema = new mongoose.Schema({
  therapistId: {
    type: String,
    required: true,
    ref: 'UserProfile'
  },
  therapistName: {
    type: String,
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true // Format: "HH:MM" (e.g., "08:00", "14:30")
  },
  duration: {
    type: Number,
    required: true, // Duration in minutes
    enum: [30, 45, 60]
  },
  appointmentType: {
    type: String,
    required: true,
    enum: ['initial-assessment', 'follow-up', 'rehabilitation', 'post-operative']
  },
  room: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'no-show', 'cancelled'],
    default: 'pending'
  },
  medicalNotes: {
    type: String
  },
  specialRequirements: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
```

#### WaitingList Model
```typescript
const WaitingListSchema = new mongoose.Schema({
  therapistId: {
    type: String,
    required: true,
    ref: 'UserProfile'
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  desiredDate: {
    type: Date,
    required: true
  },
  desiredTime: {
    type: String,
    required: true
  },
  appointmentType: {
    type: String,
    required: true,
    enum: ['initial-assessment', 'follow-up', 'rehabilitation', 'post-operative']
  },
  duration: {
    type: Number,
    required: true,
    enum: [30, 45, 60]
  },
  priorityNumber: {
    type: Number,
    required: true
  },
  roomPreference: {
    type: String
  },
  notes: {
    type: String
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});
```

#### Room Model
```typescript
const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    default: 1
  },
  equipment: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

### Database Operations
#### Creating Records
```typescript
import { User } from '@/lib/models';

export async function createUser(data: { name: string; email: string; password: string }) {
  const user = new User(data);
  await user.save();
  return user;
}
```

#### Querying Records
```typescript
export async function getAppointmentsByTherapist(therapistId: string) {
  return await Appointment.find({ therapistId })
    .populate('patientId', 'name email')
    .populate('roomId', 'name')
    .sort({ date: 1 });
}
```

#### Updating Records
```typescript
export async function updateAppointment(id: string, updates: Partial<Appointment>) {
  return await Appointment.findByIdAndUpdate(id, updates, { new: true });
}
```

## 🔌 API Endpoints

### Authentication Endpoints

#### Sign In
```http
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Sign Up
```http
POST /api/auth/sign-up
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Appointment Endpoints

#### Get Appointments
```http
GET /api/appointments
Authorization: Bearer <token>
```

Response:
```json
{
  "appointments": [
    {
      "id": "64f...",
      "patient": { "name": "John Doe", "email": "john@example.com" },
      "therapist": { "name": "Dr. Smith" },
      "room": { "name": "Room 101" },
      "date": "2024-01-15T10:00:00Z",
      "duration": 60,
      "status": "scheduled"
    }
  ]
}
```

#### Create Appointment
```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "64f...",
  "therapistId": "64f...",
  "roomId": "64f...",
  "date": "2024-01-15T10:00:00Z",
  "duration": 60,
  "notes": "Initial consultation"
}
```

#### Update Appointment
```http
PUT /api/appointments/[id]
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed",
  "notes": "Treatment completed successfully"
}
```

### Patient Endpoints

#### Get Patients
```http
GET /api/patients
Authorization: Bearer <token>
```

#### Create Patient
```http
POST /api/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "64f...",
  "medicalHistory": "No known allergies",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567890",
    "relationship": "Spouse"
  }
}
```

### Room Endpoints

#### Get Rooms
```http
GET /api/rooms
Authorization: Bearer <token>
```

#### Create Room
```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Room 101",
  "type": "consultation",
  "capacity": 1
}
```

## 📧 Services

### Email Service
The application supports multiple email providers: Resend and SMTP.

#### Configuration (`src/lib/email-service.ts`)
```typescript
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }
}
```

#### Usage
```typescript
const emailService = new EmailService();
await emailService.sendEmail(
  'user@example.com',
  'Appointment Confirmation',
  '<h1>Your appointment is confirmed</h1>'
);
```

### File Upload Service
Supports UploadThing and Cloudinary for file uploads.

#### UploadThing Configuration
```typescript
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      // Check authentication
      return { userId: "user123" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

#### Cloudinary Configuration
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: File) {
  const result = await cloudinary.uploader.upload(file.path);
  return result.secure_url;
}
```

## 🎨 Frontend Components

### State Management
Uses Zustand for global state management.

#### Store Configuration (`src/lib/store.ts`)
```typescript
import { create } from 'zustand';

interface AppState {
  user: User | null;
  appointments: Appointment[];
  setUser: (user: User) => void;
  setAppointments: (appointments: Appointment[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  appointments: [],
  setUser: (user) => set({ user }),
  setAppointments: (appointments) => set({ appointments }),
}));
```

### Custom Hooks
#### Authentication Hook (`src/hooks/use-auth.ts`)
```typescript
import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  };
}
```

#### Appointments Hook (`src/hooks/use-appointments.ts`)
```typescript
import { useQuery } from '@tanstack/react-query';

export function useAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments');
      return response.json();
    },
  });
}
```

### Form Validation
Uses React Hook Form with Zod schemas.

#### Validation Schema (`src/validators/appointment.schema.ts`)
```typescript
import { z } from 'zod';

export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  therapistId: z.string().min(1, 'Therapist is required'),
  roomId: z.string().min(1, 'Room is required'),
  date: z.date().min(new Date(), 'Date must be in the future'),
  duration: z.number().min(15).max(240),
  notes: z.string().optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
```

#### Form Component
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function AppointmentForm() {
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  const onSubmit = async (data: AppointmentFormData) => {
    await fetch('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

## 🧪 Testing

### Test Structure
```
tests/
├── unit/                    # Unit tests
├── integration/            # Integration tests
├── e2e/                    # End-to-end tests
└── utils/                  # Test utilities
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/appointments.test.ts

# Run in watch mode
npm run test:watch
```

### Example Test (`tests/appointments.test.ts`)
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createAppointment } from '@/lib/appointments';

describe('Appointments', () => {
  beforeEach(async () => {
    // Setup test database
  });

  it('should create an appointment', async () => {
    const appointment = await createAppointment({
      patientId: 'patient123',
      therapistId: 'therapist123',
      roomId: 'room123',
      date: new Date(),
      duration: 60,
    });

    expect(appointment).toHaveProperty('id');
    expect(appointment.status).toBe('scheduled');
  });
});
```

## 🔒 Security

### Middleware
```typescript
// middleware.ts
import { auth } from '@/lib/auth';

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    return Response.redirect(new URL('/auth/sign-in', req.url));
  }
});
```

### Rate Limiting
```typescript
// src/lib/rate-limiter.ts
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
```

### Input Validation
All API inputs are validated using Zod schemas to prevent injection attacks.

### CORS Configuration
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};
```

## 🚀 Deployment

### Docker Deployment
The application includes a multi-stage Dockerfile for optimized production builds.

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

#### Building and Running
```bash
# Build image
docker build -t auth-next .

# Run container
docker run -p 3000:3000 -e MONGODB_URI=... auth-next
```

### Kubernetes Deployment
For orchestration with Minikube:

1. **Build and push image**
   ```bash
   docker build -t yourusername/auth-next:latest .
   docker push yourusername/auth-next:latest
   ```

2. **Apply manifests**
   ```bash
   kubectl apply -f k8s/
   ```

3. **Access application**
   ```bash
   minikube service auth-next-service
   ```

### Vercel Deployment
1. Connect GitHub repo to Vercel
2. Add environment variables in dashboard
3. Deploy automatically on push

## 🔄 CI/CD

### GitHub Actions Workflow (`.github/workflows/ci.yml`)
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: VercelDeployAction@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
- Check MongoDB URI format
- Ensure network access for Atlas
- Verify credentials

#### Authentication Problems
- Check BETTER_AUTH_SECRET length (min 32 chars)
- Verify BETTER_AUTH_URL matches domain
- Clear cookies and try again

#### Build Failures
- Clear node_modules and reinstall
- Check Node.js version (18+)
- Verify all environment variables are set

#### Email Not Sending
- Check SMTP credentials
- Verify firewall allows SMTP port
- Test with different provider (Resend vs SMTP)

### Logs
```bash
# View application logs
npm run dev  # Development
npm run build && npm start  # Production

# Docker logs
docker logs <container-id>

# Kubernetes logs
kubectl logs <pod-name>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation

## 📝 License

This project is proprietary software for Hôpital Hassan II - Physiotherapy Department.

## 📞 Support

For support and questions, please contact the development team.

## 🔄 Recent Updates

- Upgraded to Next.js 15 and React 19
- Enhanced security with rate limiting
- Improved internationalization support
- Added dark/light theme toggle
- Implemented file upload with UploadThing
- Added comprehensive reporting features
- Kubernetes orchestration support

---

**Hôpital Hassan II - Physiotherapy Department** - Excellence in Physiotherapy Care
