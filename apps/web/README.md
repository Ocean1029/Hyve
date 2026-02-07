# Hyve Web Application

Next.js web application for Hyve - a social focus platform.

## Overview

This is the web version of Hyve, built with Next.js 15, TypeScript, and Tailwind CSS. It provides a full-featured web experience with server-side rendering, API routes, and real-time updates.

## Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher
- PostgreSQL 15 or higher (or use Docker Compose)
- Google Gemini API Key
- Cloudinary Account

## Installation

### 1. Install Dependencies

From the root of the monorepo:

```bash
npm install
```

This will install dependencies for all workspaces including the web app.

### 2. Set Up Environment Variables

Create a `.env` file in `apps/web/` directory:

```bash
# Database
DATABASE_URL="postgresql://myuser:mypassword@localhost:5433/hyve_db"

# Authentication
AUTH_SECRET="your-auth-secret-here" # Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# AI Integration
GEMINI_API_KEY="your-gemini-api-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here" # Generate with: openssl rand -base64 32
```

### 3. Set Up Database

#### Using Docker Compose (Recommended)

From the root of the monorepo:

```bash
docker-compose up -d
```

#### Using Local PostgreSQL

1. Create a database:
```sql
CREATE DATABASE hyve_db;
```

2. Update `DATABASE_URL` in `.env` file.

### 4. Run Database Migrations

From the root of the monorepo:

```bash
npm run db:migrate
```

### 5. Generate Prisma Client

```bash
npm run db:generate
```

### 6. Seed Database (Optional)

```bash
npm run db:seed
```

## Development

### Start Development Server

From the root of the monorepo:

```bash
npm run dev:web
```

Or from `apps/web/` directory:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run db:generate` - Generate Prisma Client from schema
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database with sample data
- `npm run db:reset` - Reset the database

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router directory
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth authentication routes
│   │   ├── generate-chat-response/  # AI chat response generation
│   │   ├── generate-icebreaker/     # AI ice breaker generation
│   │   ├── presence/        # Real-time presence API
│   │   └── sessions/       # Focus session API
│   ├── login/              # Login page
│   ├── messages/           # Messages pages
│   ├── profile/            # User profile page
│   ├── search/              # Friend search page
│   ├── settings/           # Settings page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── common/              # Common components
│   ├── dashboard/           # Dashboard components
│   ├── focus/               # Focus mode components
│   ├── friends/             # Friend management components
│   ├── messages/            # Chat components
│   ├── profile/             # Profile components
│   └── search/              # Search components
├── hooks/                   # Custom React hooks (legacy, use @hyve/hooks)
├── lib/                     # Local libraries
│   ├── prisma.ts            # Prisma client instance
│   └── services/            # Local services
├── modules/                 # Feature modules (legacy, use @hyve/shared)
├── prisma/                  # Prisma configuration
│   ├── migrations/          # Database migrations
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seed script
├── auth.ts                  # NextAuth configuration
├── middleware.ts            # Next.js middleware
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Using Shared Packages

This web app uses shared packages from the monorepo:

- `@hyve/types` - Type definitions
- `@hyve/utils` - Utility functions
- `@hyve/shared` - Business logic and API client
- `@hyve/hooks` - React hooks
- `@hyve/ui` - UI components

Import them like this:

```typescript
import { Friend, ChatMessage } from '@hyve/types';
import { formatTime } from '@hyve/utils';
import { apiGet, apiPost } from '@hyve/shared';
import { usePresence } from '@hyve/hooks';
```

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

### Sessions

- `GET /api/sessions/stream` - Stream active focus sessions
- `GET /api/sessions/[sessionId]/status` - Get session status
- `POST /api/sessions/[sessionId]/pause` - Pause a session
- `POST /api/sessions/[sessionId]/end` - End a session

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

1. Create feature module in `modules/` directory (or use `@hyve/shared`)
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
3. Set the root directory to `apps/web`
4. Configure environment variables in Vercel dashboard
5. Deploy

### Environment Variables for Production

Ensure all environment variables from `.env` are configured in your deployment platform:

- `DATABASE_URL` - Production database connection string
- `AUTH_SECRET` - Authentication secret
- `AUTH_URL` - Production application URL
- `AUTH_GOOGLE_ID` - Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth client secret
- `GEMINI_API_KEY` - Gemini API key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `NEXTAUTH_URL` - Production URL
- `NEXTAUTH_SECRET` - NextAuth secret

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, Next.js will automatically use the next available port. Check the terminal output for the actual URL.

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Verify database exists: `psql -U myuser -d hyve_db`

### Prisma Client Not Generated

Run `npm run db:generate` after schema changes or migrations.

## Support

For issues specific to the web application, please check the root [README.md](../../README.md) or open an issue on the repository.
