/**
 * Glass-effect card component — ver2 style.
 * Simulates backdrop blur with semi-transparent background and border.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  radius?: number;
}

export default function GlassCard({
  children,
  style,
  padding = 16,
  radius = Radius.xl,
}: GlassCardProps) {
  return (
    <View style={[styles.card, { padding, borderRadius: radius }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
});
