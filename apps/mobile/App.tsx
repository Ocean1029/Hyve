/**
 * Hyve mobile app entry. AuthProvider wraps the navigator.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import PresenceHeartbeat from './src/components/PresenceHeartbeat';
import LocationTracker from './src/components/LocationTracker';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PresenceHeartbeat />
        <LocationTracker />
        <AppNavigator />
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
