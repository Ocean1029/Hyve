/**
 * Expo app config. EXPO_PUBLIC_API_URL can be set via .env or environment.
 * For local dev: use your machine's LAN IP (e.g. http://192.168.1.100:3000)
 */
export default {
  expo: {
    name: 'hyve-mobile',
    slug: 'hyve-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'hyve',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.hyve.mobile'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      package: 'com.hyve.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    },
    plugins: [
      'expo-secure-store',
      'expo-web-browser',
    ],
  },
};
