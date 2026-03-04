/**
 * Profile screen. Shows user info, stats, memories. Settings via header icon.
 * Aligns with web MyProfile component.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { Users, Clock, Trophy, Grid, Calendar, Settings } from '../components/icons';

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

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.headerSettingsButton}
        >
          <Settings color="#fff" size={22} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const totalHours = stats?.totalMinutes ? Math.floor(stats.totalMinutes / 60) : 0;
  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;
  const todayDisplay =
    todayHours > 0 ? `${todayHours}h ${todayMins}m` : `${todayMins}m`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>
                {(user?.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.name ?? 'User'}</Text>
        <Text style={styles.userId}>{user?.userId ?? user?.id ?? 'No user ID'}</Text>
      </View>

      <TouchableOpacity
        style={styles.todayCard}
        onPress={() => (navigation as { navigate: (name: string) => void }).navigate('Today')}
      >
        <View style={styles.todayCardContent}>
          <View style={styles.todayIcon}>
            <Calendar color="#f43f5e" size={20} />
          </View>
          <View>
            <Text style={styles.todayTitle}>Today's Focus</Text>
            <Text style={styles.todaySubtitle}>
              {loading ? '...' : todayDisplay} disconnected
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Users color="#34d399" size={16} />
          <Text style={styles.statValue}>{stats ? friendCount : '-'}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
        <View style={styles.statCard}>
          <Clock color="#60a5fa" size={16} />
          <Text style={styles.statValue}>{stats ? `${totalHours}h` : '-'}</Text>
          <Text style={styles.statLabel}>Focused</Text>
        </View>
        <View style={styles.statCard}>
          <Trophy color="#f43f5e" size={16} />
          <Text style={styles.statValue}>-</Text>
          <Text style={styles.statLabel}>Best Buddy</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Grid color="#f43f5e" size={16} />
          <Text style={styles.sectionTitle}>My Vault</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" style={styles.memoriesLoading} />
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
                    <Grid color="#52525b" size={24} />
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyMemories}>
            <Text style={styles.emptyMemoriesText}>No posts yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  headerSettingsButton: {
    marginRight: 12,
    padding: 8,
  },
  content: {
    paddingBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  userId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  todayCard: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  todayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  todayIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  todaySubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(39, 39, 42, 0.5)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#71717a',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  memoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  memoryThumb: {
    width: '32%',
    aspectRatio: 1,
  },
  memoryThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  memoryPlaceholder: {
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memoriesLoading: {
    marginVertical: 24,
  },
  emptyMemories: {
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(39, 39, 42, 0.5)',
  },
  emptyMemoriesText: {
    color: '#52525b',
    fontSize: 14,
  },
});