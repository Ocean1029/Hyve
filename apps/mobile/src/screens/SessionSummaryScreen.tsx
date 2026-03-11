/**
 * Session Summary screen — ver2 Post-Session step 2 style.
 * Gold checkmark, large timer, unlock photo button.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera } from '../components/icons';
import type { RootStackParamList } from '../navigation/types';
import { Colors, Radius, Space, Shadows } from '../theme';

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
      {/* Ambient glow overlay */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <View style={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }]}>

        {/* Check icon */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Session{'\n'}Complete</Text>
        <Text style={styles.subtitle}>Quality time captured.</Text>

        {/* Time display */}
        <View style={styles.timeCard}>
          <Text style={styles.timeLabel}>TOTAL FOCUS TIME</Text>
          <Text style={styles.timeValue}>{formatTime(elapsedSeconds)}</Text>
        </View>

        {/* Primary action */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleUnlockPhotoMoment}
          activeOpacity={0.88}
        >
          <Camera color="#000" size={18} />
          <Text style={styles.primaryButtonText}>Unlock Photo Moment</Text>
        </TouchableOpacity>

        {/* Secondary action */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleReturnHome}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>RETURN HOME</Text>
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
  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.goldFaint,
  },
  content: {
    flex: 1,
    paddingHorizontal: Space.xxxl,
    alignItems: 'center',
  },

  // Check circle
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.goldFaint,
    borderWidth: 1,
    borderColor: Colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.xxxl,
    ...Shadows.gold,
  },
  checkIcon: {
    fontSize: 32,
    color: Colors.gold,
    fontWeight: '300',
  },

  // Title
  title: {
    fontSize: 40,
    fontWeight: '200',
    color: Colors.ivory,
    textAlign: 'center',
    letterSpacing: -1.5,
    lineHeight: 46,
    marginBottom: Space.sm,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Space.xxxl,
    letterSpacing: 0.3,
  },

  // Time card
  timeCard: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.xxxl,
    paddingVertical: Space.xxxl,
    paddingHorizontal: Space.xxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: Space.xxxl,
    ...Shadows.soft,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Space.md,
  },
  timeValue: {
    fontSize: 56,
    fontWeight: '200',
    color: Colors.ivory,
    letterSpacing: -2,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    width: '100%',
    backgroundColor: Colors.gold,
    paddingVertical: Space.xl,
    borderRadius: Radius.xxl,
    marginBottom: Space.lg,
    ...Shadows.gold,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: Space.md,
    paddingHorizontal: Space.xl,
  },
  secondaryButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 2.5,
  },
});
