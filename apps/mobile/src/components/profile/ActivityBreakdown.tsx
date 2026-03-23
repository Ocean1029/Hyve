import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Space } from '../../theme';
import { Colors } from '../../theme';

interface Activity {
  label: string;
  hours: number;
}

interface ActivityBreakdownProps {
  activities: Activity[];
  themeColor: string;
}

export default function ActivityBreakdown({
  activities,
  themeColor,
}: ActivityBreakdownProps) {
  const maxHours = Math.max(...activities.map((a) => a.hours));

  return (
    <View style={styles.container}>
      {activities.map((activity) => {
        const ratio = maxHours > 0 ? activity.hours / maxHours : 0;
        return (
          <View key={activity.label} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{activity.label}</Text>
              <Text style={styles.hours}>{activity.hours}h</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    flex: ratio,
                    backgroundColor: themeColor,
                    ...Platform.select({
                      ios: {
                        shadowColor: themeColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                      },
                      android: {},
                    }),
                  },
                ]}
              />
              <View style={{ flex: 1 - ratio }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Space.md,
  },
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hours: {
    fontSize: 10,
    color: Colors.text3,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
