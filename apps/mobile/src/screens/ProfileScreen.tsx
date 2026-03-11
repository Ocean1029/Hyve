/**
 * Profile screen — ver2 UserProfileScreen style.
 * Shows avatar, stats capsules, memories vault, and settings link.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import HyveAvatar from '../components/ui/HyveAvatar';
import GlassCard from '../components/ui/GlassCard';
import { Settings } from '../components/icons';
import { Colors, Radius, Space, Shadows } from '../theme';

type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
  Today: undefined;
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

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const insets = useSafeAreaInsets();
  const { user, apiClient } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const [statsRes, memoriesRes, todayRes, friendsRes] = await Promise.all([
        apiClient.get<{ success: boolean; stats?: Stats }>(
          API_PATHS.USER_STATS(user.id)
        ),
        apiClient.get<{ success: boolean; memories?: Memory[] }>(
          `${API_PATHS.MEMORIES_PEAK_HAPPINESS}?limit=20`
        ),
        apiClient.get<{ totalMinutes?: number }>(
          `${API_PATHS.SESSIONS_TODAY}?userId=${encodeURIComponent(user.id)}`
        ),
        apiClient.get<{ friends?: unknown[] }>(API_PATHS.FRIENDS_LIST),
      ]);
      setStats(statsRes?.stats ?? null);
      setMemories(memoriesRes?.memories ?? []);
      setTodayMinutes(todayRes?.totalMinutes ?? 0);
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

  const totalHours = stats?.totalMinutes ? Math.floor(stats.totalMinutes / 60) : 0;
  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;
  const todayDisplay = todayHours > 0 ? `${todayHours}h ${todayMins}m` : `${todayMins}m`;

  const statCapsules = [
    { label: 'FRIENDS', value: loading ? '–' : String(friendCount) },
    { label: 'FOCUSED', value: loading ? '–' : `${totalHours}h` },
    { label: 'TODAY', value: loading ? '–' : todayDisplay },
    { label: 'MEMORIES', value: loading ? '–' : String(stats?.totalMemories ?? 0) },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Settings button top right */}
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

        {/* Avatar + identity */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarGlow} pointerEvents="none" />
          <HyveAvatar
            uri={user?.image}
            name={user?.name}
            size={96}
            online
            ringColor={Colors.gold}
          />
          <Text style={styles.displayName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.handle}>@{user?.userId ?? user?.id ?? 'unknown'}</Text>
        </View>

        {/* Stats capsules row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.capsulesRow}
          style={styles.capsulesScroll}
        >
          {statCapsules.map((cap) => (
            <View key={cap.label} style={styles.capsule}>
              <Text style={styles.capsuleValue}>{cap.value}</Text>
              <Text style={styles.capsuleLabel}>{cap.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Today card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => (navigation as { navigate: (s: string) => void }).navigate('Today')}
        >
          <GlassCard style={styles.todayCard} radius={Radius.xxl}>
            <View style={styles.todayCardContent}>
              <View style={styles.todayDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.todayTitle}>Today's Focus</Text>
                <Text style={styles.todayValue}>{loading ? '…' : todayDisplay}</Text>
              </View>
              <Text style={styles.todayArrow}>›</Text>
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Memories vault */}
        <View style={styles.vaultSection}>
          <View style={styles.vaultHeader}>
            <Text style={styles.vaultTitle}>MY VAULT</Text>
            <Text style={styles.vaultCount}>
              {loading ? '' : `${memories.length} moments`}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={Colors.gold} style={{ marginVertical: 24 }} />
          ) : memories.length > 0 ? (
            <View style={styles.memoriesGrid}>
              {memories.slice(0, 9).map((m) => (
                <View key={m.id} style={styles.memoryThumb}>
                  {m.photos?.[0]?.photoUrl ? (
                    <Image
                      source={{ uri: m.photos[0].photoUrl }}
                      style={styles.memoryThumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.memoryThumbImage, styles.memoryPlaceholder]}>
                      <Text style={styles.memoryPlaceholderText}>✦</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <GlassCard style={styles.emptyVault} radius={Radius.xxl}>
              <Text style={styles.emptyVaultText}>No moments yet</Text>
              <Text style={styles.emptyVaultSub}>
                End a focus session to unlock your first memory
              </Text>
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg1,
  },
  scrollContent: {
    paddingHorizontal: Space.lg,
    paddingBottom: 48,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Space.md,
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
    paddingBottom: Space.xxl,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: 20,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.goldFaint,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.text1,
    letterSpacing: -0.5,
    marginTop: Space.md,
  },
  handle: {
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Stat capsules
  capsulesScroll: {
    marginBottom: Space.lg,
  },
  capsulesRow: {
    gap: Space.sm,
    paddingVertical: Space.xs,
  },
  capsule: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.xxxl,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.md,
    alignItems: 'center',
    minWidth: 72,
    ...Shadows.soft,
  },
  capsuleValue: {
    fontSize: 18,
    fontWeight: '300',
    color: Colors.gold,
    letterSpacing: -0.5,
  },
  capsuleLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1.2,
    marginTop: 4,
  },

  // Today card
  todayCard: {
    marginBottom: Space.xl,
  },
  todayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  todayTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text3,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  todayValue: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.text1,
    letterSpacing: -0.5,
  },
  todayArrow: {
    fontSize: 22,
    color: Colors.muted,
  },

  // Vault
  vaultSection: {
    marginTop: Space.sm,
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Space.md,
  },
  vaultTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 1.8,
  },
  vaultCount: {
    fontSize: 10,
    color: Colors.text3,
    letterSpacing: 0.3,
  },
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
  emptyVault: {
    alignItems: 'center',
    paddingVertical: Space.xxxl,
    gap: Space.sm,
  },
  emptyVaultText: {
    fontSize: 14,
    color: Colors.text3,
    fontWeight: '500',
  },
  emptyVaultSub: {
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
