/**
 * Profile screen — v1 design language.
 * Large avatar with floating metric capsules, expandable album grid,
 * latest hangout card, spot ranking, and activity breakdown.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import HyveAvatar from '../components/ui/HyveAvatar';
import GlassCard from '../components/ui/GlassCard';
import { Settings, Clock, Users, Globe, Building } from '../components/icons';
import { Colors, Radius, Space, Shadows } from '../theme';
import MetricCapsule from '../components/profile/MetricCapsule';
import LatestHangoutCard from '../components/profile/LatestHangoutCard';
import SpotRankingList from '../components/profile/SpotRankingList';
import ActivityBreakdown from '../components/profile/ActivityBreakdown';
import {
  MOCK_HANGOUT,
  MOCK_SPOTS,
  MOCK_ACTIVITIES,
} from '../components/profile/mockData';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
};

interface Stats {
  totalSessions?: number;
  totalMemories?: number;
  totalMinutes?: number;
}

interface Memory {
  id: string;
  content?: string | null;
  timestamp?: string;
  photos?: { id: string; photoUrl: string }[];
}

const AVATAR_SIZE = 140;
const COLLAPSED_ALBUM_COUNT = 9;

export default function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const insets = useSafeAreaInsets();
  const { user, apiClient } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [albumExpanded, setAlbumExpanded] = useState(false);

  // Fade-in animation for album items
  const fadeAnims = useRef<Animated.Value[]>([]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const [statsRes, memoriesRes, friendsRes] = await Promise.all([
        apiClient.get<{ success: boolean; stats?: Stats }>(
          API_PATHS.USER_STATS(user.id),
        ),
        apiClient.get<{ success: boolean; memories?: Memory[] }>(
          `${API_PATHS.MEMORIES_PEAK_HAPPINESS}?limit=27`,
        ),
        apiClient.get<{ friends?: unknown[] }>(API_PATHS.FRIENDS_LIST),
      ]);
      setStats(statsRes?.stats ?? null);
      setMemories(memoriesRes?.memories ?? []);
      setFriendCount((friendsRes?.friends ?? []).length);
    } catch {
      setStats(null);
      setMemories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id, apiClient]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const totalHours = stats?.totalMinutes
    ? Math.floor(stats.totalMinutes / 60)
    : 0;

  const toggleAlbum = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAlbumExpanded((prev) => !prev);
  }, []);

  const displayedMemories = albumExpanded
    ? memories
    : memories.slice(0, COLLAPSED_ALBUM_COUNT);

  // Ensure enough fade values for displayed memories
  while (fadeAnims.current.length < displayedMemories.length) {
    fadeAnims.current.push(new Animated.Value(0));
  }

  useEffect(() => {
    const anims = displayedMemories.map((_, i) =>
      Animated.timing(fadeAnims.current[i], {
        toValue: 1,
        duration: 250,
        delay: i * 40,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(40, anims).start();
  }, [displayedMemories.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top bar — settings button */}
        <View style={styles.topBar}>
          <View />
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsBtn}
            activeOpacity={0.75}
          >
            <Settings color={Colors.text3} size={20} />
          </TouchableOpacity>
        </View>

        {/* Avatar section with floating capsules */}
        <View style={styles.avatarSection}>
          {/* Gold glow behind avatar */}
          <View style={styles.avatarGlow} pointerEvents="none" />

          <HyveAvatar
            uri={user?.image}
            name={user?.name}
            size={AVATAR_SIZE}
            online
            ringColor={Colors.gold}
          />

          {/* Floating metric capsules */}
          <MetricCapsule
            icon={Clock}
            value={loading ? '–' : `${totalHours}h`}
            label="HOURS"
            themeColor={Colors.gold}
            position={{ top: 0, left: 12 }}
            delay={0}
          />
          <MetricCapsule
            icon={Building}
            value={loading ? '–' : String(stats?.totalSessions ?? 0)}
            label="SESSIONS"
            themeColor={Colors.gold}
            position={{ top: 0, right: 12 }}
            delay={500}
          />
          <MetricCapsule
            icon={Users}
            value={loading ? '–' : String(friendCount)}
            label="CIRCLE"
            themeColor={Colors.gold}
            position={{ bottom: 24, left: 12 }}
            delay={1000}
          />
          <MetricCapsule
            icon={Globe}
            value="—"
            label="MAP"
            themeColor={Colors.gold}
            position={{ bottom: 24, right: 12 }}
            delay={1500}
          />
        </View>

        {/* Name + handle */}
        <View style={styles.identity}>
          <Text style={styles.displayName}>
            {(user?.name ?? 'User').toUpperCase()}
          </Text>
          <Text style={styles.handle}>
            @{user?.userId ?? user?.id ?? 'unknown'}
          </Text>
        </View>

        {/* Stage 2 container */}
        <View style={styles.stage2}>
          {/* Pill handle */}
          <View style={styles.pillHandle} />

          {/* Album grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MY ALBUM</Text>
              {memories.length > COLLAPSED_ALBUM_COUNT && (
                <TouchableOpacity onPress={toggleAlbum} activeOpacity={0.7}>
                  <Text style={styles.seeMore}>
                    {albumExpanded ? 'Show Less' : 'See More ›'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator
                size="small"
                color={Colors.gold}
                style={{ marginVertical: 24 }}
              />
            ) : memories.length > 0 ? (
              <View style={styles.memoriesGrid}>
                {displayedMemories.map((m, i) => (
                  <Animated.View
                    key={m.id}
                    style={[
                      styles.memoryThumb,
                      { opacity: fadeAnims.current[i] ?? 1 },
                    ]}
                  >
                    {m.photos?.[0]?.photoUrl ? (
                      <Image
                        source={{ uri: m.photos[0].photoUrl }}
                        style={styles.memoryThumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.memoryThumbImage,
                          styles.memoryPlaceholder,
                        ]}
                      >
                        <Text style={styles.memoryPlaceholderText}>✦</Text>
                      </View>
                    )}
                  </Animated.View>
                ))}
              </View>
            ) : (
              <GlassCard style={styles.emptyAlbum} radius={Radius.xxl}>
                <Text style={styles.emptyAlbumText}>No moments yet</Text>
                <Text style={styles.emptyAlbumSub}>
                  End a focus session to unlock your first memory
                </Text>
              </GlassCard>
            )}
          </View>

          {/* Latest Hangout */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LATEST HANGOUT</Text>
            <View style={{ marginTop: Space.md }}>
              <LatestHangoutCard hangout={MOCK_HANGOUT} />
            </View>
          </View>

          {/* Spot Ranking */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SPOT RANKING</Text>
            <View style={{ marginTop: Space.md }}>
              <SpotRankingList spots={MOCK_SPOTS} themeColor={Colors.gold} />
            </View>
          </View>

          {/* Activity Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACTIVITY TYPE</Text>
            <View style={{ marginTop: Space.md }}>
              <ActivityBreakdown
                activities={MOCK_ACTIVITIES}
                themeColor={Colors.gold}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  scrollContent: {
    paddingBottom: 48,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space.md,
    paddingHorizontal: Space.lg,
  },
  settingsBtn: {
    padding: Space.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    paddingTop: Space.xl,
    paddingBottom: Space.md,
    paddingHorizontal: Space.xxxl,
    position: 'relative',
    minHeight: AVATAR_SIZE + 80,
  },
  avatarGlow: {
    position: 'absolute',
    top: Space.xl,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.goldFaint,
    alignSelf: 'center',
  },

  // Identity
  identity: {
    alignItems: 'center',
    paddingBottom: Space.xxl,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text1,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  handle: {
    fontSize: 12,
    color: Colors.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Stage 2 container
  stage2: {
    backgroundColor: Colors.bg1,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: Space.lg,
    paddingTop: Space.md,
    paddingBottom: Space.lg,
    minHeight: 400,
  },
  pillHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.muted,
    alignSelf: 'center',
    marginBottom: Space.xl,
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
  seeMore: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: '600',
  },

  // Album grid
  memoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  memoryThumb: {
    width: '32.2%',
    aspectRatio: 1,
  },
  memoryThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  memoryPlaceholder: {
    backgroundColor: Colors.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  memoryPlaceholderText: {
    fontSize: 20,
    color: Colors.muted,
  },
  emptyAlbum: {
    alignItems: 'center',
    paddingVertical: Space.xxxl,
    gap: Space.sm,
  },
  emptyAlbumText: {
    fontSize: 14,
    color: Colors.text3,
    fontWeight: '500',
  },
  emptyAlbumSub: {
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
