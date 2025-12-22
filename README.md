# Société Régionale Multiservices SOUSS MASSA - Management Platform

A comprehensive web application built with Next.js for managing service interventions and customer reclamations for Société Régionale Multiservices SOUSS MASSA, a regional multiservices company.

## 🌟 Overview

This platform provides a complete solution for managing:
- **Service Interventions**: Track and manage maintenance and service operations
- **Customer Reclamations**: Handle complaints and issues across hydraulic, electric, and mechanical systems
- **User Management**: Secure authentication and user profile management
- **Reporting**: Generate and export reports in various formats
- **File Management**: Upload and manage documents and photos

## ✨ Features

### 🔐 Authentication & Security
- Secure user authentication with Better Auth
- Email verification and password reset
- Role-based access control
- Session management with JWT tokens
- Rate limiting and security headers

### 📋 Intervention Management
- Create and track service interventions
- Assign team members and responsible personnel
- Set intervention dates and locations
- Upload photos and documentation
- Email notifications to stakeholders

### 🛠️ Reclamation Handling
- Submit and track customer complaints
- Categorize by type: Hydraulic, Electric, Mechanical
- Attach photos and detailed descriptions
- Automated email notifications
- Status tracking and resolution management

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
└── .github/workflows/         # CI/CD pipelines
```

## 🚀 Installation

### Prerequisites
- Node.js 18+
- MongoDB database
- npm or yarn package manager

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
   Create a `.env.local` file with the following variables:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/auth-next

   # Authentication
   BETTER_AUTH_SECRET=your-secret-key
   BETTER_AUTH_URL=http://localhost:3000

   # Email Service (choose one)
   RESEND_API_KEY=your-resend-api-key
   # or
   SMTP_HOST=your-smtp-host
   SMTP_PORT=587
   SMTP_USER=your-email@domain.com
   SMTP_PASS=your-password

   # File Upload
   UPLOADTHING_SECRET=your-uploadthing-secret
   UPLOADTHING_APP_ID=your-uploadthing-app-id

   # Cloudinary (optional)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Next.js
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Ensure MongoDB is running
   mongosh
   use auth-next
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### User Registration & Login
1. Visit the homepage and click "Create Account"
2. Fill in your details and verify your email
3. Sign in with your credentials

### Creating an Intervention
1. Navigate to the Dashboard
2. Click "New Intervention"
3. Fill in the required details:
   - Company name and responsible person
   - Team members
   - Site location
   - Start and end dates
   - Upload photos (optional)
   - Add recipient emails
4. Submit the form

### Submitting a Reclamation
1. Go to the Reclamations section
2. Click "New Reclamation"
3. Select the station and reclamation type
4. Provide detailed description
5. Attach photos if available
6. Add recipient emails for notifications

### Managing Settings
- Access user settings to configure:
  - Notification preferences
  - Theme (dark/light mode)
  - Language selection
  - Timezone settings

## 🔌 API Structure

### Authentication Endpoints
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User logout
- `POST /api/auth/forgot-password` - Password reset request

### Intervention Endpoints
- `GET /api/interventions` - List interventions
- `POST /api/interventions` - Create intervention
- `GET /api/interventions/[id]` - Get specific intervention
- `PUT /api/interventions/[id]` - Update intervention
- `DELETE /api/interventions/[id]` - Delete intervention

### Reclamation Endpoints
- `GET /api/reclamations` - List reclamations
- `POST /api/reclamations` - Create reclamation
- `GET /api/reclamations/[id]` - Get specific reclamation
- `PUT /api/reclamations/[id]` - Update reclamation
- `DELETE /api/reclamations/[id]` - Delete reclamation

### Other Endpoints
- `GET /api/records` - Get all records (interventions + reclamations)
- `POST /api/upload` - File upload
- `GET /api/export` - Export data
- `GET/POST/PUT /api/settings` - User settings management

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software for Société Régionale Multiservices SOUSS MASSA.

## 📞 Support

For support and questions, please contact the development team.

## 🔄 Recent Updates

- Upgraded to Next.js 15 and React 19
- Enhanced security with rate limiting
- Improved internationalization support
- Added dark/light theme toggle
- Implemented file upload with UploadThing
- Added comprehensive reporting features

---

**Société Régionale Multiservices SOUSS MASSA** - Excellence in Regional Services
