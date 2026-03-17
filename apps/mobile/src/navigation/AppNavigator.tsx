/**
 * Root navigator. Shows Login or main app (tabs) based on auth state.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import FriendProfileScreen from '../screens/FriendProfileScreen';
import { ActivityIndicator, View, StyleSheet, Platform, Image } from 'react-native';
import { Home, Users } from '../components/icons';
import { Colors, Shadows } from '../theme';

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
  const { user } = useAuth();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(12, 13, 16, 0.97)',
          borderTopColor: Colors.glassBorder,
          borderTopWidth: 1,
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
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[
              tabStyles.avatarWrap,
              focused && tabStyles.avatarActive,
            ]}>
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={tabStyles.avatar}
                />
              ) : (
                <View style={tabStyles.avatarPlaceholder}>
                  <Users color={focused ? Colors.gold : Colors.text3} size={16} />
                </View>
              )}
            </View>
          ),
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
      <NavigationContainer ref={navigationRef}>
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

const tabStyles = StyleSheet.create({
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarActive: {
    borderColor: Colors.gold,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
