/**
 * Dashboard screen — v1 HomeScreen style.
 * Shows greeting, expandable today stats with timeline,
 * friend circles with badges, floating start button, and insight ticker.
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
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronDown, ChevronRight, Play } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import type { Friend, ChartDataPoint, SessionListItem, TodaySessionsResponse } from '@hyve/types';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import HyveAvatar from '../components/ui/HyveAvatar';
import BuildingMarker from '../components/map/BuildingMarker';
import { MOCK_PLACES, TAIPEI_REGION, DARK_MAP_STYLE } from '../data/mockMapData';
import { Colors, Radius, Space, Shadows } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

const INSIGHTS = [
  'Sunday is your day',
  'You focus best in the afternoon',
  'You and Emily bonded 3x this week',
  'Your streak is on fire — 7 days!',
];

function getDayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).toUpperCase();
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const { apiClient, user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [todaySessions, setTodaySessions] = useState<SessionListItem[]>([]);
  const [todayTotalMinutes, setTodayTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [isTodayExpanded, setIsTodayExpanded] = useState(false);
  const [tooltipFriendId, setTooltipFriendId] = useState<string | null>(null);
  const [insightIndex, setInsightIndex] = useState(0);

  // Pulse animation for the floating button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const chevronRotation = useRef(new Animated.Value(0)).current;
  const insightOpacity = useRef(new Animated.Value(1)).current;

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

  // Insight ticker cycling
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(insightOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setInsightIndex(prev => (prev + 1) % INSIGHTS.length);
        Animated.timing(insightOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [insightOpacity]);

  const toggleTodayExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsTodayExpanded(prev => !prev);
    Animated.timing(chevronRotation, {
      toValue: isTodayExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isTodayExpanded, chevronRotation]);

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
    }

    // Fetch today sessions independently so failure doesn't block friends/chart
    try {
      const todayRes = await apiClient.get<TodaySessionsResponse>(API_PATHS.SESSIONS_TODAY);
      setTodaySessions(todayRes?.sessions ?? []);
      setTodayTotalMinutes(todayRes?.totalMinutes ?? 0);
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

  const todayHours = Math.floor(todayTotalMinutes / 60);
  const todayMins = todayTotalMinutes % 60;
  const todayTimeDisplay = todayHours > 0
    ? `${todayHours}h ${todayMins}m`
    : `${todayMins}m`;

  const chevronSpin = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

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

        {/* Expandable Today Stats Card */}
        <TouchableOpacity
          style={styles.statsCard}
          onPress={toggleTodayExpanded}
          activeOpacity={0.85}
        >
          {/* Collapsed header row */}
          <View style={styles.statsCollapsedRow}>
            <View style={styles.statsLeftGroup}>
              <Text style={styles.statsValue}>{todayTimeDisplay}</Text>
              <Text style={styles.statsLabel}>Today</Text>
            </View>
            <Animated.View
              style={[
                styles.chevronCircle,
                { transform: [{ rotate: chevronSpin }] },
              ]}
            >
              <ChevronDown size={14} color={Colors.text2} />
            </Animated.View>
          </View>

          {/* Expanded timeline */}
          {isTodayExpanded && (
            <View style={styles.timelineWrap}>
              <View style={styles.timelineDivider} />
              {todaySessions.length === 0 ? (
                <Text style={styles.timelineEmpty}>No sessions today yet.</Text>
              ) : (
                todaySessions.map((session, i) => {
                  const isRight = i % 2 === 0;
                  const color = FRIEND_COLORS[i % FRIEND_COLORS.length];
                  const mins = session.minutes ?? 0;

                  return (
                    <View key={session.id} style={styles.timelineRow}>
                      {/* Center dot */}
                      <View style={[styles.timelineDot, { borderColor: color }]} />

                      {/* Left side */}
                      <View style={[styles.timelineSide, styles.timelineLeft]}>
                        {isRight ? (
                          <View style={styles.timelineLabelWrap}>
                            <Text style={styles.timelineTime}>
                              {formatSessionTime(session.startTime)}
                            </Text>
                            {session.endTime && (
                              <Text style={styles.timelineTimeSub}>
                                - {formatSessionTime(session.endTime)}
                              </Text>
                            )}
                          </View>
                        ) : (
                          <View style={[styles.sessionCard, {
                            backgroundColor: `${color}10`,
                            borderColor: `${color}30`,
                            borderTopRightRadius: 4,
                          }]}>
                            <Text style={styles.sessionCardMins}>{mins}m</Text>
                            <Text style={[styles.sessionCardStatus, { color }]}>
                              {session.status === 'active' ? 'ACTIVE' : 'COMPLETED'}
                            </Text>
                            {/* Watermark */}
                            <Text style={[styles.sessionWatermark, { color }]}>
                              {mins}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Right side */}
                      <View style={[styles.timelineSide, styles.timelineRight]}>
                        {isRight ? (
                          <View style={[styles.sessionCard, {
                            backgroundColor: `${color}10`,
                            borderColor: `${color}30`,
                            borderTopLeftRadius: 4,
                          }]}>
                            <Text style={styles.sessionCardMins}>{mins}m</Text>
                            <Text style={[styles.sessionCardStatus, { color }]}>
                              {session.status === 'active' ? 'ACTIVE' : 'COMPLETED'}
                            </Text>
                            <Text style={[styles.sessionWatermark, { color }]}>
                              {mins}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.timelineLabelWrap}>
                            <Text style={styles.timelineTime}>
                              {formatSessionTime(session.startTime)}
                            </Text>
                            {session.endTime && (
                              <Text style={styles.timelineTimeSub}>
                                - {formatSessionTime(session.endTime)}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Friends section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MY CIRCLE</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate('FindFriends')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionAction}>See all</Text>
              <ChevronRight size={10} color={Colors.text3} />
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
                const momentsCount = friend.recentMemories?.length ?? 0;
                const isTooltipVisible = tooltipFriendId === friend.id;

                return (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.friendCircleItem}
                    onPress={() => navigation.navigate('FriendProfile', { friend })}
                    onLongPress={() => {
                      setTooltipFriendId(friend.id);
                      setTimeout(() => setTooltipFriendId(null), 2500);
                    }}
                    activeOpacity={0.75}
                    delayLongPress={400}
                  >
                    {/* Tooltip */}
                    {isTooltipVisible && (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipName}>{friend.name}</Text>
                        <Text style={styles.tooltipSub}>
                          {momentsCount === 0
                            ? 'No saved moments yet'
                            : `${momentsCount} saved moments (7d)`}
                        </Text>
                        <View style={styles.tooltipArrow} />
                      </View>
                    )}

                    {/* Avatar with badge */}
                    <View>
                      <HyveAvatar
                        uri={friend.avatar}
                        name={friend.name}
                        size={56}
                        ringColor={ringColor}
                      />
                      {momentsCount > 0 && (
                        <View style={styles.badge}>
                          <View style={styles.badgeGlow} />
                          <View style={styles.badgeInner}>
                            <Text style={styles.badgeText}>{momentsCount}</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    <Text style={styles.friendName} numberOfLines={1}>
                      {(friend.name ?? 'Unknown').split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Map Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MAP</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => (navigation as any).navigate('Map')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionAction}>Explore</Text>
              <ChevronRight size={10} color={Colors.text3} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => (navigation as any).navigate('Map')}
            style={styles.mapCard}
          >
            <MapView
              style={styles.mapView}
              provider={PROVIDER_DEFAULT}
              initialRegion={TAIPEI_REGION}
              customMapStyle={DARK_MAP_STYLE}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              showsUserLocation={false}
              showsCompass={false}
              showsScale={false}
              toolbarEnabled={false}
              pointerEvents="none"
            >
              {MOCK_PLACES.map((place) => (
                <BuildingMarker
                  key={place.id}
                  place={place}
                  onPress={() => {}}
                />
              ))}
            </MapView>
          </TouchableOpacity>
        </View>

        {/* Insight Ticker */}
        <Animated.View style={[styles.insightWrap, { opacity: insightOpacity }]}>
          <Text style={styles.insightText}>"{INSIGHTS[insightIndex]}"</Text>
        </Animated.View>
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
            <Play size={30} fill="#000" color="#000" style={{ marginLeft: 3 }} />
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
    paddingHorizontal: Space.lg + 8,
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Space.lg,
    paddingBottom: Space.xl,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text3,
    letterSpacing: 2,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.text1,
    letterSpacing: -0.5,
  },

  // Expandable stats card
  statsCard: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.xxl,
    marginBottom: Space.xxl,
    overflow: 'hidden',
  },
  statsCollapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Space.xl,
    height: 64,
  },
  statsLeftGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.text1,
    letterSpacing: -1,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text3,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Timeline (expanded)
  timelineWrap: {
    paddingHorizontal: Space.lg,
    paddingBottom: Space.lg,
    paddingTop: Space.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  timelineDivider: {
    position: 'absolute',
    left: '50%',
    top: Space.xs,
    bottom: Space.lg,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Space.lg,
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: Colors.bg1,
    zIndex: 10,
  },
  timelineSide: {
    flex: 1,
  },
  timelineLeft: {
    paddingRight: 20,
    alignItems: 'flex-end',
  },
  timelineRight: {
    paddingLeft: 20,
    alignItems: 'flex-start',
  },
  timelineLabelWrap: {
    paddingTop: 4,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text1,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  timelineTimeSub: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text3,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
    opacity: 0.6,
  },
  timelineEmpty: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Space.md,
  },

  // Session card (timeline item)
  sessionCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    width: 120,
    overflow: 'hidden',
    position: 'relative',
  },
  sessionCardMins: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text1,
  },
  sessionCardStatus: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  sessionWatermark: {
    position: 'absolute',
    right: -2,
    bottom: -8,
    fontSize: 42,
    fontWeight: '900',
    opacity: 0.12,
  },

  // Section
  section: {
    marginBottom: Space.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
    paddingHorizontal: Space.xs,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text3,
    letterSpacing: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionAction: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text3,
    opacity: 0.6,
  },

  // Friends
  friendsRow: {
    gap: 16,
    paddingTop: Space.md,
    paddingBottom: Space.md,
  },
  friendCircleItem: {
    alignItems: 'center',
    gap: Space.sm,
    width: 72,
    position: 'relative',
  },
  friendName: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text2,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Badge
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlow: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(201,168,106,0.5)',
  },
  badgeInner: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    backgroundColor: Colors.bg0,
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.7)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.gold,
  },

  // Tooltip
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -50 }],
    marginBottom: 8,
    backgroundColor: 'rgba(18,19,25,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    zIndex: 100,
    minWidth: 100,
    ...Shadows.soft,
  },
  tooltipName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text1,
  },
  tooltipSub: {
    fontSize: 8,
    fontWeight: '500',
    color: Colors.text3,
    marginTop: 1,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: 'rgba(18,19,25,0.92)',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    transform: [{ rotate: '45deg' }],
  },

  // Empty friends
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

  // Map preview
  mapCard: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
  },
  mapView: {
    height: 160,
    borderRadius: Radius.xxl,
  },

  // Insight Ticker
  insightWrap: {
    alignItems: 'center',
    paddingVertical: Space.lg,
  },
  insightText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text3,
    fontStyle: 'italic',
  },

  // Floating button
  floatingButtonWrap: {
    position: 'absolute',
    right: 24,
  },
  floatingButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    ...Platform.select({
      ios: {
        shadowColor: '#C9A86A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 40,
      },
      android: { elevation: 12 },
    }),
  },
  floatingButtonDisabled: {
    opacity: 0.6,
  },
});
