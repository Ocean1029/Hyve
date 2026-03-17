import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '../ui/GlassCard';
import { Colors, Space } from '../../theme';

interface Spot {
  name: string;
  visits: number;
}

interface SpotRankingListProps {
  spots: Spot[];
  themeColor: string;
}

export default function SpotRankingList({ spots, themeColor }: SpotRankingListProps) {
  return (
    <View style={styles.container}>
      {spots.map((spot, index) => {
        const rank = index + 1;
        const isTop = rank === 1;
        return (
          <GlassCard
            key={spot.name}
            padding={14}
            style={{
              ...styles.item,
              ...(!isTop && rank > 3 ? styles.dimItem : undefined),
            }}
          >
            <View
              style={[
                styles.rankCircle,
                isTop && {
                  backgroundColor: `${themeColor}30`,
                  borderColor: `${themeColor}60`,
                },
              ]}
            >
              <Text style={[styles.rankText, isTop && { color: themeColor }]}>
                {rank}
              </Text>
            </View>
            <View style={styles.nameColumn}>
              <Text style={styles.spotName}>{spot.name}</Text>
              {isTop && <Text style={styles.topLabel}>Top Sanctum</Text>}
            </View>
            <Text style={[styles.visits, isTop && { color: themeColor }]}>
              {spot.visits}
            </Text>
          </GlassCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Space.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dimItem: {
    opacity: 0.8,
  },
  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text2,
  },
  nameColumn: {
    flex: 1,
  },
  spotName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text1,
  },
  topLabel: {
    fontSize: 9,
    color: Colors.gold,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  visits: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text2,
  },
});
