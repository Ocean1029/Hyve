import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface MetricCapsuleProps {
  icon: LucideIcon;
  value: string;
  label: string;
  themeColor: string;
  position: ViewStyle;
  delay: number;
}

export default function MetricCapsule({
  icon: Icon,
  value,
  label,
  themeColor,
  position,
  delay,
}: MetricCapsuleProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    );

    const timer = setTimeout(() => animation.start(), delay);
    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [delay, translateY]);

  return (
    <Animated.View
      style={[
        styles.capsule,
        position,
        {
          backgroundColor: `${themeColor}40`,
          borderColor: `${themeColor}60`,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.row}>
        <Icon color={themeColor} size={14} />
        <Text style={[styles.value, { color: themeColor }]}>{value}</Text>
      </View>
      <Text style={[styles.label, { color: themeColor }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});
