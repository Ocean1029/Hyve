/**
 * Login screen. Supports Google Sign-In (idToken) and dev-only test login.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    responseType: 'id_token',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success' && response.params?.id_token) {
      handleGoogleIdToken(response.params.id_token);
    } else if (response?.type === 'error') {
      setLoading(false);
      Alert.alert('Sign in failed', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  async function handleGoogleIdToken(idToken: string) {
    setLoading(true);
    try {
      const apiUrl = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/auth/mobile/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error ?? 'Login failed');
      }
      await login(data.sessionToken, data.user);
    } catch (e) {
      setLoading(false);
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function handleDevLogin() {
    setTestLoading(true);
    try {
      const apiUrl = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/auth/mobile/dev-login`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error ?? 'Dev login failed');
      }
      await login(data.sessionToken, data.user);
    } catch (e) {
      Alert.alert('Dev login failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hyve</Text>
      <Text style={styles.subtitle}>Connect with friends through shared focus</Text>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => promptAsync()}
        disabled={!request || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>

      {__DEV__ && (
        <TouchableOpacity
          style={[styles.testButton, testLoading && styles.buttonDisabled]}
          onPress={handleDevLogin}
          disabled={testLoading}
        >
          {testLoading ? (
            <ActivityIndicator color="#666" />
          ) : (
            <Text style={styles.testButtonText}>Dev: Sign in as Alex</Text>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.hint}>
        Set EXPO_PUBLIC_API_URL to your backend (e.g. http://192.168.1.100:3000)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#4285f4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  testButtonText: {
    color: '#666',
    fontSize: 14,
  },
  hint: {
    marginTop: 48,
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
});
