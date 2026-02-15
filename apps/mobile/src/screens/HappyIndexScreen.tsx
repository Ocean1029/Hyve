/**
 * Happy Index screen. Shows weekly happy index chart and peak happiness memories.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';

interface WeeklyDataPoint {
  day: string;
  score: number;
}

interface PeakMemory {
  id: string;
  content: string | null;
  location: string | null;
  timestamp: string;
  happyIndex: number | null;
  photos: { id: string; photoUrl: string }[];
}

export default function HappyIndexScreen() {
  const { apiClient } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [peakMemories, setPeakMemories] = useState<PeakMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [weeklyRes, peakRes] = await Promise.all([
        apiClient.get<{ data: WeeklyDataPoint[] }>(API_PATHS.MEMORIES_HAPPY_INDEX_WEEKLY),
        apiClient.get<{ memories: PeakMemory[] }>(
          `${API_PATHS.MEMORIES_PEAK_HAPPINESS}?limit=5`
        ),
      ]);
      setWeeklyData(weeklyRes?.data ?? []);
      setPeakMemories(peakRes?.memories ?? []);
    } catch {
      setWeeklyData([]);
      setPeakMemories([]);
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

  const maxScore = Math.max(...weeklyData.map((d) => d.score), 1);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <Text style={styles.title}>Happy Index</Text>
      <Text style={styles.subtitle}>Weekly average by day</Text>

      {weeklyData.length > 0 ? (
        <View style={styles.chartContainer}>
          {weeklyData.map((d, i) => (
            <View key={d.day} style={styles.barRow}>
              <Text style={styles.barLabel}>{d.day}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(d.score / maxScore) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.barValue}>{d.score}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>No happy index data yet</Text>
      )}

      <Text style={styles.sectionTitle}>Peak Memories</Text>
      {peakMemories.length > 0 ? (
        peakMemories.map((m) => (
          <View key={m.id} style={styles.memoryCard}>
            {m.photos.length > 0 && (
              <Image
                source={{ uri: m.photos[0].photoUrl }}
                style={styles.memoryImage}
              />
            )}
            <View style={styles.memoryContent}>
              {m.content ? (
                <Text style={styles.memoryText} numberOfLines={2}>
                  {m.content}
                </Text>
              ) : null}
              {m.happyIndex != null && (
                <Text style={styles.memoryScore}>Score: {m.happyIndex}</Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No peak memories yet</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  chartContainer: {
    marginBottom: 32,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 36,
    fontSize: 12,
    color: '#888',
  },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  barValue: {
    width: 32,
    fontSize: 12,
    color: '#fff',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  memoryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  memoryImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#333',
  },
  memoryContent: {
    padding: 12,
  },
  memoryText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  memoryScore: {
    fontSize: 12,
    color: '#f59e0b',
  },
  empty: {
    color: '#666',
    fontSize: 14,
    paddingVertical: 24,
  },
});
