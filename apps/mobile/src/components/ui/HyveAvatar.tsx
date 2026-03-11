/**
 * Avatar component — ver2 style.
 * Supports image, initials fallback, online indicator, and ring.
 */
import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme';

interface HyveAvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  online?: boolean;
  style?: ViewStyle;
  ringColor?: string;
}

export default function HyveAvatar({
  uri,
  name,
  size = 48,
  online,
  style,
  ringColor,
}: HyveAvatarProps) {
  const letter = (name ?? 'U').charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.38);

  return (
    <View style={[{ width: size, height: size }, style]}>
      {ringColor && (
        <View
          style={[
            styles.ring,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: (size + 6) / 2,
              borderColor: ringColor,
              top: -3,
              left: -3,
            },
          ]}
        />
      )}
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.letter, { fontSize }]}>{letter}</Text>
        </View>
      )}
      {online && (
        <View
          style={[
            styles.onlineDot,
            {
              width: Math.max(10, size * 0.24),
              height: Math.max(10, size * 0.24),
              borderRadius: Math.max(5, size * 0.12),
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    zIndex: -1,
  },
  placeholder: {
    backgroundColor: 'rgba(201, 168, 106, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 106, 0.25)',
  },
  letter: {
    color: Colors.gold,
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.bg1,
  },
});
