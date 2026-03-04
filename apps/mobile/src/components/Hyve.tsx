/**
 * Hyve campfire component. Shows flame state (ACTIVE/PAUSED) and intensity.
 * Port of web Hyve.tsx for React Native.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { FocusStatus } from '@hyve/types';

interface HyveProps {
  status: FocusStatus;
  intensity: number; // 0 to 100
}

const SIZE = 180;

export default function Hyve({ status, intensity }: HyveProps) {
  const isPaused = status === FocusStatus.PAUSED;
  const scale = 1 + intensity / 200;
  const opacity = isPaused ? 0.4 : 1;
  const glowOpacity = isPaused ? 0.1 : 0.3 + intensity / 300;

  return (
    <View style={[styles.container, { transform: [{ scale: scale * 1.3 }] }]}>
      <View style={[styles.glow, { opacity: glowOpacity }]} />
      <Svg
        viewBox="0 0 200 200"
        width={SIZE}
        height={SIZE}
        style={[styles.flame, { opacity, transform: [{ scale }] }]}
      >
        <Defs>
          <LinearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#e11d48" />
            <Stop offset="40%" stopColor="#fb923c" />
            <Stop offset="100%" stopColor="#fef3c7" />
          </LinearGradient>
        </Defs>
        <Path
          d="M100 180 Q140 160 140 120 Q140 80 100 20 Q60 80 60 120 Q60 160 100 180"
          fill="url(#fireGradient)"
        />
        <Path
          d="M100 170 Q120 150 120 120 Q120 100 100 50 Q80 100 80 120 Q80 150 100 170"
          fill="#fde68a"
          opacity={0.9}
        />
      </Svg>
      <View style={[styles.log1]} />
      <View style={[styles.log2]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: SIZE * 1.2,
    height: SIZE * 1.2,
    borderRadius: SIZE * 0.6,
    backgroundColor: 'rgba(251, 113, 133, 0.2)',
  },
  flame: {
    zIndex: 1,
  },
  log1: {
    position: 'absolute',
    bottom: 16,
    width: 128,
    height: 32,
    backgroundColor: '#44403c',
    borderRadius: 16,
    transform: [{ rotate: '12deg' }],
  },
  log2: {
    position: 'absolute',
    bottom: 16,
    width: 128,
    height: 32,
    backgroundColor: '#292524',
    borderRadius: 16,
    transform: [{ rotate: '-12deg' }],
  },
});
