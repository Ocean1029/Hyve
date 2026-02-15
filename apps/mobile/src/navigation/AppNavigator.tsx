/**
 * Root navigator. Shows Login or main app (tabs) based on auth state.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList, MessagesStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import ChatScreen from '../screens/ChatScreen';
import FindFriendsScreen from '../screens/FindFriendsScreen';
import TodayScreen from '../screens/TodayScreen';
import HappyIndexScreen from '../screens/HappyIndexScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FocusSessionScreen from '../screens/FocusSessionScreen';
import PostMemoryScreen from '../screens/PostMemoryScreen';
import SpringBloomScreen from '../screens/SpringBloomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MessagesStackNavigator = createNativeStackNavigator<MessagesStackParamList>();

function MessagesStack() {
  return (
    <MessagesStackNavigator.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
      }}
    >
      <MessagesStackNavigator.Screen
        name="MessagesList"
        component={MessagesListScreen}
        options={{ title: 'Messages', headerShown: true }}
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
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#222' },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ title: 'Today', tabBarLabel: 'Today' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{ title: 'Messages', tabBarLabel: 'Messages', headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
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
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="HappyIndex"
              component={HappyIndexScreen}
              options={{
                headerShown: true,
                headerTitle: 'Happy Index',
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Settings',
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="FocusSession"
              component={FocusSessionScreen}
              options={{
                headerShown: true,
                headerTitle: 'Focus Session',
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="PostMemory"
              component={PostMemoryScreen}
              options={{
                headerShown: true,
                headerTitle: 'Add Memory',
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="SpringBloom"
              component={SpringBloomScreen}
              options={{
                headerShown: true,
                headerTitle: 'Spring Bloom',
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
