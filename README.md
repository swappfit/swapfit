# Gym Management System Monorepo

A comprehensive monorepo containing a Gym Management System with an Admin Dashboard, Mobile App, and Backend API.

## 🏗️ Project Structure

```
gym-monorepo/
├── apps/
│   ├── gym-admin/          # React + Vite Admin Dashboard
│   └── gymapp/             # React Mobile App
├── backend/                # Express.js API Server
├── package.json            # Root package.json
├── turbo.json             # Turbo configuration
└── pnpm-workspace.yaml    # pnpm workspace configuration
```

## 🚀 Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (for backend database)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gym-monorepo
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up the backend database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

4. **Configure environment variables**
   - Copy `backend/.env.example` to `backend/.env` and fill in your values
   - Update API URLs in frontend `.env.production` files

## 🛠️ Available Scripts

### Root Level Commands
```bash
# Development
pnpm dev                    # Start all apps in development mode
pnpm dev:admin             # Start admin dashboard only
pnpm dev:app               # Start mobile app only
pnpm dev:backend           # Start backend only

# Building
pnpm build                 # Build all applications
pnpm build:admin           # Build admin dashboard
pnpm build:app             # Build mobile app
pnpm build:backend         # Build backend

# Testing & Quality
pnpm test                  # Run tests for all apps
pnpm test:coverage         # Run tests with coverage
pnpm lint                  # Lint all applications
pnpm type-check            # Type checking (if applicable)
pnpm clean                 # Clean all build artifacts

# Production
pnpm start:admin           # Start admin dashboard in production mode
pnpm start:app             # Start mobile app in production mode
pnpm start:backend         # Start backend in production mode
```

### Individual App Commands
```bash
# Backend specific
cd backend
pnpm prisma:generate       # Generate Prisma client
pnpm prisma:migrate        # Run database migrations
pnpm prisma:seed           # Seed database with initial data

# Admin Dashboard specific
cd apps/gym-admin
pnpm preview               # Preview production build

# Mobile App specific
cd apps/gymapp
pnpm eject                 # Eject from Create React App (if needed)
```

## 🌐 Development Workflow

1. **Start the backend first**
   ```bash
   pnpm dev:backend
   ```
   Backend will be available at `http://localhost:5000`

2. **Start the admin dashboard**
   ```bash
   pnpm dev:admin
   ```
   Admin dashboard will be available at `http://localhost:5173`

3. **Start the mobile app**
   ```bash
   pnpm dev:app
   ```
   Mobile app will be available at `http://localhost:3000`

## 🏭 Production Deployment

### Backend Deployment
1. Set up your production environment variables in `backend/.env`
2. Build and start the backend:
   ```bash
   pnpm build:backend
   pnpm start:backend
   ```

### Frontend Deployment
1. Update API URLs in environment files:
   - `apps/gym-admin/.env.production` - Set `VITE_API_BASE_URL`
   - `apps/gymapp/.env.production` - Set `REACT_APP_API_BASE_URL`

2. Build the applications:
   ```bash
   pnpm build:admin
   pnpm build:app
   ```

3. Deploy the build folders:
   - Admin: `apps/gym-admin/dist/`
   - Mobile App: `apps/gymapp/build/`

### Environment Configuration

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
SESSION_SECRET=your-session-secret
GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

#### Admin Dashboard (.env.production)
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_APP_NAME=Gym Admin Dashboard
VITE_APP_VERSION=1.0.0
```

#### Mobile App (.env.production)
```env
REACT_APP_API_BASE_URL=https://your-backend-domain.com/api
REACT_APP_APP_NAME=Gym Mobile App
REACT_APP_APP_VERSION=1.0.0
```

## 🛡️ Security Considerations

- Use strong, unique secrets for JWT and sessions
- Enable HTTPS in production
- Configure CORS properly for your domains
- Use environment variables for all sensitive data
- Regularly update dependencies
- Implement rate limiting (configured in backend)

## 📊 Tech Stack

### Backend (`backend/`)
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Passport.js (Google OAuth)
- **Real-time**: Socket.io
- **Payments**: Razorpay integration
- **Validation**: Joi
- **Testing**: Jest

### Admin Dashboard (`apps/gym-admin/`)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Routing**: React Router DOM
- **Testing**: Vitest

### Mobile App (`apps/gymapp/`)
- **Framework**: React 19 + Create React App
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Testing**: Jest + React Testing Library

### Build System
- **Package Manager**: pnpm
- **Monorepo Tool**: Turbo
- **Linting**: ESLint
- **Formatting**: Prettier

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**: Kill existing processes or change ports in environment files
2. **Database connection**: Ensure PostgreSQL is running and credentials are correct
3. **Module errors**: Run `pnpm install` in the root directory
4. **Build failures**: Check for missing environment variables

### Backend Setup Issues
If you encounter module import errors, the backend has been converted to ES modules. All files should use `import/export` syntax.

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

**Note**: This is a production-ready monorepo setup. Make sure to configure all environment variables and security settings before deploying to production.
