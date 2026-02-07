# Hyve 🔥

A frictionless social focus application designed for students to connect, focus together, and build meaningful relationships. Turn off your phone to fuel the hyve, earn rewards, and deepen connections without the pressure of constant social interaction.

## Overview

Hyve is a real-time social focus platform that combines productivity tracking with social connection. The application encourages users to maintain focus by tracking phone usage, while simultaneously building connections with friends through shared focus sessions, AI-powered conversations, and collaborative experiences.

This repository is a **monorepo** containing both the web application (Next.js) and mobile application (React Native/Expo), with shared code packages for maximum code reuse and maintainability.

## Project Structure

This is a monorepo managed with npm workspaces:

```
hyve/
├── apps/
│   ├── web/              # Next.js web application
│   │   └── README.md      # Web app setup and usage guide
│   └── mobile/           # Expo React Native iOS app
│       └── README.md      # Mobile app setup and usage guide
├── packages/
│   ├── types/            # Shared TypeScript type definitions
│   ├── utils/            # Shared utility functions
│   ├── shared/           # Shared business logic, services, API client
│   ├── hooks/            # Shared React hooks
│   └── ui/               # Shared UI components (React Native primitives)
├── package.json          # Root workspace configuration
└── README.md             # This file
```

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

- **Web Framework**: Next.js 15 with App Router
- **Mobile Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Web), React Native StyleSheet (Mobile)
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
- **Image Processing**: Next.js Image optimization, Cloudinary
- **Deployment**: Vercel-ready configuration (Web), Expo EAS Build (Mobile)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **PostgreSQL** 15 or higher (or use Docker Compose)
- **Xcode** (for iOS development, macOS only)
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))
- **Cloudinary Account** ([Sign up here](https://cloudinary.com/)) for image uploads

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hyve
```

### 2. Install Dependencies

Install dependencies for all workspaces (web, mobile, and shared packages):

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in `apps/web/` directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://myuser:mypassword@localhost:5433/hyve_db"

# Authentication
AUTH_SECRET="your-auth-secret-here" # Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Google OAuth (for authentication)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

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

For mobile app, create `apps/mobile/.env` or configure in `app.json`:

```bash
EXPO_PUBLIC_API_URL="http://localhost:3000"
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

2. Update the `DATABASE_URL` in your `apps/web/.env` file to match your local PostgreSQL configuration.

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Generate Prisma Client

```bash
npm run db:generate
```

### 7. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run db:seed
```

## Development

### Start Web Application

```bash
npm run dev:web
# or
npm run dev --workspace=apps/web
```

The web app will be available at [http://localhost:3000](http://localhost:3000).

See [apps/web/README.md](apps/web/README.md) for detailed web app documentation.

### Start Mobile Application

```bash
npm run dev:mobile
# or
npm run dev --workspace=apps/mobile
```

Then press `i` to open iOS Simulator (requires Xcode on macOS).

See [apps/mobile/README.md](apps/mobile/README.md) for detailed mobile app documentation.

## Available Scripts

### Root Level Scripts

- `npm run dev` - Start web development server
- `npm run dev:web` - Start web development server
- `npm run dev:mobile` - Start mobile development server
- `npm run build:web` - Build web application for production
- `npm run build:mobile` - Build mobile application
- `npm run lint` - Run ESLint on web app
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:reset` - Reset the database

## Code Sharing Strategy

This monorepo uses shared packages to maximize code reuse:

- **@hyve/types**: Shared TypeScript type definitions used across web and mobile
- **@hyve/utils**: Shared utility functions (distance calculations, time formatting, etc.)
- **@hyve/shared**: Shared business logic including API client, services, and modules
- **@hyve/hooks**: Shared React hooks that work in both web and mobile environments
- **@hyve/ui**: Shared UI components using React Native primitives (works in web via react-native-web)

### Important Notes

1. **Server Actions**: Next.js server actions cannot be used in React Native. All data operations must go through API routes.

2. **Prisma Client**: Prisma Client cannot run in React Native. All database operations must be done through API routes from the web app.

3. **API Client**: The `@hyve/shared` package includes an API client that automatically handles differences between web (relative URLs) and mobile (absolute URLs).

## Project Structure Details

### Apps

- **apps/web**: Next.js web application with server-side rendering, API routes, and server actions
- **apps/mobile**: Expo React Native application for iOS (and future Android support)

### Packages

- **packages/types**: Pure TypeScript type definitions, no dependencies
- **packages/utils**: Pure utility functions, no React or platform dependencies
- **packages/shared**: Business logic, API client, and services (some server-side code for web only)
- **packages/hooks**: React hooks with platform-specific adaptations where needed
- **packages/ui**: React Native primitive components that work in both web and mobile

## Deployment

### Web Application

Deploy the web app to Vercel or your preferred platform:

1. Push your code to a Git repository
2. Import the project in Vercel (point to `apps/web` directory)
3. Configure environment variables in Vercel dashboard
4. Deploy

### Mobile Application

Use Expo EAS Build to create iOS builds:

```bash
cd apps/mobile
eas build --platform ios
```

For App Store submission, you'll need an Apple Developer account ($99/year).

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

Built with ❤️ using Next.js, React Native, TypeScript, and modern web technologies.
