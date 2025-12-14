# Hyve 🔥

A Next.js app focused on helping friends connect and focus together in real-time.

## Features

- 📱 **Horizontal Navigation**: Swipe between Messages, Dashboard, and Profile
- 💬 **Real-time Chat**: AI-powered chat interface with friends using Gemini AI
- 🔥 **Focus Sessions**: Start hyve sessions and track focus time
- 📊 **Analytics Dashboard**: Visualize weekly focus patterns with advanced charts
- 😊 **Happy Index**: Track and rate your experiences
- 🌸 **Seasonal Features**: Spring Recap and more
- 📸 **Memory Posting**: Capture and share moments after focus sessions

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **AI**: Google Gemini 2.5 Flash

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
hyve/
├── app/
│   ├── api/
│   │   ├── generate-icebreaker/    # API route for ice breaker generation
│   │   └── generate-chat-response/ # API route for chat responses
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Main app component
├── components/
│   ├── BottomNav.tsx              # Bottom navigation bar
│   ├── Hyve.tsx                   # Animated hyve component
│   ├── ChatInterface.tsx          # Real-time chat UI
│   ├── Dashboard.tsx              # Main dashboard with charts
│   ├── FriendProfile.tsx          # Friend profile view
│   ├── HappyIndex.tsx             # Happiness tracking
│   ├── Messages.tsx               # Messages list view
│   ├── MyProfile.tsx              # User profile
│   ├── PostMemory.tsx             # Post session memory
│   ├── Radar.tsx                  # Friend discovery animation
│   ├── Settings.tsx               # App settings
│   ├── SpringRecap.tsx            # Seasonal recap
│   └── TodayDetails.tsx           # Daily summary
├── lib/
│   ├── services/
│   │   └── geminiService.ts       # Gemini AI integration
│   └── types.ts                   # TypeScript type definitions
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
