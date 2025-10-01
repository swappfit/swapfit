# Gym Admin Dashboard

A modern React-based admin dashboard for gym management, built with Vite, Tailwind CSS, and React Router. This project has been converted from a Next.js TypeScript application to a React JavaScript application.

## Features

- 🏠 **Dashboard Overview** - Key metrics and recent activity
- 👥 **User Management** - Manage members, trainers, and gym partners with detailed profiles
- 📊 **Analytics & Reports** - Comprehensive insights with charts and performance metrics
- 🏆 **Badge System** - Create and manage achievement badges with rarity levels
- 🎯 **Challenges Management** - Create and manage fitness challenges with progress tracking
- 🏢 **Gym Approvals** - Review and approve gym partnerships (coming soon)
- 🔔 **Notifications** - Manage system notifications (coming soon)
- ⚙️ **Settings** - Configure system preferences (coming soon)

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling with custom design system
- **React Router** - Navigation and routing
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **Class Variance Authority** - Component variants
- **Clsx & Tailwind Merge** - Utility functions for class management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gym-admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── sidebar.jsx     # Navigation sidebar
│   │   ├── top-navbar.jsx  # Top navigation bar
│   │   ├── dashboard-overview.jsx # Main dashboard
│   │   ├── analytics-reports.jsx # Analytics and reports
│   │   ├── user-management.jsx # User management system
│   │   ├── badge-manager.jsx # Badge management system
│   │   └── challenges-management.jsx # Challenges management
│   └── ui/                 # Reusable UI components
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       ├── badge.jsx
│       └── progress.jsx
├── lib/
│   └── utils.js           # Utility functions
├── App.jsx                # Main app component
├── main.jsx              # Entry point
└── index.css             # Global styles with Tailwind
```

## Component Conversion

This project has been successfully converted from TypeScript (.tsx) to JavaScript (.jsx) as requested. All components maintain the same functionality while using JavaScript syntax:

### Converted Components:
- ✅ **Sidebar** - Navigation with mobile responsiveness
- ✅ **Top Navbar** - Header with search and user actions
- ✅ **Dashboard Overview** - Main dashboard with stats and quick actions
- ✅ **Analytics Reports** - Comprehensive analytics with charts and metrics
- ✅ **User Management** - Complete user management system with tabs for members, trainers, and gyms
- ✅ **Badge Manager** - Badge creation and management with rarity levels
- ✅ **Challenges Management** - Challenge creation and management with progress tracking

### UI Components:
- ✅ **Button** - Multiple variants and sizes
- ✅ **Card** - Flexible card components
- ✅ **Input** - Form inputs with styling
- ✅ **Badge** - Status and category badges
- ✅ **Progress** - Progress bars for challenges

## Features Implemented

### Dashboard Overview
- Key performance metrics
- Recent activity feed
- Quick action buttons
- Responsive grid layout

### User Management
- Tabbed interface for different user types
- Search and filtering capabilities
- Detailed user cards with stats
- Status management

### Analytics & Reports
- Multiple chart placeholders
- Key metrics dashboard
- Time range filtering
- Export functionality

### Badge Management
- Badge creation and editing
- Rarity levels (Common, Uncommon, Rare, Epic, Legendary)
- Category organization
- Issuance tracking

### Challenges Management
- Challenge creation and management
- Progress tracking
- Participant management
- Prize and requirement systems

## Styling

The project uses Tailwind CSS with a comprehensive design system including:
- CSS custom properties for theming
- Dark mode support (ready for implementation)
- Responsive design patterns
- Custom color palette
- Consistent spacing and typography

## Data

The application currently uses mock data for demonstration purposes. All components are structured to easily integrate with real APIs and databases.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Migration Notes

This project was converted from a Next.js TypeScript application. Key changes made:
- Removed TypeScript types and interfaces
- Converted all `.tsx` files to `.jsx`
- Replaced Next.js specific imports with React Router
- Maintained all functionality and styling
- Preserved component structure and logic
