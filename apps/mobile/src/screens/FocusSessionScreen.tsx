/**
 * Focus Session screen. Start focus with friends, pause, and end.
 * Includes AI icebreaker for sparking conversation topics.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import type { Friend } from '@hyve/types';
import { Sparkles } from '../components/icons';

import type { RootStackParamList } from '../navigation/types';

const DURATIONS = [25, 45, 60];

interface ActiveSession {
  id?: string;
  sessionId: string;
  status?: string;
  isPaused?: boolean;
}

export default function FocusSessionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'FocusSession'>>();
  const { apiClient, user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [duration, setDuration] = useState(25);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [pausing, setPausing] = useState(false);
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);

  const loadFriends = useCallback(async () => {
    try {
      const res = await apiClient.get<{ friends: Friend[] }>(API_PATHS.FRIENDS_LIST);
      setFriends(res?.friends ?? []);
    } catch {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const pollActiveSession = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get<{ sessions: ActiveSession[] }>(
        `${API_PATHS.SESSIONS_ACTIVE}?userId=${encodeURIComponent(user.id)}`
      );
      const sessions = res?.sessions ?? [];
      if (sessions.length > 0) {
        const s = sessions[0];
        setActiveSession({
          id: s.sessionId ?? (s as { id?: string }).id,
          sessionId: s.sessionId ?? (s as { id?: string }).id ?? '',
          status: s.status,
          isPaused: s.isPaused,
        });
      } else {
        setActiveSession(null);
      }
    } catch {
      setActiveSession(null);
    }
  }, [apiClient, user?.id]);

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(pollActiveSession, 5000);
    return () => clearInterval(interval);
  }, [activeSession, pollActiveSession]);

  const toggleFriend = (friendId: string, friendUserId?: string) => {
    const id = friendUserId ?? friendId;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = async () => {
    if (!user?.id || selectedIds.size === 0 || starting) return;
    setStarting(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + duration * 60 * 1000);
      const userIds = [user.id, ...Array.from(selectedIds)];
      await apiClient.post(API_PATHS.SESSIONS, {
        userIds,
        durationSeconds: duration * 60,
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
      });
      await pollActiveSession();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const handlePause = async () => {
    const sessionId = activeSession?.sessionId ?? activeSession?.id;
    if (!sessionId || !activeSession || pausing) return;
    setPausing(true);
    try {
      await apiClient.post(API_PATHS.SESSION_PAUSE(sessionId), {
        isPaused: !activeSession.isPaused,
      });
      await pollActiveSession();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setPausing(false);
    }
  };

  const handleSparkConversation = async () => {
    if (loadingIceBreaker) return;
    setLoadingIceBreaker(true);
    try {
      const res = await apiClient.post<{ question: string }>(
        API_PATHS.GENERATE_ICEBREAKER,
        { context: 'college students hanging out' }
      );
      setIceBreaker(res?.question ?? "What's the best meal you've had this week?");
    } catch {
      setIceBreaker("If you could travel anywhere right now, where would you go?");
    } finally {
      setLoadingIceBreaker(false);
    }
  };

  const handleEnd = async () => {
    const sessionId = activeSession?.sessionId ?? activeSession?.id;
    if (!sessionId) return;
    Alert.alert(
      'End Session',
      'Are you sure you want to end this focus session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            try {
              const now = new Date();
              await apiClient.post(API_PATHS.SESSION_END(sessionId), {
                endTime: now.toISOString(),
                minutes: duration,
              });
              setActiveSession(null);
              Alert.alert(
                'Session ended',
                'Would you like to add a memory for this session?',
                [
                  { text: 'Later', style: 'cancel' },
                  {
                    text: 'Add memory',
                    onPress: () =>
                      navigation.navigate('PostMemory', { focusSessionId: sessionId }),
                  },
                ]
              );
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to end');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (activeSession) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.activeContainer}>
        <Text style={styles.title}>Focus Session</Text>
        <View style={styles.activeCard}>
          <Text style={styles.activeStatus}>
            {activeSession.isPaused ? 'Paused' : 'In progress'}
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={handlePause}
              disabled={pausing}
            >
              {pausing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {activeSession.isPaused ? 'Resume' : 'Pause'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.endButton} onPress={handleEnd}>
              <Text style={styles.buttonText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Icebreaker section */}
        <View style={styles.iceBreakerCard}>
          {iceBreaker ? (
            <>
              <Text style={styles.iceBreakerLabel}>Conversation starter</Text>
              <Text style={styles.iceBreakerText}>"{iceBreaker}"</Text>
              <TouchableOpacity
                style={styles.sparkButton}
                onPress={handleSparkConversation}
                disabled={loadingIceBreaker}
              >
                <Sparkles color="#fff" size={18} />
                <Text style={styles.sparkButtonText}>
                  {loadingIceBreaker ? 'Thinking...' : 'Get another topic'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.sparkButton}
              onPress={handleSparkConversation}
              disabled={loadingIceBreaker}
            >
              {loadingIceBreaker ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Sparkles color="#fff" size={18} />
              )}
              <Text style={styles.sparkButtonText}>
                {loadingIceBreaker ? 'Thinking...' : 'Awkward silence? Spark a topic'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start Focus</Text>
      <Text style={styles.sectionLabel}>Select friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        style={styles.friendList}
        renderItem={({ item }) => {
          const friendUserId = item.userId ?? item.id;
          const isSelected = selectedIds.has(friendUserId);
          return (
            <TouchableOpacity
              style={[styles.friendRow, isSelected && styles.friendRowSelected]}
              onPress={() => toggleFriend(item.id, friendUserId)}
            >
              <Text style={styles.friendName}>{item.name ?? 'Unknown'}</Text>
              {isSelected && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No friends yet</Text>}
      />
      <Text style={styles.sectionLabel}>Duration (min)</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.durationBtn, duration === d && styles.durationBtnSelected]}
            onPress={() => setDuration(d)}
          >
            <Text style={styles.durationText}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[
          styles.startButton,
          (selectedIds.size === 0 || starting) && styles.startButtonDisabled,
        ]}
        onPress={handleStart}
        disabled={selectedIds.size === 0 || starting}
      >
        {starting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.startButtonText}>Start Focus</Text>
        )}
      </TouchableOpacity>
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
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  friendList: {
    maxHeight: 200,
    marginBottom: 24,
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  friendRowSelected: {
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  friendName: {
    fontSize: 16,
    color: '#fff',
  },
  check: {
    color: '#4285f4',
    fontSize: 16,
  },
  empty: {
    color: '#666',
    paddingVertical: 16,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  durationBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  durationBtnSelected: {
    backgroundColor: '#4285f4',
  },
  durationText: {
    color: '#fff',
    fontSize: 16,
  },
  startButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeContainer: {
    paddingBottom: 40,
  },
  activeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 16,
  },
  iceBreakerCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  iceBreakerLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  iceBreakerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  sparkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f43f5e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sparkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeStatus: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  endButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
