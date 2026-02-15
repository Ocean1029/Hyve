/**
 * Today screen. Shows today's focus sessions and summary.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';

type RootStackParamList = {
  Main: undefined;
  HappyIndex: undefined;
  PostMemory: { focusSessionId: string };
};

interface Session {
  id: string;
  sessionId: string;
  status: string;
  startTime: string;
  endTime: string | null;
  minutes?: number;
  createdAt?: string;
}

export default function TodayScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const { apiClient, user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get<{ sessions: Session[]; totalMinutes: number }>(
        `${API_PATHS.SESSIONS_TODAY}?userId=${encodeURIComponent(user.id)}`
      );
      setSessions(res?.sessions ?? []);
      setTotalMinutes(res?.totalMinutes ?? 0);
    } catch {
      setSessions([]);
      setTotalMinutes(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id, apiClient]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const formatTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <TouchableOpacity
        style={styles.happyIndexLink}
        onPress={() => navigation.navigate('HappyIndex')}
      >
        <Text style={styles.happyIndexLinkText}>View Happy Index</Text>
      </TouchableOpacity>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Focus time</Text>
        <Text style={styles.summaryValue}>{totalMinutes} min</Text>
      </View>
      <Text style={styles.sectionTitle}>Sessions</Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        renderItem={({ item }) => (
          <View style={styles.sessionRow}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTime}>
                {formatTime(item.startTime)}
                {item.endTime ? ` - ${formatTime(item.endTime)}` : ''}
              </Text>
              <Text style={styles.sessionMinutes}>
                {item.minutes ?? 0} min
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addMemoryButton}
              onPress={() =>
                navigation.navigate('PostMemory', { focusSessionId: item.id })
              }
            >
              <Text style={styles.addMemoryText}>Add memory</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No focus sessions today</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  happyIndexLink: {
    marginBottom: 16,
  },
  happyIndexLinkText: {
    color: '#4285f4',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  addMemoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  addMemoryText: {
    color: '#4285f4',
    fontSize: 12,
  },
  sessionTime: {
    fontSize: 14,
    color: '#fff',
  },
  sessionMinutes: {
    fontSize: 14,
    color: '#888',
  },
  empty: {
    color: '#666',
    fontSize: 14,
    paddingVertical: 24,
  },
});
