/**
 * Dashboard screen — ver2 HomeScreen style.
 * Shows greeting, today's focus stats, friend circles, and floating start button.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Easing,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import type { Friend, ChartDataPoint } from '@hyve/types';
import HyveAvatar from '../components/ui/HyveAvatar';
import { Colors, Radius, Space, Shadows } from '../theme';

type RootStackParamList = {
  Main: undefined;
  FindFriends: undefined;
  FriendProfile: { friend: Friend };
  HappyIndex: undefined;
  FocusSession: { sessionId?: string; autoEntered?: boolean; startTime?: string } | undefined;
  SpringBloom: undefined;
};

const FRIEND_COLORS = [
  '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6',
  '#F97316', '#06B6D4', '#C9A86A', '#10B981',
];

function getDayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const { apiClient, user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  // Pulse animation for the floating button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleStartSoloSession = useCallback(async () => {
    if (!user?.id || startingSession) return;
    setStartingSession(true);
    const now = new Date();
    const placeholderEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      const res = await apiClient.post<{ sessionId: string }>(API_PATHS.SESSIONS, {
        userIds: [user.id],
        startTime: now.toISOString(),
        durationSeconds: 24 * 60 * 60,
        endTime: placeholderEnd.toISOString(),
      });
      navigation.navigate('FocusSession', {
        sessionId: res?.sessionId,
        autoEntered: true,
        startTime: now.toISOString(),
      });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to start session');
    } finally {
      setStartingSession(false);
    }
  }, [apiClient, user?.id, navigation, startingSession]);

  const load = async () => {
    try {
      const [friendsRes, chartRes] = await Promise.all([
        apiClient.get<{ friends: Friend[] }>(API_PATHS.FRIENDS_LIST),
        apiClient.get<{ chartData: ChartDataPoint[] }>(API_PATHS.SESSIONS_WEEKLY),
      ]);
      setFriends(friendsRes?.friends ?? []);
      setChartData(chartRes?.chartData ?? []);
    } catch {
      // keep previous state on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [apiClient]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const totalMinutes = chartData.reduce((s, d) => s + (d.minutes ?? 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const timeDisplay = totalHours > 0
    ? `${totalHours}h ${remainingMinutes}m`
    : `${remainingMinutes}m`;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>{getDayLabel()}</Text>
            <Text style={styles.greeting}>
              Hi, {user?.name?.split(' ')[0] ?? 'there'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.8}
          >
            <HyveAvatar
              uri={user?.image}
              name={user?.name}
              size={40}
              ringColor={Colors.goldDim}
            />
          </TouchableOpacity>
        </View>

        {/* Today stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardInner}>
            <View>
              <Text style={styles.statsLabel}>THIS WEEK</Text>
              <Text style={styles.statsValue}>{timeDisplay}</Text>
              <Text style={styles.statsSubLabel}>of focus time</Text>
            </View>
            <View style={styles.statsActions}>
              <TouchableOpacity
                style={styles.miniButton}
                onPress={() => navigation.navigate('HappyIndex')}
                activeOpacity={0.8}
              >
                <Text style={styles.miniButtonText}>Happy Index</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.miniButton}
                onPress={() => navigation.navigate('SpringBloom')}
                activeOpacity={0.8}
              >
                <Text style={styles.miniButtonText}>Spring Bloom</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Friends section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FRIENDS</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('FindFriends')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionAction}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {friends.length === 0 ? (
            <View style={styles.emptyFriends}>
              <Text style={styles.emptyText}>No friends yet.</Text>
              <TouchableOpacity
                style={styles.addFriendBtn}
                onPress={() => navigation.navigate('FindFriends')}
                activeOpacity={0.8}
              >
                <Text style={styles.addFriendText}>Find Friends</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.friendsRow}
            >
              {friends.map((friend, index) => {
                const ringColor = FRIEND_COLORS[index % FRIEND_COLORS.length];
                return (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.friendCircleItem}
                    onPress={() => navigation.navigate('FriendProfile', { friend })}
                    activeOpacity={0.75}
                  >
                    <HyveAvatar
                      uri={friend.avatar}
                      name={friend.name}
                      size={52}
                      ringColor={ringColor}
                    />
                    <Text style={styles.friendName} numberOfLines={1}>
                      {(friend.name ?? 'Unknown').split(' ')[0]}
                    </Text>
                    {(friend.totalHours ?? 0) > 0 && (
                      <Text style={styles.friendHours}>
                        {friend.totalHours}h
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Floating focus button */}
      <Animated.View
        style={[
          styles.floatingButtonWrap,
          { bottom: 80 },
          { transform: [{ scale: startingSession ? 1 : pulseAnim }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.floatingButton, startingSession && styles.floatingButtonDisabled]}
          onPress={handleStartSoloSession}
          disabled={startingSession}
          activeOpacity={0.9}
        >
          {startingSession ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.floatingButtonText}>▶</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg1,
  },
  scrollContent: {
    paddingHorizontal: Space.lg,
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: Space.md,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '300',
    color: Colors.text1,
    letterSpacing: -0.5,
  },

  // Stats card
  statsCard: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.xxxl,
    padding: Space.xl,
    marginBottom: Space.xl,
    ...Shadows.soft,
  },
  statsCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.gold,
    letterSpacing: -1,
  },
  statsSubLabel: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 2,
  },
  statsActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  miniButton: {
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  miniButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text3,
    letterSpacing: 0.3,
  },

  // Section
  section: {
    marginBottom: Space.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1.8,
  },
  sectionAction: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 0.3,
  },

  // Friends
  friendsRow: {
    gap: Space.lg,
    paddingBottom: Space.sm,
  },
  friendCircleItem: {
    alignItems: 'center',
    gap: Space.xs,
    width: 60,
  },
  friendName: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text3,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  friendHours: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.goldDim,
    letterSpacing: 0.3,
  },
  emptyFriends: {
    alignItems: 'center',
    paddingVertical: Space.xxl,
    gap: Space.md,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.muted,
  },
  addFriendBtn: {
    backgroundColor: Colors.goldFaint,
    borderWidth: 1,
    borderColor: Colors.goldDim,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  addFriendText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 0.5,
  },

  // Floating button
  floatingButtonWrap: {
    position: 'absolute',
    right: 24,
  },
  floatingButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.gold,
  },
  floatingButtonDisabled: {
    opacity: 0.6,
  },
  floatingButtonText: {
    fontSize: 20,
    color: '#000',
    fontWeight: '700',
  },
});
