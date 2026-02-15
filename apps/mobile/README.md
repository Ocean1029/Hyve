# Hyve Mobile App

React Native (Expo) mobile app for Hyve. Calls the web backend APIs with Bearer token authentication.

## Prerequisites

- Node.js 18+
- Expo CLI (or `npx expo`)
- iOS Simulator (Xcode on macOS) or Android emulator
- Web backend running (see `apps/web`)

## Setup

### 1. Environment

Create `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
```

For local development, use your machine's LAN IP instead of `localhost` so the device/simulator can reach the API.

### 2. Google Sign-In (optional)

To use Google Sign-In, configure:

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` – same as `AUTH_GOOGLE_ID` in web
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` – iOS OAuth client ID (for native build)
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` – Android OAuth client ID (for native build)

In development, use **Dev: Sign in as Alex** (calls `/api/auth/mobile/dev-login`) when the web backend is running.

### 3. Run

```bash
# From repo root
npm run dev:mobile

# Or from apps/mobile
npx expo start
```

Press `i` for iOS Simulator or `a` for Android.

## Features

- **Auth**: Google Sign-In (idToken) or dev login
- **Dashboard**: Friends list, weekly focus minutes
- **Messages**: Friends list (chat coming soon)
- **Profile**: User info, logout
- **Presence**: Heartbeat every 30s, location every 60s
- **Upload**: `src/utils/upload.ts` – image upload with Bearer token
- **Location**: `src/utils/location.ts` – post location to backend

## API Client

Uses `@hyve/shared` `createApiClient` with `EXPO_PUBLIC_API_URL` and token from SecureStore. All requests include `Authorization: Bearer <token>`.

## Project Structure

```
apps/mobile/
├── App.tsx                 # Entry, AuthProvider, PresenceHeartbeat, LocationTracker
├── src/
│   ├── contexts/           # AuthContext
│   ├── navigation/         # AppNavigator, tabs
│   ├── screens/            # Login, Dashboard, Messages, Profile
│   ├── components/         # PresenceHeartbeat, LocationTracker
│   └── utils/              # upload, location
└── app.config.js           # Expo config, scheme
```
