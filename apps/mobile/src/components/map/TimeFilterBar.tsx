/**
 * Horizontal pill toggle for time filter on the map.
 * Glass-effect background with gold highlight on active pill.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

export type TimeFilter = 'week' | 'month' | 'all';

interface TimeFilterBarProps {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
}

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All' },
];

export default function TimeFilterBar({ value, onChange }: TimeFilterBarProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map(({ key, label }) => {
        const active = value === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onChange(key)}
            style={[styles.pill, active && styles.pillActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Radius.full,
    padding: 4,
    gap: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  pillActive: {
    backgroundColor: Colors.gold,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text3,
  },
  pillTextActive: {
    color: Colors.bg0,
  },
});
