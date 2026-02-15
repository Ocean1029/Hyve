/**
 * Dashboard screen. Shows friends list and weekly focus chart.
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
import type { Friend, ChartDataPoint } from '@hyve/types';

type RootStackParamList = {
  Main: undefined;
  FindFriends: undefined;
  HappyIndex: undefined;
  FocusSession: undefined;
  SpringBloom: undefined;
};

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();
  const { apiClient, user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [friendsRes, chartRes] = await Promise.all([
        apiClient.get<{ friends: Friend[] }>(API_PATHS.FRIENDS_LIST),
        apiClient.get<{ chartData: ChartDataPoint[] }>(API_PATHS.SESSIONS_WEEKLY),
      ]);
      setFriends(friendsRes?.friends ?? []);
      setChartData(chartRes?.chartData ?? []);
    } catch (e) {
      console.error('Dashboard load error:', e);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const totalMinutes = chartData.reduce((s, d) => s + (d.minutes ?? 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.name ?? 'there'}</Text>
        <Text style={styles.weekSummary}>
          This week: {totalMinutes} min focus
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.findFriendsButton}
            onPress={() => navigation.navigate('FindFriends')}
          >
            <Text style={styles.findFriendsText}>Find Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('HappyIndex')}
          >
            <Text style={styles.secondaryButtonText}>Happy Index</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('SpringBloom')}
          >
            <Text style={styles.secondaryButtonText}>Spring Bloom</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.focusButton}
            onPress={() => navigation.navigate('FocusSession')}
          >
            <Text style={styles.focusButtonText}>Start Focus</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        renderItem={({ item }) => (
          <View style={styles.friendRow}>
            <Text style={styles.friendName}>{item.name ?? 'Unknown'}</Text>
            <Text style={styles.friendMeta}>
              {item.totalHours ?? 0}h together · streak {item.streak ?? 0}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No friends yet. Add some!</Text>
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  weekSummary: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  findFriendsButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  findFriendsText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  focusButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  focusButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  friendRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  friendMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  empty: {
    color: '#666',
    fontSize: 14,
    paddingVertical: 24,
  },
});
