/**
 * Session summary screen after ending focus. Matches web SessionSummary.
 * Primary: Unlock Photo Moment -> PostMemory. Secondary: Return Home.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, Trophy } from '../components/icons';
import type { RootStackParamList } from '../navigation/types';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SessionSummaryScreen() {
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'SessionSummary'>['route']>();
  const navigation = useNavigation<NativeStackScreenProps<RootStackParamList, 'SessionSummary'>['navigation']>();
  const insets = useSafeAreaInsets();
  const { elapsedSeconds, sessionId } = route.params;

  const handleUnlockPhotoMoment = () => {
    navigation.navigate('PostMemory', {
      focusSessionId: sessionId,
      durationSeconds: elapsedSeconds,
      sessionEndTime: new Date().toISOString(),
    });
  };

  const handleReturnHome = () => {
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      <View style={styles.gradient} />
      <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
        <View style={styles.trophyCircle}>
          <Trophy color="#fcd34d" size={48} />
        </View>
        <Text style={styles.title}>Session{'\n'}Complete</Text>
        <Text style={styles.subtitle}>Quality time captured.</Text>

        <View style={styles.timeCard}>
          <Text style={styles.timeLabel}>Total Focus Time</Text>
          <Text style={styles.timeValue}>{formatTime(elapsedSeconds)}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleUnlockPhotoMoment}
          activeOpacity={0.9}
        >
          <Camera color="#000" size={20} />
          <Text style={styles.primaryButtonText}>Unlock Photo Moment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleReturnHome}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(120, 53, 15, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    alignItems: 'center',
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fafaf9',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 48,
  },
  timeCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fda4af',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  timeValue: {
    fontSize: 60,
    fontWeight: '300',
    color: '#fafaf9',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#fafaf9',
    paddingVertical: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
    letterSpacing: 2,
  },
});
