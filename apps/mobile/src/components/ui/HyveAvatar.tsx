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
  const ringPad = ringColor ? 3 : 0;
  const totalSize = size + ringPad * 2;

  return (
    <View style={[{ width: totalSize, height: totalSize }, style]}>
      {ringColor && (
        <View
          style={[
            styles.ring,
            {
              width: totalSize,
              height: totalSize,
              borderRadius: totalSize / 2,
              borderColor: ringColor,
              top: 0,
              left: 0,
            },
          ]}
        />
      )}
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginTop: ringPad,
            marginLeft: ringPad,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginTop: ringPad,
              marginLeft: ringPad,
            },
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
