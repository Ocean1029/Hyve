/**
 * Root navigator. Shows Login or main app (tabs) based on auth state.
 */
import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList, MessagesStackParamList } from './types';
import SessionPolling from '../components/SessionPolling';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import ChatScreen from '../screens/ChatScreen';
import FindFriendsScreen from '../screens/FindFriendsScreen';
import HappyIndexScreen from '../screens/HappyIndexScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FocusSessionScreen from '../screens/FocusSessionScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';
import PostMemoryScreen from '../screens/PostMemoryScreen';
import SpringBloomScreen from '../screens/SpringBloomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MapScreen from '../screens/MapScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { Home, Users, Map, CircleUser } from '../components/icons';
import { Colors, Shadows } from '../theme';

const HyveDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bg0,
    card: Colors.bg1,
    border: Colors.glassBorder,
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MessagesStackNavigator = createNativeStackNavigator<MessagesStackParamList>();

function MessagesStack() {
  return (
    <MessagesStackNavigator.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg1 },
        headerTintColor: Colors.ivory,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <MessagesStackNavigator.Screen
        name="MessagesList"
        component={MessagesListScreen}
        options={{ title: 'Messages', headerShown: false }}
      />
      <MessagesStackNavigator.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: true }}
      />
    </MessagesStackNavigator.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      sceneContainerStyle={{ backgroundColor: Colors.bg0 }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.bg1,
          borderTopColor: Colors.glassBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 72 : 56,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
            },
            android: { elevation: 16 },
          }),
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.text3,
      }}
    >
      <Tab.Screen
        name="Friends"
        component={MessagesStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <CircleUser color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export const navigationRef = React.createRef<NavigationContainerRefWithCurrent<RootStackParamList>>();

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <>
      {isAuthenticated && <SessionPolling navigationRef={navigationRef} />}
      <NavigationContainer ref={navigationRef} theme={HyveDarkTheme}>
        <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg0 },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="FindFriends"
              component={FindFriendsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Find Friends',
                headerStyle: { backgroundColor: Colors.bg1 },
                headerTintColor: Colors.ivory,
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="FriendProfile"
              component={FriendProfileScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerStyle: { backgroundColor: Colors.bg1 },
                headerTintColor: Colors.ivory,
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="HappyIndex"
              component={HappyIndexScreen}
              options={{
                headerShown: true,
                headerTitle: 'Happy Index',
                headerStyle: { backgroundColor: Colors.bg1 },
                headerTintColor: Colors.ivory,
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Settings',
                headerStyle: { backgroundColor: Colors.bg1 },
                headerTintColor: Colors.ivory,
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="FocusSession"
              component={FocusSessionScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="SessionSummary"
              component={SessionSummaryScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="PostMemory"
              component={PostMemoryScreen}
              options={{
                headerShown: true,
                headerTitle: 'Add Memory',
                headerStyle: { backgroundColor: Colors.bg1 },
                headerTintColor: Colors.ivory,
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
            <Stack.Screen
              name="SpringBloom"
              component={SpringBloomScreen}
              options={{
                headerShown: true,
                headerTitle: 'Spring Bloom',
                headerStyle: { backgroundColor: Colors.bg1 },
                headerTintColor: Colors.ivory,
                headerBackButtonDisplayMode: 'minimal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg1,
  },
});
