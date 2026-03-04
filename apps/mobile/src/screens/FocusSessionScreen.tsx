/**
 * Focus Session screen. Stopwatch-style focus with Hyve campfire.
 * Auto-enters when session detected via polling or started from Dashboard.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { API_PATHS } from '@hyve/shared';
import { FocusStatus } from '@hyve/types';
import { Sparkles } from '../components/icons';
import Hyve from '../components/Hyve';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

import type { RootStackParamList } from '../navigation/types';

interface ActiveSession {
  id?: string;
  sessionId: string;
  status?: string;
  isPaused?: boolean;
  startTime?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FocusSessionScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'FocusSession'>['route']>();
  const navigation = useNavigation<NativeStackScreenProps<RootStackParamList, 'FocusSession'>['navigation']>();
  const insets = useSafeAreaInsets();
  const { apiClient, user } = useAuth();
  const params = route.params;

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [iceBreaker, setIceBreaker] = useState<string | null>(null);
  const [loadingIceBreaker, setLoadingIceBreaker] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pauseStartTimeRef = useRef<Date | null>(null);

  const { isFaceDown, permissionStatus, sensorAvailable, requestPermission } = useDeviceOrientation();
  const [simulateFaceDown, setSimulateFaceDown] = useState<boolean | null>(null);
  const effectiveFaceDown = simulateFaceDown !== null ? simulateFaceDown : (isFaceDown ?? false);

  const isSessionPausedByOthers = activeSession?.isPaused ?? false;
  const focusStatus =
    effectiveFaceDown && !isSessionPausedByOthers ? FocusStatus.ACTIVE : FocusStatus.PAUSED;

  const pollActiveSession = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiClient.get<{ sessions: ActiveSession[] }>(
        `${API_PATHS.SESSIONS_ACTIVE}?userId=${encodeURIComponent(user.id)}`
      );
      const sessions = (res as { sessions?: ActiveSession[] })?.sessions ?? [];
      if (sessions.length > 0) {
        const s = sessions[0];
        const sessionId = s.sessionId ?? (s as { id?: string }).id ?? '';
        setActiveSession({
          id: sessionId,
          sessionId,
          status: s.status,
          isPaused: s.isPaused,
          startTime: (s as { startTime?: string }).startTime,
        });
        if (!sessionStartTime && (s as { startTime?: string }).startTime) {
          setSessionStartTime(new Date((s as { startTime?: string }).startTime!));
        }
      } else {
        setActiveSession(null);
        setSessionStartTime(null);
      }
    } catch {
      setActiveSession(null);
    }
  }, [apiClient, user?.id, sessionStartTime]);

  // Auto-enter from polling or Dashboard direct start
  useEffect(() => {
    if (params?.sessionId && params?.autoEntered) {
      setActiveSession({
        sessionId: params.sessionId,
        status: 'active',
        isPaused: false,
        startTime: params.startTime,
      });
      if (params.startTime) {
        setSessionStartTime(new Date(params.startTime));
      }
    }
  }, [params?.sessionId, params?.autoEntered, params?.startTime]);

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(pollActiveSession, 5000);
    return () => clearInterval(interval);
  }, [activeSession, pollActiveSession]);

  // Elapsed time ticker
  useEffect(() => {
    if (!activeSession || !sessionStartTime) return;
    const tick = () => {
      const now = new Date();
      const totalMs = now.getTime() - sessionStartTime.getTime();
      const totalSec = Math.floor(totalMs / 1000);
      const activeSec = Math.max(0, totalSec - totalPausedSeconds);
      setElapsedSeconds(activeSec);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession, sessionStartTime, totalPausedSeconds]);

  // Track paused time from face-up orientation
  useEffect(() => {
    if (focusStatus === FocusStatus.PAUSED && pauseStartTimeRef.current === null) {
      pauseStartTimeRef.current = new Date();
    } else if (focusStatus === FocusStatus.ACTIVE && pauseStartTimeRef.current) {
      const paused = Math.floor((Date.now() - pauseStartTimeRef.current.getTime()) / 1000);
      setTotalPausedSeconds((prev) => prev + paused);
      pauseStartTimeRef.current = null;
    }
  }, [focusStatus]);

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
              const minutes = Math.floor(elapsedSeconds / 60);
              await apiClient.post(API_PATHS.SESSION_END(sessionId), {
                endTime: now.toISOString(),
                minutes: minutes > 0 ? minutes : 1,
              });
              setActiveSession(null);
              setSessionStartTime(null);
              navigation.replace('SessionSummary', { elapsedSeconds, sessionId });
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to end');
            }
          },
        },
      ]
    );
  };

  if (!activeSession) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const intensity = Math.min((elapsedSeconds / 60) * 10, 100);

  return (
    <View style={styles.focusModeContainer}>
      <View style={styles.focusOverlay} />
      <View style={[styles.focusContent, { paddingTop: insets.top }]}>
        <View style={styles.sensorBadge}>
          {permissionStatus === 'prompt' && (
            <TouchableOpacity style={styles.enableSensorBtn} onPress={requestPermission}>
              <Text style={styles.enableSensorText}>Enable Sensor</Text>
            </TouchableOpacity>
          )}
          {sensorAvailable && permissionStatus === 'granted' && (
            <View style={styles.sensorActive}>
              <Text style={styles.sensorActiveText}>Sensor Active</Text>
            </View>
          )}
          {permissionStatus === 'unavailable' && (
            <View style={styles.sensorNa}>
              <Text style={styles.sensorNaText}>Sensor N/A</Text>
            </View>
          )}
          {permissionStatus === 'denied' && (
            <View style={styles.sensorDenied}>
              <Text style={styles.sensorDeniedText}>Sensor Denied</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={() => setSimulateFaceDown((v) => (v === null ? false : !v))}
        >
          <View style={[styles.simulateDot, effectiveFaceDown && styles.simulateDotDown]} />
        </TouchableOpacity>

        <View style={styles.hyveSection}>
          <Hyve status={focusStatus} intensity={intensity} />
          <View style={styles.timerSection}>
            {focusStatus === FocusStatus.ACTIVE ? (
              <>
                <Text style={styles.focusActiveLabel}>Focus Mode Active</Text>
                <Text style={styles.elapsedTime}>{formatTime(elapsedSeconds)}</Text>
              </>
            ) : (
              <Text style={styles.putDownText}>Put your phone down...</Text>
            )}
          </View>
        </View>

        {focusStatus === FocusStatus.PAUSED && (
          <View style={styles.iceBreakerSection}>
            {iceBreaker ? (
              <>
                <Text style={styles.iceBreakerText}>"{iceBreaker}"</Text>
                <TouchableOpacity
                  style={styles.sparkButton}
                  onPress={handleSparkConversation}
                  disabled={loadingIceBreaker}
                >
                  <Sparkles color="#a1a1aa" size={16} />
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
                  <ActivityIndicator size="small" color="#a1a1aa" />
                ) : (
                  <Sparkles color="#a1a1aa" size={16} />
                )}
                <Text style={styles.sparkButtonText}>
                  {loadingIceBreaker ? 'Thinking...' : 'Awkward silence? Spark a topic'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={[styles.focusActions, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={styles.endButton} onPress={handleEnd}>
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  focusModeContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  focusContent: {
    flex: 1,
    padding: 16,
  },
  sensorBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 50,
  },
  enableSensorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  enableSensorText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fcd34d',
    letterSpacing: 1,
  },
  sensorActive: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  sensorActiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#86efac',
  },
  sensorNa: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  sensorNaText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9ca3af',
  },
  sensorDenied: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sensorDeniedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fca5a5',
  },
  simulateBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 50,
    padding: 4,
  },
  simulateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
  },
  simulateDotDown: {
    backgroundColor: '#6b7280',
  },
  hyveSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSection: {
    marginTop: 64,
    alignItems: 'center',
  },
  focusActiveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  elapsedTime: {
    fontSize: 60,
    fontWeight: '300',
    color: '#fffbeb',
    fontVariant: ['tabular-nums'],
  },
  putDownText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d6d3d1',
  },
  iceBreakerSection: {
    position: 'absolute',
    bottom: 140,
    left: 24,
    right: 24,
    alignItems: 'center',
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(161, 161, 170, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  sparkButtonText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
  focusActions: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  endButton: {
    width: '100%',
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#52525b',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fafaf9',
    fontSize: 16,
    fontWeight: '600',
  },
});
