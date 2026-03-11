/**
 * Focus Session screen — ver2 Step1InSession style.
 * Campfire Hyve component center-stage, gold timer, end button.
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
import { Colors, Radius, Space, Shadows } from '../theme';

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

  // Track paused time
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
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  const intensity = Math.min((elapsedSeconds / 60) * 10, 100);
  const isActive = focusStatus === FocusStatus.ACTIVE;

  return (
    <View style={styles.container}>
      {/* Subtle ambient glow */}
      <View style={[styles.ambientGlow, isActive && styles.ambientGlowActive]} />

      <View style={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>

        {/* Sensor status badge (top left) */}
        <View style={styles.topLeft}>
          {permissionStatus === 'prompt' && (
            <TouchableOpacity style={styles.sensorBadge} onPress={requestPermission} activeOpacity={0.8}>
              <Text style={styles.sensorBadgeText}>Enable Sensor</Text>
            </TouchableOpacity>
          )}
          {sensorAvailable && permissionStatus === 'granted' && (
            <View style={[styles.sensorBadge, styles.sensorBadgeActive]}>
              <Text style={[styles.sensorBadgeText, styles.sensorBadgeActiveText]}>Sensor Active</Text>
            </View>
          )}
          {permissionStatus === 'unavailable' && (
            <View style={[styles.sensorBadge, styles.sensorBadgeMuted]}>
              <Text style={[styles.sensorBadgeText, styles.sensorBadgeMutedText]}>Sensor N/A</Text>
            </View>
          )}
          {permissionStatus === 'denied' && (
            <View style={[styles.sensorBadge, styles.sensorBadgeDenied]}>
              <Text style={[styles.sensorBadgeText, styles.sensorBadgeDeniedText]}>Sensor Denied</Text>
            </View>
          )}
        </View>

        {/* Orientation debug toggle (top right) */}
        <TouchableOpacity
          style={styles.topRight}
          onPress={() => setSimulateFaceDown((v) => (v === null ? false : !v))}
          activeOpacity={0.7}
        >
          <View style={[styles.toggleDot, effectiveFaceDown && styles.toggleDotActive]} />
        </TouchableOpacity>

        {/* Campfire center */}
        <View style={styles.campfireSection}>
          <Hyve status={focusStatus} intensity={intensity} />
          <View style={styles.timerArea}>
            {isActive ? (
              <>
                <Text style={styles.activeLabel}>FOCUS MODE ACTIVE</Text>
                <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
              </>
            ) : (
              <Text style={styles.pausedText}>Put your phone face down…</Text>
            )}
          </View>
        </View>

        {/* Icebreaker section (when paused) */}
        {!isActive && (
          <View style={styles.iceBreakerArea}>
            {iceBreaker && (
              <Text style={styles.iceBreakerText}>"{iceBreaker}"</Text>
            )}
            <TouchableOpacity
              style={styles.sparkBtn}
              onPress={handleSparkConversation}
              disabled={loadingIceBreaker}
              activeOpacity={0.75}
            >
              {loadingIceBreaker ? (
                <ActivityIndicator size="small" color={Colors.muted} />
              ) : (
                <Sparkles color={Colors.muted} size={14} />
              )}
              <Text style={styles.sparkBtnText}>
                {loadingIceBreaker
                  ? 'Thinking…'
                  : iceBreaker
                  ? 'Another topic'
                  : 'Spark a conversation'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* End session button */}
        <TouchableOpacity style={styles.endButton} onPress={handleEnd} activeOpacity={0.85}>
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg0,
  },
  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  ambientGlowActive: {
    backgroundColor: Colors.goldFaint,
  },
  content: {
    flex: 1,
    paddingHorizontal: Space.xl,
  },

  // Top badges
  topLeft: {
    position: 'absolute',
    top: 56,
    left: Space.xl,
    zIndex: 10,
  },
  topRight: {
    position: 'absolute',
    top: 60,
    right: Space.xl,
    zIndex: 10,
    padding: 6,
  },
  sensorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  sensorBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 0.8,
  },
  sensorBadgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  sensorBadgeActiveText: {
    color: '#86efac',
  },
  sensorBadgeMuted: {
    backgroundColor: Colors.surface1,
    borderColor: Colors.glassBorder,
  },
  sensorBadgeMutedText: {
    color: Colors.muted,
  },
  sensorBadgeDenied: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sensorBadgeDeniedText: {
    color: '#fca5a5',
  },
  toggleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  toggleDotActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.goldDim,
  },

  // Campfire / timer
  campfireSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerArea: {
    marginTop: Space.xxxl,
    alignItems: 'center',
  },
  activeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Space.md,
  },
  timerText: {
    fontSize: 64,
    fontWeight: '200',
    color: Colors.ivory,
    letterSpacing: -2,
  },
  pausedText: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.text3,
    letterSpacing: -0.3,
  },

  // Icebreaker
  iceBreakerArea: {
    alignItems: 'center',
    paddingBottom: Space.xl,
    gap: Space.md,
  },
  iceBreakerText: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  sparkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: Space.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  sparkBtnText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // End button
  endButton: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: Space.lg,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    marginBottom: Space.lg,
  },
  endButtonText: {
    color: Colors.text1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
