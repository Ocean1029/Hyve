/**
 * Session Summary screen — ver2 Post-Session step 2 style.
 * Gold checkmark, large timer, unlock photo button.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
        <Text style={styles.title}>Presence{'\n'}Built.</Text>
        <Text style={styles.subtitle}>SESSION SUMMARY</Text>

        {/* Stat capsules */}
        <View style={styles.capsulesRow}>
          <View style={styles.capsule}>
            <Text style={styles.capsuleValue}>{Math.floor(elapsedSeconds / 60)}</Text>
            <Text style={styles.capsuleLabel}>MINUTES</Text>
          </View>
          <View style={styles.capsule}>
            <Text style={styles.capsuleValue}>+{Math.max(1, Math.floor(elapsedSeconds / 60 * 0.27))}px</Text>
            <Text style={styles.capsuleLabel}>GROWTH</Text>
          </View>
        </View>

        {/* Primary action */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleUnlockPhotoMoment}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryButtonText}>POST YOUR SESSION!</Text>
        </TouchableOpacity>

        {/* Secondary action */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleReturnHome}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>ONLY RECORD IT</Text>
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
    fontSize: 9,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 2.5,
    marginBottom: Space.xxxl,
  },

  // Stat capsules
  capsulesRow: {
    flexDirection: 'row',
    gap: Space.md,
    width: '100%',
    marginBottom: Space.xxxl,
  },
  capsule: {
    flex: 1,
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.xxl,
    paddingVertical: Space.xl,
    alignItems: 'center',
    gap: Space.xs,
  },
  capsuleValue: {
    fontSize: 32,
    fontWeight: '200',
    color: Colors.ivory,
    letterSpacing: -1,
  },
  capsuleLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 2,
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
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
    letterSpacing: 2.5,
  },
});
