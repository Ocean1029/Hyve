# Hyve 🔥

A frictionless social focus application designed for students to connect, focus together, and build meaningful relationships. Turn off your phone to fuel the hyve, earn rewards, and deepen connections without the pressure of constant social interaction.

## Overview

Hyve is a real-time social focus platform that combines productivity tracking with social connection. The application encourages users to maintain focus by tracking phone usage, while simultaneously building connections with friends through shared focus sessions, AI-powered conversations, and collaborative experiences.

## Key Features

### Core Functionality

- **🔥 Focus Sessions**: Start hyve sessions and track focus time with an animated visual indicator that responds to your dedication
- **📱 Phone Detection**: Automatic focus tracking based on device orientation and usage patterns
- **💬 Real-time Chat**: AI-powered chat interface with friends using Google Gemini AI for natural, engaging conversations
- **📊 Analytics Dashboard**: Comprehensive weekly focus pattern visualization with advanced charts and insights
- **👥 Friend Management**: Discover, connect, and interact with friends through the social network
- **📸 Memory Posting**: Capture and share moments after focus sessions to build lasting memories
- **😊 Happy Index**: Track and rate your experiences to understand your emotional patterns
- **🌸 Seasonal Features**: Special features like Spring Recap to celebrate milestones

### User Experience

- **📱 Horizontal Navigation**: Intuitive swipe-based navigation between Messages, Dashboard, and Profile
- **🎨 Modern UI**: Beautiful, dark-themed interface built with Tailwind CSS
- **⚡ Real-time Updates**: Server-Sent Events (SSE) for live presence tracking and status updates
- **🔔 Notifications**: Get alerted when friends start focus sessions nearby
- **🎯 Ice Breakers**: AI-generated conversation starters to spark meaningful interactions

## Tech Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components with Lucide React icons
- **Charts**: Recharts for data visualization
- **State Management**: React hooks and context API

### Backend

- **Runtime**: Node.js
- **API Routes**: Next.js API routes with server actions
- **Authentication**: NextAuth.js v5 (beta) with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Server-Sent Events (SSE) for presence streaming

### AI & Services

- **AI Integration**: Google Gemini 2.5 Flash for chat and ice breaker generation
- **Image Processing**: Next.js Image optimization
- **Deployment**: Vercel-ready configuration

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **PostgreSQL** 15 or higher (or use Docker Compose)
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))
- **Cloudinary Account** ([Sign up here](https://cloudinary.com/)) for image uploads

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hyve
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://myuser:mypassword@localhost:5433/hyve_db"

# Authentication
AUTH_SECRET="your-auth-secret-here" # Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Integration
GEMINI_API_KEY="your-gemini-api-key"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here" # Generate with: openssl rand -base64 32
```

### 4. Set Up Database

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start a PostgreSQL container with the following configuration:
- **Container Name**: `hyve-postgres`
- **Database Name**: `hyve_db`
- **Port**: `5433` (mapped from container's 5432)
- **Username**: `myuser`
- **Password**: `mypassword`

#### Option B: Using Local PostgreSQL

1. Create a new PostgreSQL database:
```sql
CREATE DATABASE hyve_db;
```

2. Update the `DATABASE_URL` in your `.env.local` file to match your local PostgreSQL configuration.

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run db:seed
```

### 7. Generate Prisma Client

```bash
npm run db:generate
```

### 8. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
hyve/
├── app/                          # Next.js App Router directory
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/   # NextAuth authentication routes
│   │   ├── generate-chat-response/  # AI chat response generation
│   │   ├── generate-icebreaker/     # AI ice breaker generation
│   │   └── presence/                # Real-time presence API
│   │       ├── heartbeat/           # User heartbeat tracking
│   │       ├── status/              # User status retrieval
│   │       └── stream/               # SSE presence stream
│   ├── login/                      # Login page
│   ├── messages/                   # Messages pages
│   │   └── [personid]/              # Individual chat page
│   ├── profile/                     # User profile page
│   ├── search/                      # Friend search page
│   ├── settings/                    # Settings page
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
├── components/                      # React components
│   ├── BottomNav.tsx                # Bottom navigation bar
│   ├── ChatInterface.tsx            # Chat interface component
│   ├── ChatInterfaceClient.tsx      # Client-side chat wrapper
│   ├── Dashboard.tsx                # Dashboard component
│   ├── DashboardClient.tsx          # Client-side dashboard wrapper
│   ├── FocusMode.tsx                # Focus mode overlay
│   ├── Found.tsx                    # Friend found component
│   ├── FriendProfile.tsx            # Friend profile view
│   ├── HappyIndex.tsx                # Happiness tracking
│   ├── Hyve.tsx                      # Animated hyve component
│   ├── Messages.tsx                  # Messages list
│   ├── MessagesClient.tsx            # Client-side messages wrapper
│   ├── MyProfile.tsx                 # User profile
│   ├── PostMemory.tsx                # Memory posting
│   ├── PresenceProvider.tsx         # Presence context provider
│   ├── ProfileClient.tsx             # Client-side profile wrapper
│   ├── Radar.tsx                     # Friend discovery animation
│   ├── SearchClient.tsx              # Client-side search wrapper
│   ├── Searching.tsx                 # Search state component
│   ├── SessionSummary.tsx            # Session summary
│   ├── Settings.tsx                  # Settings component
│   ├── SettingsClient.tsx            # Client-side settings wrapper
│   ├── SpringRecap.tsx                # Seasonal recap
│   ├── TodayDetails.tsx              # Daily summary
│   └── UserProfile.tsx               # User profile view
├── hooks/                           # Custom React hooks
│   ├── usePresence.ts                # Presence tracking hook
│   └── useSwipeNavigation.ts        # Swipe navigation hook
├── lib/                              # Shared libraries
│   ├── prisma.ts                     # Prisma client instance
│   ├── services/
│   │   └── geminiService.ts          # Gemini AI service
│   └── types.ts                      # TypeScript type definitions
├── modules/                          # Feature modules
│   ├── friends/                      # Friend management
│   │   ├── actions.ts                # Server actions
│   │   ├── repository.ts             # Data access layer
│   │   └── service.ts                # Business logic
│   ├── interactions/                 # User interactions
│   ├── messages/                     # Messaging system
│   ├── posts/                        # Post management
│   ├── presence/                      # Presence tracking
│   ├── search/                       # Search functionality
│   ├── sessions/                     # Focus sessions
│   └── users/                        # User management
├── prisma/                           # Prisma configuration
│   ├── migrations/                   # Database migrations
│   ├── schema.prisma                 # Database schema
│   └── seed.ts                       # Database seed script
├── auth.ts                           # NextAuth configuration
├── middleware.ts                     # Next.js middleware
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Project dependencies
```

## Available Scripts

### Development

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

### Database

- `npm run db:generate` - Generate Prisma Client from schema
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with sample data

## API Routes

### Authentication

- `POST /api/auth/[...nextauth]` - NextAuth.js authentication endpoints

### AI Integration

- `POST /api/generate-chat-response` - Generate AI chat responses using Gemini
- `POST /api/generate-icebreaker` - Generate conversation starters

### Presence

- `POST /api/presence/heartbeat` - Update user heartbeat and last seen timestamp
- `GET /api/presence/status` - Get friends' online status
- `GET /api/presence/stream` - Server-Sent Events stream for real-time presence updates

### Image Upload

- `POST /api/upload` - Upload image files to Cloudinary (requires authentication, accepts multipart/form-data with 'file' field)

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: User accounts with authentication and profile information
- **Friend**: Friend relationships between users
- **FocusSession**: Focus session tracking and analytics
- **Post**: User-generated content and memories
- **Message**: Chat messages between users
- **Interaction**: User interaction history
- **Heartbeat**: Real-time presence tracking data
- **Account/Session**: NextAuth authentication models

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow the existing component structure (separate client/server components)
- Use Tailwind CSS for styling
- Implement proper error handling and loading states

### Adding New Features

1. Create feature module in `modules/` directory
2. Implement repository layer for data access
3. Add service layer for business logic
4. Create server actions for Next.js integration
5. Build React components in `components/` directory
6. Add API routes if needed in `app/api/`

### Database Changes

1. Update `prisma/schema.prisma`
2. Create migration: `npm run db:migrate`
3. Generate Prisma Client: `npm run db:generate`

## Deployment

### Vercel Deployment

The application is configured for easy deployment on Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Ensure all environment variables from `.env.local` are configured in your deployment platform:

- `DATABASE_URL` - Production database connection string
- `AUTH_SECRET` - Authentication secret
- `AUTH_URL` - Production application URL
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GEMINI_API_KEY` - Gemini API key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `NEXTAUTH_URL` - Production URL
- `NEXTAUTH_SECRET` - NextAuth secret

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on the repository.

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
