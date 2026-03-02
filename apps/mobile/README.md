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

Create OAuth 2.0 Client IDs in [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials:

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Web application client ID. Same as `AUTH_GOOGLE_ID` in `apps/web/.env`. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS OAuth client ID. Used on iOS simulator and device. |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android OAuth client ID. Used on Android. |

**Backend must accept the same client IDs.** Add to `apps/web/.env`:

- `AUTH_GOOGLE_IOS_CLIENT_ID` = same value as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `AUTH_GOOGLE_ANDROID_CLIENT_ID` = same value as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

Without these, the backend returns 401 "Token audience mismatch" because the id_token's `aud` will not match the allowed list.

**Redirect URIs** (Google Cloud Console → Credentials → your OAuth client → Authorized redirect URIs):

- Expo Go: `exp://<YOUR_IP>:8081` (e.g. `exp://192.168.1.100:8081`)
- Development build: `hyve://redirect`

In development, use **Dev: Sign in as Alex** (calls `/api/auth/mobile/dev-login`) when the web backend is running.

### 3. Run

```bash
# From repo root
npm run dev:mobile

# Or from apps/mobile
npx expo start
```

Press `i` for iOS Simulator or `a` for Android.

### 4. JSC vs Expo Go

Expo Go uses Hermes as the JavaScript engine. The Hyve mobile app configures `jsEngine: 'jsc'` (JavaScriptCore) to avoid FormData-related issues (e.g. image upload). JSC only applies when you run a **development build**, not when using Expo Go.

- **Expo Go**: Uses Hermes. Some features (e.g. FormData upload) may fail.
- **Development build**: Uses JSC. Run `npx expo prebuild` then `npx expo run:ios` to create a dev build with JSC.

For image upload and other FormData-dependent features, use a development build:

```bash
# From apps/mobile
npx expo prebuild
npx expo run:ios
```

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
